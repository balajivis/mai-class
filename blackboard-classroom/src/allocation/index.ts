/**
 * Task allocation engine.
 *
 *   A · Free-for-all          first-claim wins, no tags consulted
 *   B · Capability-matched    when posted, auto-claim by best matching agent
 *   C · Contract-net          gather bids for BIDDING_WINDOW_MS, then award by score
 *   D · Reputation-weighted   like C, but score *= agent.reputation^reputationWeight
 *
 * Public surface:
 *   onTaskPost(projectId, task)    — called from POST /tasks
 *   onBid(projectId, taskId)       — called from POST /tasks/:id/bid (resets the timer)
 *   sweepDueAuctions()             — called from a setInterval; awards auctions whose timer expired
 */
import { db, now, type AgentRow, type TaskRow, type ProjectRow } from '../db.js';
import { publish, publishMany } from '../sse.js';

export const BIDDING_WINDOW_MS = Number(process.env.BB_BID_WINDOW_MS ?? 8_000);
const REPUTATION_WEIGHT = 1.0;

type BidRow = {
  id: number;
  task_id: number;
  agent_name: string;
  cost: number;
  confidence: number;
  eta_seconds: number;
  note: string | null;
  created_at: number;
};

function getProject(projectId: string): ProjectRow | undefined {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as ProjectRow | undefined;
}

function getAgents(projectId: string): AgentRow[] {
  return db.prepare('SELECT * FROM agents WHERE project_id = ?').all(projectId) as AgentRow[];
}

function decodeAgent(a: AgentRow): AgentRow & { capabilities: string[] } {
  return { ...a, capabilities: a.capabilities ? (JSON.parse(a.capabilities) as string[]) : [] } as any;
}

function awardTo(projectId: string, taskId: number, agentName: string, mode: string, reason: string) {
  const ts = now();
  const result = db
    .prepare(
      `UPDATE tasks
         SET status = 'claimed', claimed_by = ?, claimed_at = ?
       WHERE id = ? AND project_id = ? AND status IN ('open', 'bidding')`,
    )
    .run(agentName, ts, taskId, projectId);
  if (result.changes === 0) return null;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as TaskRow;

  db.prepare(
    `INSERT INTO events (project_id, agent_name, kind, performative, refs, payload, ts)
     VALUES (?, ?, 'task_claim', 'commit', '[]', ?, ?)`,
  ).run(projectId, agentName, JSON.stringify({ task_id: taskId, mode, reason }), ts);

  const decoded = { ...task, requires: task.requires ? JSON.parse(task.requires) : [] };
  publish(`p:${projectId}`, 'task_claim', decoded);
  publish(`a:${projectId}:${agentName}`, 'task_award', decoded);
  return decoded;
}

/**
 * Mode B: when a task is posted, immediately auto-route to the agent with the most
 * capability overlap (ties broken by lowest current claimed-task count).
 */
function parseRequires(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string' && raw) {
    try { return JSON.parse(raw) as string[]; } catch { return []; }
  }
  return [];
}

function tryAutoMatchModeB(projectId: string, task: TaskRow): boolean {
  const requires = parseRequires(task.requires);
  if (requires.length === 0) return false;
  const agents = getAgents(projectId).map(decodeAgent);
  const ranked = agents
    .map((a) => ({
      a,
      overlap: a.capabilities.filter((c) => requires.includes(c)).length,
    }))
    .filter((x) => x.overlap > 0)
    .sort((x, y) => y.overlap - x.overlap);
  if (ranked.length === 0) return false;

  // Tie-break by current load.
  const top = ranked.filter((x) => x.overlap === ranked[0]!.overlap);
  let best = top[0]!.a.name;
  if (top.length > 1) {
    const counts = db.prepare(
      `SELECT claimed_by AS name, COUNT(*) AS n FROM tasks
        WHERE project_id = ? AND status = 'claimed' AND claimed_by IN (${top.map(() => '?').join(',')})
        GROUP BY claimed_by`,
    ).all(projectId, ...top.map((x) => x.a.name)) as { name: string; n: number }[];
    const cmap = new Map(counts.map((c) => [c.name, c.n]));
    best = top.sort((x, y) => (cmap.get(x.a.name) ?? 0) - (cmap.get(y.a.name) ?? 0))[0]!.a.name;
  }
  return awardTo(projectId, task.id, best, 'B', `capability-match (overlap=${ranked[0]!.overlap})`) !== null;
}

