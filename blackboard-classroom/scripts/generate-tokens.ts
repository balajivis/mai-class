/**
 * Bootstrap script: creates 5 team projects + matching team tokens, prints a handout block.
 * Run once before each workshop (idempotent — re-running overwrites tokens).
 *
 *   npm run tokens
 */
import { customAlphabet } from 'nanoid';
import { db, now } from '../src/db.js';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // unambiguous
const mkToken = customAlphabet(alphabet, 12);

const PROJECTS = [
  { id: 'team1', name: 'tiny-crm-cli' },
  { id: 'team2', name: 'pokemon-combat-engine' },
  { id: 'team3', name: 'markdown-static-site-gen' },
  { id: 'team4', name: 'tiny-task-queue' },
  { id: 'team5', name: 'refactor-spaghetti-500loc' },
];

const ts = now();
const upsert = db.prepare(
  `INSERT INTO projects (id, name, team_token, alloc_mode, frozen, created_at)
   VALUES (?, ?, ?, 'A', 0, ?)
   ON CONFLICT(id) DO UPDATE SET name = excluded.name, team_token = excluded.team_token`,
);

console.log('\n┌──────────────────────────────────────────────────────────────────┐');
console.log('│  Modern AI Pro — Multiagents-v2 Workshop · Team Tokens           │');
console.log('├──────┬──────────────────────────────┬──────────────────────────────┤');
console.log('│ Team │ Project                       │ Team Token                   │');
console.log('├──────┼──────────────────────────────┼──────────────────────────────┤');
for (const p of PROJECTS) {
  const token = `${p.id}-${mkToken()}`;
  upsert.run(p.id, p.name, token, ts);
  console.log(`│  ${p.id.padEnd(4)}│ ${p.name.padEnd(29)}│ ${token.padEnd(29)}│`);
}
console.log('└──────┴──────────────────────────────┴──────────────────────────────┘');
console.log('\nInstructor token (env):  BB_INSTRUCTOR_TOKEN');
console.log('Default if unset:        instructor-dev-token\n');
