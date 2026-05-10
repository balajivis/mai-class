/**
 * Pre-populates each of the 5 team blackboards with ~12 starter tasks.
 * Run after `npm run tokens` and before students arrive.
 *
 *   npm run seed
 *
 * Idempotent: re-running clears existing open/claimed tasks for these projects
 * and re-inserts the seed list (snapshots and events are preserved).
 */
import { db, now } from '../src/db.js';

type Seed = { title: string; detail: string; requires: string[] };

const TASKS: Record<string, Seed[]> = {
  team1: [
    { title: 'Stand up the CLI entry point', detail: 'src/cli.ts; argparse-style command dispatch', requires: ['backend'] },
    { title: 'Implement add-lead command', detail: 'name + email; append JSON to data/leads.json', requires: ['backend'] },
    { title: 'Implement list command', detail: 'pretty-print all leads, paginated', requires: ['frontend'] },
    { title: 'Implement convert command', detail: 'mark a lead as customer; transition state', requires: ['backend'] },
    { title: 'Implement report command', detail: 'count by status, last 7d signups', requires: ['backend'] },
    { title: 'Storage abstraction', detail: 'data/storage.ts wraps fs with locks', requires: ['db'] },
    { title: 'Validation layer', detail: 'parse + validate input; reject malformed', requires: ['backend'] },
    { title: 'Unit tests for add-lead', detail: 'happy path + 2 error paths', requires: ['tests'] },
    { title: 'Unit tests for convert', detail: 'covers state transitions', requires: ['tests'] },
    { title: 'README quickstart', detail: 'install + usage + 3 examples', requires: ['docs'] },
    { title: 'Lint + format pass', detail: 'eslint + prettier configs', requires: ['devops'] },
    { title: 'Build script', detail: 'package.json scripts; tsc check', requires: ['devops'] },
  ],
  team2: [
    { title: 'Pokemon entity', detail: 'name, types, hp, moveset, stats', requires: ['backend'] },
    { title: 'Move definitions', detail: '20 starter moves; type, power, accuracy', requires: ['backend'] },
    { title: 'Type chart', detail: 'effectiveness multipliers; lookup table', requires: ['backend'] },
    { title: 'Damage formula', detail: 'classic gen-2 formula; type effectiveness', requires: ['backend'] },
    { title: 'Battle loop', detail: 'turn-based; choose move; resolve', requires: ['backend'] },
    { title: 'CLI battle UI', detail: 'show hp bars, move menu, log', requires: ['frontend'] },
    { title: 'AI opponent', detail: 'choose best move by expected damage', requires: ['backend'] },
    { title: 'Status conditions', detail: 'burn / paralyze / sleep effects', requires: ['backend'] },
    { title: 'Tests for damage formula', detail: 'verify against known matchups', requires: ['tests'] },
    { title: 'Tests for type chart', detail: 'all matchups verified', requires: ['tests'] },
    { title: 'README + lore', detail: 'how to play, design notes', requires: ['docs'] },
    { title: 'Build script', detail: 'tsc check + run target', requires: ['devops'] },
  ],
  team3: [
    { title: 'Frontmatter parser', detail: 'parse YAML frontmatter from .md files', requires: ['backend'] },
    { title: 'Markdown renderer', detail: 'wrap a markdown lib; produce HTML', requires: ['backend'] },
    { title: 'Default theme', detail: 'minimal CSS; readable typography', requires: ['frontend'] },
    { title: 'Layout templates', detail: 'page + post + index templates', requires: ['frontend'] },
    { title: 'Build CLI', detail: 'reads /content, writes /dist', requires: ['backend'] },
    { title: 'Nav generator', detail: 'auto-build nav from frontmatter order', requires: ['backend'] },
    { title: 'Watch mode', detail: 'rebuild on file change', requires: ['devops'] },
    { title: 'Tests for frontmatter parser', detail: 'edge cases + malformed input', requires: ['tests'] },
    { title: 'Tests for build pipeline', detail: 'full content/ → dist/ flow', requires: ['tests'] },
    { title: 'Sample content set', detail: '3 posts + index for demo', requires: ['docs'] },
    { title: 'README quickstart', detail: 'install + first build in 60s', requires: ['docs'] },
    { title: 'Build script + bin entry', detail: 'package.json setup', requires: ['devops'] },
  ],
  team4: [
    { title: 'Task model', detail: 'id, payload, retries, status', requires: ['backend'] },
    { title: 'In-memory queue', detail: 'enqueue/dequeue with priority', requires: ['backend'] },
    { title: 'File-backed persistence', detail: 'append-only log, replay on start', requires: ['db'] },
    { title: 'Worker pool', detail: 'configurable concurrency; graceful drain', requires: ['backend'] },
    { title: 'Retry/backoff', detail: 'exponential, max attempts', requires: ['backend'] },
    { title: 'CLI: enqueue / status / drain', detail: 'commands for ops', requires: ['frontend'] },
    { title: 'HTTP API', detail: 'POST /enqueue, GET /status', requires: ['backend'] },
    { title: 'Tests for queue ordering', detail: 'priority + fairness', requires: ['tests'] },
    { title: 'Tests for retry/backoff', detail: 'simulate failures', requires: ['tests'] },
    { title: 'README quickstart', detail: 'how to enqueue your first task', requires: ['docs'] },
    { title: 'Lint + format', detail: 'eslint configs', requires: ['devops'] },
    { title: 'Build + run scripts', detail: 'package.json', requires: ['devops'] },
  ],
  team5: [
    { title: 'Read SPEC.md', detail: 'understand the codebase you inherited', requires: ['any'] },
    { title: 'Add unit tests for current behaviour', detail: 'characterisation tests', requires: ['tests'] },
    { title: 'Identify dead code', detail: 'list unreachable functions/branches', requires: ['backend'] },
    { title: 'Break apart god-object', detail: 'split src/everything.ts into 4+ modules', requires: ['backend'] },
    { title: 'Replace magic numbers', detail: 'extract constants', requires: ['backend'] },
    { title: 'Type the public surface', detail: 'add types to exported fns', requires: ['backend'] },
    { title: 'Fix the off-by-one bug', detail: 'see SPEC.md §3', requires: ['backend'] },
    { title: 'Fix the race condition', detail: 'see SPEC.md §4', requires: ['backend'] },
    { title: 'Add error handling at boundaries', detail: 'inputs, IO, parsers', requires: ['backend'] },
    { title: 'Tests for fixed bugs', detail: 'regression coverage', requires: ['tests'] },
    { title: 'Update README', detail: 'reflect new module layout', requires: ['docs'] },
    { title: 'CI script', detail: 'lint + tsc + tests pass', requires: ['devops'] },
  ],
};

const ts = now();
let total = 0;
for (const [proj, seeds] of Object.entries(TASKS)) {
  // Clear open/claimed (not done/failed — preserve history if any).
  // Cascade-delete bids first to satisfy FK.
  db.prepare(
    `DELETE FROM bids WHERE task_id IN (
       SELECT id FROM tasks WHERE project_id = ? AND status IN ('open','bidding','claimed')
     )`,
  ).run(proj);
  db.prepare(`DELETE FROM tasks WHERE project_id = ? AND status IN ('open','bidding','claimed')`).run(proj);
  const ins = db.prepare(
    `INSERT INTO tasks (project_id, title, detail, requires, status, posted_by, created_at)
     VALUES (?, ?, ?, ?, 'open', 'instructor', ?)`,
  );
  for (const s of seeds) {
    ins.run(proj, s.title, s.detail, JSON.stringify(s.requires), ts);
    total += 1;
  }
  console.log(`  ${proj.padEnd(6)}  ${seeds.length} tasks seeded`);
}
console.log(`\nSeeded ${total} tasks across ${Object.keys(TASKS).length} projects.`);
