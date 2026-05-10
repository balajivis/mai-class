import express from 'express';
import { eventsRouter } from './routes/events.js';
import { tasksRouter } from './routes/tasks.js';
import { stateRouter } from './routes/state.js';
import { streamRouter } from './routes/stream.js';
import { lessonsRouter } from './routes/lessons.js';
import { instructorRouter } from './routes/instructor.js';
import { evalRouter, masterEvalRouter } from './routes/eval.js';
import { snapshotRouter } from './routes/snapshot.js';
import { sweepDueAuctions } from './allocation/index.js';
import { db } from './db.js';

const PORT = Number(process.env.PORT ?? 3007);

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '512kb' }));

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// Per-project mounted routes.
app.use('/api/p/:proj', eventsRouter);
app.use('/api/p/:proj', tasksRouter);
app.use('/api/p/:proj', stateRouter);
app.use('/api/p/:proj', streamRouter);
app.use('/api/p/:proj', lessonsRouter);
app.use('/api/p/:proj', evalRouter);
app.use('/api/p/:proj', snapshotRouter);
app.use('/api/instructor/p/:proj', instructorRouter);
app.use('/api', masterEvalRouter);

// Auction sweeper — awards Mode C/D auctions whose bidding window has passed.
setInterval(() => {
  try { sweepDueAuctions(); } catch (e) { console.error('[sweep]', e); }
}, 2_000).unref();

// Static assets (style.css, JS files, etc.)
app.use(express.static(new URL('../public', import.meta.url).pathname));

// Pretty URLs: /projects/:proj  →  projects.html (proj read from path on client)
app.get('/projects/:proj', (req, res) => {
  res.sendFile(new URL('../public/projects.html', import.meta.url).pathname);
});
app.get('/master', (_req, res) => {
  res.sendFile(new URL('../public/master.html', import.meta.url).pathname);
});
app.get('/projects/:proj/replay', (_req, res) => {
  res.sendFile(new URL('../public/replay.html', import.meta.url).pathname);
});
app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html><meta charset=utf-8><title>Blackboard Classroom</title>
<body style="background:#09090b;color:#fafafa;font:14px ui-sans-serif;padding:2rem">
<h1 style="color:#f59e0b">Blackboard Classroom</h1>
<p>Per-team dashboards: <code>/projects/teamN?token=…</code></p>
<p>Master view: <code>/master?token=instructor-token</code></p>
<p>API: <code>/api/p/:proj/*</code> · health: <a href="/healthz" style="color:#f59e0b">/healthz</a></p>
</body>`);
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'not found', path: req.path });
});

app.listen(PORT, () => {
  const projectCount = (db.prepare('SELECT COUNT(*) as n FROM projects').get() as { n: number }).n;
  console.log(`[blackboard-classroom] listening on :${PORT}  (${projectCount} projects in DB)`);
});
