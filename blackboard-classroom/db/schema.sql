-- Blackboard Classroom schema
-- One DB serves all 5 teams; per-project isolation via project_id column.

CREATE TABLE IF NOT EXISTS projects (
  id           TEXT PRIMARY KEY,                  -- e.g. 'team1', 'team2'
  name         TEXT NOT NULL,                     -- 'tiny-crm-cli'
  team_token   TEXT NOT NULL UNIQUE,              -- secret; held by every team member
  alloc_mode   TEXT NOT NULL DEFAULT 'A',         -- A=free, B=cap-matched, C=contract-net, D=reputation
  frozen       INTEGER NOT NULL DEFAULT 0,        -- instructor freeze
  created_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id    TEXT NOT NULL,
  name          TEXT NOT NULL,                    -- 'alice-frontend'
  role          TEXT NOT NULL,                    -- 'frontend', 'backend', 'tests', ...
  capabilities  TEXT NOT NULL DEFAULT '[]',       -- JSON array
  status        TEXT NOT NULL DEFAULT 'idle',     -- idle | working | blocked | offline
  reputation    REAL NOT NULL DEFAULT 0.5,        -- beta-reputation, 0..1
  last_seen     INTEGER NOT NULL,
  human_owner   TEXT,                             -- self-declared name of the student running this agent
  UNIQUE(project_id, name),
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id    TEXT NOT NULL,
  title         TEXT NOT NULL,
  detail        TEXT NOT NULL DEFAULT '',
  requires      TEXT NOT NULL DEFAULT '[]',       -- JSON array of capability tags
  status        TEXT NOT NULL DEFAULT 'open',     -- open | bidding | claimed | done | failed
  claimed_by    TEXT,                             -- agent name
  posted_by     TEXT NOT NULL,                    -- agent name or 'instructor' or 'human:alice'
  result        TEXT,
  lessons       TEXT,                             -- stigmergic learning: failure reason / gotcha
  created_at    INTEGER NOT NULL,
  claimed_at    INTEGER,
  closed_at     INTEGER,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS bids (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id     INTEGER NOT NULL,
  agent_name  TEXT NOT NULL,
  cost        REAL NOT NULL,                      -- agent's estimate of effort
  confidence  REAL NOT NULL,                      -- 0..1
  eta_seconds INTEGER NOT NULL,
  note        TEXT,
  created_at  INTEGER NOT NULL,
  FOREIGN KEY(task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id    TEXT NOT NULL,
  agent_name    TEXT,                             -- nullable for system / instructor events
  kind          TEXT NOT NULL,                    -- tool_use | task_post | task_claim | task_complete | task_fail | bid | message | system
  performative  TEXT,                             -- request | inform | commit | block | escalate | null
  refs          TEXT NOT NULL DEFAULT '[]',       -- JSON array of agent names this references
  payload       TEXT NOT NULL DEFAULT '{}',       -- JSON
  ts            INTEGER NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS snapshots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  TEXT NOT NULL,
  agent_name  TEXT NOT NULL,
  git_sha     TEXT NOT NULL,
  note        TEXT,
  ts          INTEGER NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE INDEX IF NOT EXISTS idx_events_project_ts ON events(project_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_agent_ts   ON events(project_id, agent_name, ts DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_project     ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_agents_project    ON agents(project_id);
CREATE INDEX IF NOT EXISTS idx_bids_task         ON bids(task_id);
