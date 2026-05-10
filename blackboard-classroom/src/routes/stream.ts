import { Router } from 'express';
import { requireTeamToken } from '../auth.js';
import { attach } from '../sse.js';

export const streamRouter = Router({ mergeParams: true });

// SSE: project-wide stream (for dashboards)
streamRouter.get('/stream', requireTeamToken, (req, res) => {
  const { projectId } = req.auth!;
  attach(res, `p:${projectId}`);
});

// SSE: per-agent stream (for plugin Monitor)
streamRouter.get('/agents/:agent/stream', requireTeamToken, (req, res) => {
  const { projectId } = req.auth!;
  const agent = req.params.agent;
  attach(res, `a:${projectId}:${agent}`);
});
