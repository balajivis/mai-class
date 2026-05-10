import { Router } from 'express';
import { db, now, type TaskRow, type AgentRow } from '../db.js';
import { requireTeamToken } from '../auth.js';
import { publish, publishMany } from '../sse.js';
import { onTaskPost, adjustReputationOnClose } from '../allocation/index.js';

export const tasksRouter = Router({ mergeParams: true });

function decodeTask(row: TaskRow) {
  return {
    ...row,
    requires: row.requires ? JSON.parse(row.requires) : [],
  };
}

// POST /api/p/:proj/tasks — anyone with team token can post a task
tasksRouter.post('/tasks', requireTeamToken, (req, res) => {
  const { projectId, agentName, role } = req.auth!;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const title = String(body.title ?? '').slice(0, 200);
  if (!title) {
    res.status(400).json({ error: 'title required' });
    return;
  }
  const detail = String(body.detail ?? '');
  const requires = JSON.stringify(Array.isArray(body.requires) ? body.requires : []);
  const postedBy =
    (body.posted_by as string | undefined) ??
    agentName ??
    (role === 'instructor' ? 'instructor' : 'human:anonymous');
  const ts = now();

  const info = db
    .prepare(
      `INSERT INTO tasks (project_id, title, detail, requires, status, posted_by, created_at)
       VALUES (?, ?, ?, ?, 'open', ?, ?)`,
    )
    .run(projectId, title, detail, requires, postedBy, ts);

  const task = decodeTask(
    db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid) as TaskRow,
  );

  // Mirror as event for activity feed.
  db.prepare(
    `INSERT INTO events (project_id, agent_name, kind, performative, refs, payload, ts)
     VALUES (?, ?, 'task_post', 'request', '[]', ?, ?)`,
  ).run(projectId, postedBy, JSON.stringify({ task_id: task.id, title, requires: JSON.parse(requires) }), ts);

  // Run allocation hook (Modes A/B/C/D dispatch).
  const allocResult = onTaskPost(projectId, task as unknown as TaskRow);

  publish(`p:${projectId}`, 'task_post', { ...task, mode: allocResult.mode });

  // Per-agent fan-out: notify agents whose capabilities overlap the task's `requires`.
  // This is what powers the plugin's Monitor — students get a native CC notification
  // when a task lands that matches them.
  const requiresArr = JSON.parse(requires) as string[];
  if (requiresArr.length > 0) {
    const agents = db
      .prepare('SELECT name, capabilities FROM agents WHERE project_id = ?')
      .all(projectId) as Pick<AgentRow, 'name' | 'capabilities'>[];
    const channels: string[] = [];
    for (const a of agents) {
      const caps = a.capabilities ? (JSON.parse(a.capabilities) as string[]) : [];
      if (requiresArr.some((r) => caps.includes(r) || r === 'any')) {
        channels.push(`a:${projectId}:${a.name}`);
      }
    }
    if (channels.length > 0) publishMany(channels, 'task_offer', task);
  }

  res.status(201).json({ ok: true, task });
});

// GET /api/p/:proj/tasks — list (status filter optional)
tasksRouter.get('/tasks', requireTeamToken, (req, res) => {
  const { projectId } = req.auth!;
  const status = req.query.status as string | undefined;
  const rows = (status
    ? db
        .prepare('SELECT * FROM tasks WHERE project_id = ? AND status = ? ORDER BY id DESC')
        .all(projectId, status)
    : db
        .prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY id DESC')
        .all(projectId)) as TaskRow[];
  res.json({ tasks: rows.map(decodeTask) });
});

