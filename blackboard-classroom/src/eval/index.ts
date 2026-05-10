/**
 * Three-level evaluation (Pillar #15).
 *
 *   L1 · Per-agent      — tasks done/failed, avg time-on-task, reputation, escalations
 *   L2 · Combined output — task throughput, completion rate, tests/build markers
 *   L3 · Coordination    — conflicts, idle agents, redundancy, channel count
 *
 * The point of three tiers: a project where L1 and L2 look healthy can have a
 * silent L3 collapse — that is the failure mode this whole course exists to surface.
 */
import { db, now } from '../db.js';

export type L1Agent = {
  name: string;
  role: string;
  reputation: number;
  status: string;
  tasks_done: number;
  tasks_failed: number;
  tasks_claimed: number;
  avg_time_on_task_s: number | null;
  escalates_posted: number;
  events_total: number;
};

export type L2Output = {
  tasks_total: number;
  tasks_done: number;
  tasks_failed: number;
  tasks_open: number;
  tasks_claimed: number;
  completion_rate: number;          // done / (done+failed) — null if denom=0
  build_passes: boolean | null;     // signal from completed tasks (Slice 9 will tighten)
  tests_pass: boolean | null;
};

export type L3Coordination = {
  channel_count: number;            // unique ordered (A,B) pairs that exchanged events in the last window
  conflicts: number;                // claim-collisions and bid-losers in the last window
  idle_agents: number;              // agents whose last event > IDLE_MS ago
  redundancy: number;               // tasks with the same lowercased title posted ≥2 times
  events_per_min: number;           // raw "coordination tax" indicator
  performative_mix: Record<string, number>;
};

const WINDOW_MS = 5 * 60 * 1000;
const IDLE_MS   = 90 * 1000;

export function computeL1(projectId: string): L1Agent[] {
  const agents = db.prepare(`SELECT * FROM agents WHERE project_id = ?`).all(projectId) as any[];
  const taskRows = db.prepare(
    `SELECT claimed_by, status, claimed_at, closed_at FROM tasks WHERE project_id = ? AND claimed_by IS NOT NULL`,
  ).all(projectId) as any[];
  const eventRows = db.prepare(
    `SELECT agent_name, performative, COUNT(*) as n FROM events WHERE project_id = ? GROUP BY agent_name, performative`,
  ).all(projectId) as any[];

  const byAgent = new Map<string, any>();
  for (const a of agents) {
    byAgent.set(a.name, {
      name: a.name,
      role: a.role,
      reputation: a.reputation,
      status: a.status,
      tasks_done: 0,
      tasks_failed: 0,
      tasks_claimed: 0,
      _times: [] as number[],
      escalates_posted: 0,
      events_total: 0,
    });
  }
  for (const t of taskRows) {
    const r = byAgent.get(t.claimed_by);
    if (!r) continue;
    if (t.status === 'done') r.tasks_done += 1;
    else if (t.status === 'failed') r.tasks_failed += 1;
    else r.tasks_claimed += 1;
    if (t.claimed_at && t.closed_at) r._times.push((t.closed_at - t.claimed_at) / 1000);
  }
  for (const e of eventRows) {
    const r = byAgent.get(e.agent_name);
    if (!r) continue;
    r.events_total += e.n;
    if (e.performative === 'escalate') r.escalates_posted += e.n;
  }
  return [...byAgent.values()].map(({ _times, ...rest }) => ({
    ...rest,
    avg_time_on_task_s: _times.length === 0 ? null : Math.round(_times.reduce((a: number, b: number) => a + b, 0) / _times.length),
  }));
}

export function computeL2(projectId: string): L2Output {
  const agg = db.prepare(
    `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status='done' THEN 1 ELSE 0 END)    AS done,
        SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END)  AS failed,
        SUM(CASE WHEN status='open' THEN 1 ELSE 0 END)    AS open_,
        SUM(CASE WHEN status='claimed' THEN 1 ELSE 0 END) AS claimed
       FROM tasks WHERE project_id = ?`,
  ).get(projectId) as any;

  // Heuristic build/tests markers from result strings until Slice 9 ships real CI signal.
  const lastResults = db.prepare(
    `SELECT result FROM tasks WHERE project_id = ? AND result IS NOT NULL ORDER BY closed_at DESC LIMIT 30`,
  ).all(projectId) as { result: string }[];
  const blob = lastResults.map((r) => r.result).join('\n').toLowerCase();
  const buildPasses = /build (passes|ok|✓)|build:\s*green/.test(blob)
    ? true
    : /build (fails|broken|✗)|build:\s*red/.test(blob)
    ? false
    : null;
  const testsPass = /tests pass|all tests/.test(blob) ? true : /tests fail/.test(blob) ? false : null;

  const denom = (agg.done ?? 0) + (agg.failed ?? 0);
  return {
    tasks_total: agg.total ?? 0,
    tasks_done: agg.done ?? 0,
    tasks_failed: agg.failed ?? 0,
    tasks_open: agg.open_ ?? 0,
    tasks_claimed: agg.claimed ?? 0,
    completion_rate: denom === 0 ? 0 : (agg.done ?? 0) / denom,
    build_passes: buildPasses,
    tests_pass: testsPass,
  };
}

export function computeL3(projectId: string): L3Coordination {
  const cutoff = now() - WINDOW_MS;
  const events = db.prepare(
    `SELECT agent_name, kind, performative, refs, ts FROM events WHERE project_id = ? AND ts >= ?`,
  ).all(projectId, cutoff) as any[];

  // Channel count: ordered (sender, ref) pairs.
  const channels = new Set<string>();
  const performative_mix: Record<string, number> = {};
  for (const e of events) {
    if (e.performative) performative_mix[e.performative] = (performative_mix[e.performative] ?? 0) + 1;
    if (!e.agent_name || !e.refs) continue;
    let refs: string[] = [];
    try { refs = JSON.parse(e.refs); } catch { /* ignore */ }
    for (const r of refs) channels.add(`${e.agent_name}->${r}`);
  }

  // Conflicts: bid_rejected + concurrent claim collisions (heuristic: bids that lost).
  const lostBids = db.prepare(
    `SELECT COUNT(*) AS n FROM bids b
       JOIN tasks t ON t.id = b.task_id
      WHERE t.project_id = ?
        AND t.claimed_by IS NOT NULL
        AND t.claimed_by != b.agent_name
        AND b.created_at >= ?`,
  ).get(projectId, cutoff) as { n: number };
  const conflicts = lostBids.n;

  // Idle agents: last_seen older than IDLE_MS.
  const idleNow = now() - IDLE_MS;
  const idleRows = db.prepare(
    `SELECT COUNT(*) AS n FROM agents WHERE project_id = ? AND last_seen < ? AND status != 'killed'`,
  ).get(projectId, idleNow) as { n: number };

  // Redundancy: same lowercased title posted ≥2 times.
  const redundantTitles = db.prepare(
    `SELECT LOWER(TRIM(title)) AS k, COUNT(*) AS n FROM tasks WHERE project_id = ? GROUP BY k HAVING n >= 2`,
  ).all(projectId) as { n: number }[];
  const redundancy = redundantTitles.reduce((s, r) => s + (r.n - 1), 0);

  return {
    channel_count: channels.size,
    conflicts,
    idle_agents: idleRows.n,
    redundancy,
    events_per_min: events.length / (WINDOW_MS / 60_000),
    performative_mix,
  };
}

export function computeAll(projectId: string) {
  return {
    project_id: projectId,
    L1: computeL1(projectId),
    L2: computeL2(projectId),
    L3: computeL3(projectId),
    ts: now(),
  };
}
