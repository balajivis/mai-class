import { Router } from 'express';
import { db, now } from '../db.js';
import { requireTeamToken } from '../auth.js';
import { publish } from '../sse.js';

export const snapshotRouter = Router({ mergeParams: true });

// POST /api/p/:proj/snapshot  body: { agent, git_sha, note? }
snapshotRouter.post('/snapshot', requireTeamToken, (req, res) => {
  const { projectId, agentName } = req.auth!;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const agent = (body.agent as string | undefined) ?? agentName ?? 'unknown';
  const sha = String(body.git_sha ?? '').slice(0, 40);
  const note = (body.note as string | undefined) ?? null;
  if (!sha) {
    res.status(400).json({ error: 'git_sha required' });
    return;
  }
  const ts = now();
  db.prepare(
    `INSERT INTO snapshots (project_id, agent_name, git_sha, note, ts) VALUES (?, ?, ?, ?, ?)`,
  ).run(projectId, agent, sha, note, ts);

  publish(`p:${projectId}`, 'snapshot', { agent, sha, note, ts });
  res.status(201).json({ ok: true, ts });
});

// GET /api/p/:proj/snapshots?agent=X&limit=20
snapshotRouter.get('/snapshots', requireTeamToken, (req, res) => {
  const { projectId } = req.auth!;
  const agent = req.query.agent as string | undefined;
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const rows = agent
    ? db.prepare(
        `SELECT * FROM snapshots WHERE project_id = ? AND agent_name = ? ORDER BY ts DESC LIMIT ?`,
      ).all(projectId, agent, limit)
    : db.prepare(
        `SELECT * FROM snapshots WHERE project_id = ? ORDER BY ts DESC LIMIT ?`,
      ).all(projectId, limit);
  res.json({ snapshots: rows });
});
