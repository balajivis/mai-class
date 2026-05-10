import { Router } from 'express';
import { db, type AgentRow, type TaskRow, type ProjectRow } from '../db.js';
import { requireTeamToken } from '../auth.js';
import { decodeAgent, decodeEvent } from './events.js';

export const stateRouter = Router({ mergeParams: true });

stateRouter.get('/state', requireTeamToken, (req, res) => {
  const { projectId } = req.auth!;
  const project = db
    .prepare('SELECT id, name, alloc_mode, frozen FROM projects WHERE id = ?')
    .get(projectId) as Pick<ProjectRow, 'id' | 'name' | 'alloc_mode' | 'frozen'> | undefined;

  if (!project) {
    res.status(404).json({ error: 'project not found' });
    return;
  }

  const agents = (db
    .prepare('SELECT * FROM agents WHERE project_id = ? ORDER BY name')
    .all(projectId) as AgentRow[]).map(decodeAgent);

  const tasks = db
    .prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY id DESC LIMIT 200')
    .all(projectId) as TaskRow[];

  const events = (db
    .prepare('SELECT * FROM events WHERE project_id = ? ORDER BY id DESC LIMIT 100')
    .all(projectId) as any[]).map(decodeEvent);

  res.json({
    project,
    agents,
    tasks: tasks.map((t) => ({ ...t, requires: JSON.parse(t.requires) })),
    events,
  });
});
