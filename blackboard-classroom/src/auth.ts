import type { Request, Response, NextFunction } from 'express';
import { db, type ProjectRow } from './db.js';

const INSTRUCTOR_TOKEN = process.env.BB_INSTRUCTOR_TOKEN ?? 'instructor-dev-token';

export type AuthContext = {
  projectId: string;
  agentName: string | null;     // self-declared via X-Agent header
  role: 'team-member' | 'instructor';
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

function extractBearer(req: Request): string | null {
  const h = req.header('authorization');
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m && m[1] ? m[1].trim() : null;
}

/**
 * Project-scoped auth: token must match the team token for :proj OR be the instructor master token.
 * Self-declared agent identity lives in the X-Agent header (no enforcement; intentional —
 * students can spoof but the lesson is about coordination, not security theatre).
 */
export function requireTeamToken(req: Request, res: Response, next: NextFunction): void {
  const projectId = req.params.proj;
  if (!projectId) {
    res.status(400).json({ error: 'project id required' });
    return;
  }
  const token = extractBearer(req);
  if (!token) {
    res.status(401).json({ error: 'missing bearer token' });
    return;
  }

  if (token === INSTRUCTOR_TOKEN) {
    req.auth = {
      projectId,
      agentName: req.header('x-agent') ?? null,
      role: 'instructor',
    };
    next();
    return;
  }

  const project = db
    .prepare('SELECT * FROM projects WHERE id = ? AND team_token = ?')
    .get(projectId, token) as ProjectRow | undefined;

  if (!project) {
    res.status(403).json({ error: 'invalid token for project' });
    return;
  }

  req.auth = {
    projectId,
    agentName: req.header('x-agent') ?? null,
    role: 'team-member',
  };
  next();
}

export function requireInstructor(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (token !== INSTRUCTOR_TOKEN) {
    res.status(403).json({ error: 'instructor token required' });
    return;
  }
  req.auth = {
    projectId: req.params.proj ?? '',
    agentName: null,
    role: 'instructor',
  };
  next();
}
