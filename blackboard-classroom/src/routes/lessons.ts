import { Router } from 'express';
import { db } from '../db.js';
import { requireTeamToken } from '../auth.js';

export const lessonsRouter = Router({ mergeParams: true });

/**
 * GET /api/p/:proj/lessons?requires=frontend,tests&limit=5
 * Returns recent failed-or-flagged tasks whose `requires` overlap any of the given tags.
 * Source for the stigmergic-learning pillar (#9).
 */
lessonsRouter.get('/lessons', requireTeamToken, (req, res) => {
  const { projectId } = req.auth!;
  const limit = Math.min(Number(req.query.limit ?? 5), 50);
  const requires = String(req.query.requires ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Pull recent tasks with non-null lessons OR status='failed', then filter by overlap.
  const rows = db
    .prepare(
      `SELECT id, title, requires, status, claimed_by, lessons, closed_at
         FROM tasks
        WHERE project_id = ?
          AND (lessons IS NOT NULL OR status = 'failed')
        ORDER BY closed_at DESC
        LIMIT 200`,
    )
    .all(projectId) as any[];

  const filtered = rows
    .map((r) => ({ ...r, requires: r.requires ? JSON.parse(r.requires) : [] }))
    .filter((r) =>
      requires.length === 0 || (r.requires as string[]).some((tag) => requires.includes(tag)),
    )
    .slice(0, limit);

  res.json({ lessons: filtered });
});
