import { Router } from 'express';
import { db, now, type AgentRow } from '../db.js';
import { requireTeamToken } from '../auth.js';
import { publish } from '../sse.js';

export const eventsRouter = Router({ mergeParams: true });

const KNOWN_PERFORMATIVES = new Set(['request', 'inform', 'commit', 'block', 'escalate']);

eventsRouter.post('/events', requireTeamToken, (req, res) => {
  const { projectId, agentName: headerAgent } = req.auth!;
  const body = (req.body ?? {}) as Record<string, unknown>;

  const agentName = (body.agent as string | undefined) ?? headerAgent ?? null;
  const kind = (body.kind as string | undefined) ?? 'tool_use';
  const performative = ((): string | null => {
    const p = body.performative as string | undefined;
    if (!p) return null;
    return KNOWN_PERFORMATIVES.has(p) ? p : null;
  })();
  const refs = JSON.stringify(Array.isArray(body.refs) ? body.refs : []);
  const payload = JSON.stringify(body.payload ?? {});
  const ts = now();

  const stmt = db.prepare(
    `INSERT INTO events (project_id, agent_name, kind, performative, refs, payload, ts)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const info = stmt.run(projectId, agentName, kind, performative, refs, payload, ts);

  // Touch the agent's last_seen / register if new (auto-register on first event).
  if (agentName) {
    const upsert = db.prepare(
      `INSERT INTO agents (project_id, name, role, capabilities, status, last_seen, human_owner)
       VALUES (?, ?, ?, ?, 'working', ?, ?)
       ON CONFLICT(project_id, name) DO UPDATE SET last_seen = excluded.last_seen, status = 'working'`,
    );
    const role = (body.role as string | undefined) ?? agentName.split('-').pop() ?? 'unknown';
    const caps = JSON.stringify(Array.isArray(body.capabilities) ? body.capabilities : []);
    const owner = (body.human_owner as string | undefined) ?? null;
    upsert.run(projectId, agentName, role, caps, ts, owner);
  }

  const event = {
    id: info.lastInsertRowid,
    project_id: projectId,
    agent_name: agentName,
    kind,
    performative,
    refs: JSON.parse(refs),
    payload: JSON.parse(payload),
    ts,
  };
  publish(`p:${projectId}`, 'event', event);
  if (agentName) publish(`a:${projectId}:${agentName}`, 'event', event);

  res.status(201).json({ ok: true, id: info.lastInsertRowid, ts });
});

eventsRouter.get('/events', requireTeamToken, (req, res) => {
  const { projectId } = req.auth!;
  const limit = Math.min(Number(req.query.limit ?? 200), 1000);
  const since = req.query.since ? Number(req.query.since) : 0;
  const rows = db
    .prepare(
      `SELECT * FROM events WHERE project_id = ? AND ts >= ? ORDER BY ts DESC LIMIT ?`,
    )
    .all(projectId, since, limit);
  res.json({ events: rows.map(decodeEvent) });
});

export function decodeEvent(row: any) {
  return {
    ...row,
    refs: row.refs ? JSON.parse(row.refs) : [],
    payload: row.payload ? JSON.parse(row.payload) : {},
  };
}

export function decodeAgent(row: AgentRow) {
  return {
    ...row,
    capabilities: row.capabilities ? JSON.parse(row.capabilities) : [],
  };
}
