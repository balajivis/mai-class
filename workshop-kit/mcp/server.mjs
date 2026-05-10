#!/usr/bin/env node
// Workshop-kit MCP server · stdio JSON-RPC.
// Zero deps. Speaks MCP 2024-11-05 protocol minimally — initialize, tools/list, tools/call.
//
// Tools exposed to Claude Code:
//   bb_read              — snapshot of team blackboard (agents, tasks, recent events)
//   bb_write             — post a structured event with optional performative
//   bb_claim             — claim an open task
//   bb_bid               — bid on a task (Modes C / D)
//   bb_recent_lessons    — read recent failures for the given capability tags
//
// Configured via env (set by the plugin's .mcp.json):
//   WK_API     defaults to https://bb.modernaipro.com
//   WK_TEAM    e.g. team1
//   WK_TOKEN   team token
//   WK_AGENT   self-declared agent name

import { stdin, stdout, env } from 'node:process';
import { createInterface } from 'node:readline';

const API   = env.WK_API   ?? 'https://bb.modernaipro.com';
const TEAM  = env.WK_TEAM  ?? '';
const TOKEN = env.WK_TOKEN ?? '';
const AGENT = env.WK_AGENT ?? 'anonymous';

function send(msg) {
  stdout.write(JSON.stringify(msg) + '\n');
}
function ok(id, result)   { send({ jsonrpc: '2.0', id, result }); }
function fail(id, code, message) { send({ jsonrpc: '2.0', id, error: { code, message } }); }
function textBlock(text)  { return { content: [{ type: 'text', text: typeof text === 'string' ? text : JSON.stringify(text, null, 2) }] }; }

async function bbFetch(path, init = {}) {
  if (!TEAM || !TOKEN) {
    return { ok: false, status: 0, json: { error: 'WK_TEAM or WK_TOKEN not set' } };
  }
  const url = `${API}/api/p/${encodeURIComponent(TEAM)}${path}`;
  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'X-Agent': AGENT,
    'Content-Type': 'application/json',
    ...(init.headers ?? {}),
  };
  try {
    const resp = await fetch(url, { ...init, headers });
    let body;
    try { body = await resp.json(); } catch { body = await resp.text(); }
    return { ok: resp.ok, status: resp.status, json: body };
  } catch (err) {
    return { ok: false, status: 0, json: { error: String(err?.message ?? err) } };
  }
}

