import { Router } from 'express';
import { db, now } from '../db.js';
import { requireInstructor } from '../auth.js';
import { publish } from '../sse.js';

export const instructorRouter = Router({ mergeParams: true });

// PATCH /api/instructor/p/:proj/mode  { mode: 'A'|'B'|'C'|'D' }
instructorRouter.patch('/mode', requireInstructor, (req, res) => {
  const { projectId } = req.auth!;
  const mode = String(req.body?.mode ?? '').toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(mode)) {
    res.status(400).json({ error: 'mode must be A|B|C|D' });
    return;
  }
  const r = db.prepare('UPDATE projects SET alloc_mode = ? WHERE id = ?').run(mode, projectId);
  if (r.changes === 0) {
    res.status(404).json({ error: 'project not found' });
    return;
  }
  db.prepare(
    `INSERT INTO events (project_id, agent_name, kind, performative, refs, payload, ts)
     VALUES (?, NULL, 'mode_change', 'inform', '[]', ?, ?)`,
  ).run(projectId, JSON.stringify({ mode }), now());
  publish(`p:${projectId}`, 'mode_change', { mode });
  res.json({ ok: true, mode });
});

// PATCH /api/instructor/p/:proj/freeze  { frozen: bool }
instructorRouter.patch('/freeze', requireInstructor, (req, res) => {
  const { projectId } = req.auth!;
  const frozen = req.body?.frozen ? 1 : 0;
  db.prepare('UPDATE projects SET frozen = ? WHERE id = ?').run(frozen, projectId);
  publish(`p:${projectId}`, 'freeze', { frozen: !!frozen });
  res.json({ ok: true, frozen: !!frozen });
});

// POST /api/instructor/p/:proj/broadcast  { text }
instructorRouter.post('/broadcast', requireInstructor, (req, res) => {
  const { projectId } = req.auth!;
  const text = String(req.body?.text ?? '');
  if (!text) {
    res.status(400).json({ error: 'text required' });
    return;
  }
  const ts = now();
  db.prepare(
    `INSERT INTO events (project_id, agent_name, kind, performative, refs, payload, ts)
     VALUES (?, 'instructor', 'message', 'escalate', '[]', ?, ?)`,
  ).run(projectId, JSON.stringify({ text }), ts);
  publish(`p:${projectId}`, 'broadcast', { text, ts });
  res.json({ ok: true });
});

// POST /api/instructor/p/:proj/kill-agent  { agent }
instructorRouter.post('/kill-agent', requireInstructor, (req, res) => {
  const { projectId } = req.auth!;
  const agent = String(req.body?.agent ?? '');
  if (!agent) {
    res.status(400).json({ error: 'agent required' });
    return;
  }
  db.prepare(`UPDATE agents SET status = 'killed' WHERE project_id = ? AND name = ?`).run(projectId, agent);
  publish(`p:${projectId}`, 'kill-agent', { agent });
  publish(`a:${projectId}:${agent}`, 'kill', { reason: 'instructor' });
  res.json({ ok: true });
});