// PATCH /api/p/:proj/tasks/:id/claim — first-claim-wins (Mode A baseline)
tasksRouter.patch('/tasks/:id/claim', requireTeamToken, (req, res) => {
  const { projectId, agentName } = req.auth!;
  const taskId = Number(req.params.id);
  const claimer = (req.body?.agent as string | undefined) ?? agentName;
  if (!claimer) {
    res.status(400).json({ error: 'agent name required (X-Agent header or body.agent)' });
    return;
  }
  const ts = now();
  const result = db
    .prepare(
      `UPDATE tasks
         SET status = 'claimed', claimed_by = ?, claimed_at = ?
       WHERE id = ? AND project_id = ? AND status = 'open'`,
    )
    .run(claimer, ts, taskId, projectId);

  if (result.changes === 0) {
    res.status(409).json({ error: 'task not open or already claimed' });
    return;
  }

  const task = decodeTask(
    db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as TaskRow,
  );

  db.prepare(
    `INSERT INTO events (project_id, agent_name, kind, performative, refs, payload, ts)
     VALUES (?, ?, 'task_claim', 'commit', '[]', ?, ?)`,
  ).run(projectId, claimer, JSON.stringify({ task_id: taskId, title: task.title }), ts);

  publish(`p:${projectId}`, 'task_claim', task);
  res.json({ ok: true, task });
});

// POST /api/p/:proj/tasks/:id/bid — stores a bid (Slice 6 wires mode logic)
tasksRouter.post('/tasks/:id/bid', requireTeamToken, (req, res) => {
  const { projectId, agentName } = req.auth!;
  const taskId = Number(req.params.id);
  const body = (req.body ?? {}) as Record<string, unknown>;
  const agent = (body.agent as string | undefined) ?? agentName;
  if (!agent) {
    res.status(400).json({ error: 'agent required' });
    return;
  }
  const cost = Number(body.cost ?? 0.5);
  const confidence = Number(body.confidence ?? 0.5);
  const eta = Number(body.eta_seconds ?? 60);
  const note = (body.note as string | undefined) ?? null;
  const ts = now();

  // Verify task exists in this project.
  const task = db
    .prepare('SELECT * FROM tasks WHERE id = ? AND project_id = ?')
    .get(taskId, projectId) as TaskRow | undefined;
  if (!task) {
    res.status(404).json({ error: 'task not found' });
    return;
  }

  const info = db
    .prepare(
      `INSERT INTO bids (task_id, agent_name, cost, confidence, eta_seconds, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(taskId, agent, cost, confidence, eta, note, ts);

  // Mark task as bidding (Slice 6 will sweep + award on a timer per mode).
  db.prepare(`UPDATE tasks SET status = 'bidding' WHERE id = ? AND status = 'open'`).run(taskId);

  db.prepare(
    `INSERT INTO events (project_id, agent_name, kind, performative, refs, payload, ts)
     VALUES (?, ?, 'bid', 'commit', '[]', ?, ?)`,
  ).run(projectId, agent, JSON.stringify({ task_id: taskId, cost, confidence, eta }), ts);

  publish(`p:${projectId}`, 'bid', { task_id: taskId, agent, cost, confidence, eta, note });
  res.status(201).json({ ok: true, bid_id: info.lastInsertRowid });
});

// PATCH /api/p/:proj/tasks/:id/complete
tasksRouter.patch('/tasks/:id/complete', requireTeamToken, (req, res) => {
  const { projectId, agentName } = req.auth!;
  const taskId = Number(req.params.id);
  const claimer = (req.body?.agent as string | undefined) ?? agentName;
  const ok = req.body?.ok !== false;
  const result = String(req.body?.result ?? '');
  const lessons = (req.body?.lessons as string | undefined) ?? null;
  const ts = now();

  const update = db.prepare(
    `UPDATE tasks
       SET status = ?, result = ?, lessons = ?, closed_at = ?
     WHERE id = ? AND project_id = ?`,
  );
  const status = ok ? 'done' : 'failed';
  const change = update.run(status, result, lessons, ts, taskId, projectId);
  if (change.changes === 0) {
    res.status(404).json({ error: 'task not found' });
    return;
  }
  const task = decodeTask(
    db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as TaskRow,
  );

  db.prepare(
    `INSERT INTO events (project_id, agent_name, kind, performative, refs, payload, ts)
     VALUES (?, ?, ?, ?, '[]', ?, ?)`,
  ).run(
    projectId,
    claimer ?? null,
    ok ? 'task_complete' : 'task_fail',
    ok ? 'inform' : 'block',
    JSON.stringify({ task_id: taskId, result, lessons }),
    ts,
  );

  publish(`p:${projectId}`, ok ? 'task_complete' : 'task_fail', task);

  // Reputation update (used in Mode D scoring).
  adjustReputationOnClose(projectId, claimer ?? null, ok);

  res.json({ ok: true, task });
});