const TOOLS = [
  {
    name: 'bb_read',
    description: 'Read the team blackboard: agents, tasks (last 200), and recent events. Always call this before posting or claiming so you do not duplicate work.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    handler: async () => {
      const { ok: success, json } = await bbFetch('/state');
      if (!success) return textBlock({ error: json });
      // Trim noisy fields for token efficiency.
      const slim = {
        project: json.project,
        agents: (json.agents || []).map((a) => ({ name: a.name, role: a.role, status: a.status, caps: a.capabilities, rep: a.reputation })),
        tasks_summary: summariseTasks(json.tasks || []),
        recent_events: (json.events || []).slice(0, 30).map((e) => ({
          ts: new Date(e.ts).toISOString().slice(11, 19),
          who: e.agent_name,
          kind: e.kind,
          perf: e.performative,
          payload: e.payload,
        })),
      };
      return textBlock(slim);
    },
  },
  {
    name: 'bb_write',
    description: 'Post a structured event to the team blackboard. Use the appropriate `performative`: request (asking), inform (announcing), commit (promising), block (stuck), escalate (urgent).',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['message', 'tool_use', 'note'], default: 'message' },
        performative: { type: 'string', enum: ['request', 'inform', 'commit', 'block', 'escalate'] },
        text: { type: 'string', description: 'Free-form message body' },
        refs: { type: 'array', items: { type: 'string' }, description: 'Other agent names this references' },
        payload: { type: 'object', description: 'Optional structured payload' },
      },
      required: ['performative', 'text'],
    },
    handler: async (args) => {
      const body = {
        kind: args.kind ?? 'message',
        performative: args.performative,
        agent: AGENT,
        refs: args.refs ?? [],
        payload: { text: args.text, ...(args.payload ?? {}) },
      };
      const { ok: success, json } = await bbFetch('/events', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return textBlock(success ? { ok: true, id: json.id } : { error: json });
    },
  },
  {
    name: 'bb_claim',
    description: 'Claim an open task by id. Returns 409 if already claimed. Always call bb_recent_lessons first for non-trivial tasks.',
    inputSchema: {
      type: 'object',
      properties: { task_id: { type: 'integer' } },
      required: ['task_id'],
    },
    handler: async (args) => {
      const { ok: success, json, status } = await bbFetch(`/tasks/${args.task_id}/claim`, {
        method: 'PATCH',
        body: JSON.stringify({ agent: AGENT }),
      });
      return textBlock({ ok: success, status, body: json });
    },
  },
  {
    name: 'bb_bid',
    description: 'Submit a bid on a task. Used in allocation Modes C (contract-net) and D (reputation-weighted). Cost and confidence are 0..1; eta_seconds is your honest estimate.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'integer' },
        cost: { type: 'number', minimum: 0, maximum: 1 },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        eta_seconds: { type: 'integer', minimum: 1 },
        note: { type: 'string' },
      },
      required: ['task_id', 'cost', 'confidence', 'eta_seconds'],
    },
    handler: async (args) => {
      const { ok: success, json, status } = await bbFetch(`/tasks/${args.task_id}/bid`, {
        method: 'POST',
        body: JSON.stringify({
          agent: AGENT,
          cost: args.cost,
          confidence: args.confidence,
          eta_seconds: args.eta_seconds,
          note: args.note ?? null,
        }),
      });
      return textBlock({ ok: success, status, body: json });
    },
  },
  {
    name: 'bb_recent_lessons',
    description: 'Read the most recent failed-or-flagged tasks whose capability tags overlap with the given `requires`. Stigmergic learning: read before bidding so you do not repeat yesterday\'s failures.',
    inputSchema: {
      type: 'object',
      properties: {
        requires: { type: 'array', items: { type: 'string' } },
        limit: { type: 'integer', minimum: 1, maximum: 50, default: 5 },
      },
      required: ['requires'],
    },
    handler: async (args) => {
      const qs = new URLSearchParams();
      qs.set('requires', (args.requires || []).join(','));
      qs.set('limit', String(args.limit ?? 5));
      const { ok: success, json } = await bbFetch(`/lessons?${qs.toString()}`);
      if (!success) return textBlock({ error: json });
      return textBlock(json.lessons.length === 0 ? 'No prior lessons for these tags. Proceed with normal risk.' : json);
    },
  },
];

function summariseTasks(tasks) {
  const bins = { open: [], bidding: [], claimed: [], done: 0, failed: 0 };
  for (const t of tasks) {
    if (t.status === 'done') bins.done += 1;
    else if (t.status === 'failed') bins.failed += 1;
    else (bins[t.status] ?? bins.open).push({
      id: t.id, title: t.title, requires: t.requires, claimed_by: t.claimed_by, has_lesson: !!t.lessons,
    });
  }
  return bins;
}

const TOOL_INDEX = Object.fromEntries(TOOLS.map((t) => [t.name, t]));

const rl = createInterface({ input: stdin });
rl.on('line', async (line) => {
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  const id = msg.id;
  if (msg.method === 'initialize') {
    ok(id, {
      protocolVersion: '2024-11-05',
      serverInfo: { name: 'workshop-kit-blackboard', version: '0.1.0' },
      capabilities: { tools: {} },
    });
  } else if (msg.method === 'tools/list') {
    ok(id, { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
  } else if (msg.method === 'tools/call') {
    const tool = TOOL_INDEX[msg.params?.name];
    if (!tool) {
      fail(id, -32601, `Unknown tool: ${msg.params?.name}`);
      return;
    }
    try {
      const result = await tool.handler(msg.params?.arguments ?? {});
      ok(id, result);
    } catch (err) {
      fail(id, -32000, String(err?.message ?? err));
    }
  } else if (msg.method === 'notifications/initialized') {
    // notification, no response
  } else if (msg.method && id !== undefined) {
    fail(id, -32601, `Unknown method: ${msg.method}`);
  }
});

rl.on('close', () => process.exit(0));
