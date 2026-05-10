import { Router } from 'express';
import { db } from '../db.js';
import { requireTeamToken } from '../auth.js';
import { computeAll, computeL2, computeL3 } from '../eval/index.js';

export const evalRouter = Router({ mergeParams: true });

// GET /api/p/:proj/eval — full L1/L2/L3 readout
evalRouter.get('/eval', requireTeamToken, (req, res) => {
  const { projectId } = req.auth!;
  res.json(computeAll(projectId));
});

// GET /api/eval/master — instructor master view: 5-team scoreboard
export const masterEvalRouter = Router();
masterEvalRouter.get('/eval/master', (req, res) => {
  // No auth: master view is read-only and the dashboard is fronted by the instructor.
  // (Tighten this when prod-deploying — Slice 10.)
  const projects = db.prepare('SELECT id, name, alloc_mode, frozen FROM projects').all() as any[];
  const summary = projects.map((p) => ({
    project: p,
    L2: computeL2(p.id),
    L3: computeL3(p.id),
  }));
  res.json({ projects: summary });
});
