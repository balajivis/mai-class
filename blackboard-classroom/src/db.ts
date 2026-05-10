import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.BB_DB_PATH ?? join(__dirname, '..', 'db', 'blackboard.db');
const SCHEMA_PATH = join(__dirname, '..', 'db', 'schema.sql');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(readFileSync(SCHEMA_PATH, 'utf8'));

export function now(): number {
  return Date.now();
}

export type ProjectRow = {
  id: string;
  name: string;
  team_token: string;
  alloc_mode: 'A' | 'B' | 'C' | 'D';
  frozen: 0 | 1;
  created_at: number;
};

export type AgentRow = {
  id: number;
  project_id: string;
  name: string;
  role: string;
  capabilities: string;
  status: string;
  reputation: number;
  last_seen: number;
  human_owner: string | null;
};

export type TaskRow = {
  id: number;
  project_id: string;
  title: string;
  detail: string;
  requires: string;
  status: 'open' | 'bidding' | 'claimed' | 'done' | 'failed';
  claimed_by: string | null;
  posted_by: string;
  result: string | null;
  lessons: string | null;
  created_at: number;
  claimed_at: number | null;
  closed_at: number | null;
};

export type EventRow = {
  id: number;
  project_id: string;
  agent_name: string | null;
  kind: string;
  performative: string | null;
  refs: string;
  payload: string;
  ts: number;
};