/** Score a bid: higher = better. */
function scoreBid(bid: BidRow, agent: { reputation: number } | undefined, mode: 'C' | 'D'): number {
  // Higher confidence is better. Higher cost and longer eta are worse.
  // Normalise eta so 30s → ~1.0 weight, 600s → ~0.05.
  const etaWeight = 30 / Math.max(bid.eta_seconds, 1);
  const base = bid.confidence * etaWeight - bid.cost * 0.5;
  if (mode === 'D' && agent) {
    return base * Math.pow(Math.max(agent.reputation, 0.05), REPUTATION_WEIGHT);
  }
  return base;
}

/** Award a contract-net auction — picks the highest-scoring bid (no auto-cancel if zero bids). */
function awardAuction(projectId: string, task: TaskRow, mode: 'C' | 'D'): boolean {
  const bids = db.prepare('SELECT * FROM bids WHERE task_id = ? ORDER BY id ASC').all(task.id) as BidRow[];
  if (bids.length === 0) {
    // Fall back: re-open and let humans handle.
    db.prepare(`UPDATE tasks SET status = 'open' WHERE id = ?`).run(task.id);
    publish(`p:${projectId}`, 'auction_void', { task_id: task.id, reason: 'no bids' });
    return false;
  }
  const agents = new Map(getAgents(projectId).map((a) => [a.name, a]));
  const ranked = bids
    .map((b) => ({ b, score: scoreBid(b, agents.get(b.agent_name), mode) }))
    .sort((x, y) => y.score - x.score);

  const winner = ranked[0]!.b;
  const losers = ranked.slice(1).map((x) => x.b.agent_name);

  awardTo(projectId, task.id, winner.agent_name, mode, `contract-net winner score=${ranked[0]!.score.toFixed(2)}`);
  if (losers.length > 0) {
    publishMany(losers.map((l) => `a:${projectId}:${l}`), 'bid_rejected', {
      task_id: task.id, winner: winner.agent_name,
    });
  }
  return true;
}

/** Update reputation when a task closes (Mode D learning signal). */
export function adjustReputationOnClose(projectId: string, agentName: string | null, ok: boolean) {
  if (!agentName) return;
  // Beta-reputation: success += 1, failure += 1 separately; reputation = (success+1)/(success+failure+2).
  // Simpler approximation: ema toward target ∈ {1, 0} with α=0.2.
  const row = db.prepare('SELECT reputation FROM agents WHERE project_id = ? AND name = ?')
    .get(projectId, agentName) as { reputation: number } | undefined;
  if (!row) return;
  const target = ok ? 1 : 0;
  const next = row.reputation + 0.2 * (target - row.reputation);
  db.prepare('UPDATE agents SET reputation = ? WHERE project_id = ? AND name = ?')
    .run(next, projectId, agentName);
}

/** Called from POST /tasks immediately after insert. Returns true if auto-allocated. */
export function onTaskPost(projectId: string, task: TaskRow): { auto: boolean; mode: string } {
  const project = getProject(projectId);
  if (!project) return { auto: false, mode: 'A' };
  if (project.frozen) return { auto: false, mode: project.alloc_mode };
  const mode = project.alloc_mode;
  if (mode === 'B') {
    return { auto: tryAutoMatchModeB(projectId, task), mode };
  }
  if (mode === 'C' || mode === 'D') {
    // Move into bidding immediately; auction will resolve when sweepDueAuctions runs.
    db.prepare(`UPDATE tasks SET status = 'bidding' WHERE id = ?`).run(task.id);
    publish(`p:${projectId}`, 'auction_open', { task_id: task.id, window_ms: BIDDING_WINDOW_MS });
  }
  // Mode A: do nothing — first claim wins.
  return { auto: false, mode };
}

/** Called every ~2s by the server. Awards any auctions whose window has passed. */
export function sweepDueAuctions(): void {
  const cutoff = now() - BIDDING_WINDOW_MS;
  const tasks = db
    .prepare(
      `SELECT t.* FROM tasks t
        JOIN projects p ON p.id = t.project_id
       WHERE t.status = 'bidding'
         AND t.created_at < ?
         AND p.alloc_mode IN ('C', 'D')
         AND p.frozen = 0`,
    )
    .all(cutoff) as TaskRow[];
  for (const t of tasks) {
    const proj = getProject(t.project_id);
    if (!proj) continue;
    awardAuction(t.project_id, t, proj.alloc_mode as 'C' | 'D');
  }
}
