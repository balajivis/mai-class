/**
 * Pipeline integration tests — verify the connections between:
 *   Templates (.tmpl) → gen-skill-docs generator → generated SKILL.md files
 *   Command registry (commands.ts) → handler switch statements → server routes
 *   Generated skill files → $B command references → valid browse commands
 *
 * Does NOT duplicate component-level tests:
 *   - gen-skill-docs.test.ts (specific skill content)
 *   - skill-validation.test.ts (structural validation of individual skills)
 *   - browse/test/commands.test.ts (browse command behavior)
 */

import { describe, test, expect } from 'bun:test';
import {
  ALL_COMMANDS,
  READ_COMMANDS,
  WRITE_COMMANDS,
  META_COMMANDS,
  COMMAND_DESCRIPTIONS,
} from '../browse/src/commands';
import { validateSkill } from './helpers/skill-parser';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');

// ─── Dynamic discovery helpers ──────────────────────────────

/** Discover all .tmpl template files (mirrors findTemplates() in gen-skill-docs.ts). */
function discoverTemplates(): Array<{ dir: string; tmplPath: string }> {
  const templates: Array<{ dir: string; tmplPath: string }> = [];
  const rootTmpl = path.join(ROOT, 'SKILL.md.tmpl');
  if (fs.existsSync(rootTmpl)) {
    templates.push({ dir: '.', tmplPath: rootTmpl });
  }
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const tmpl = path.join(ROOT, entry.name, 'SKILL.md.tmpl');
    if (fs.existsSync(tmpl)) {
      templates.push({ dir: entry.name, tmplPath: tmpl });
    }
  }
  return templates;
}

/** Discover all generated SKILL.md files (Claude variants). */
function discoverClaudeSkillMds(): Array<{ dir: string; mdPath: string }> {
  const mds: Array<{ dir: string; mdPath: string }> = [];
  const rootMd = path.join(ROOT, 'SKILL.md');
  if (fs.existsSync(rootMd)) {
    mds.push({ dir: '.', mdPath: rootMd });
  }
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const md = path.join(ROOT, entry.name, 'SKILL.md');
    if (fs.existsSync(md)) {
      mds.push({ dir: entry.name, mdPath: md });
    }
  }
  return mds;
}

/** Discover all Codex-generated SKILL.md files. */
function discoverCodexSkillMds(): Array<{ name: string; mdPath: string }> {
  const agentsDir = path.join(ROOT, '.agents', 'skills');
  if (!fs.existsSync(agentsDir)) return [];
  const mds: Array<{ name: string; mdPath: string }> = [];
  for (const entry of fs.readdirSync(agentsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const md = path.join(agentsDir, entry.name, 'SKILL.md');
    if (fs.existsSync(md)) {
      mds.push({ name: entry.name, mdPath: md });
    }
  }
  return mds;
}

/** Extract placeholder names from a template file. */
function extractPlaceholders(tmplPath: string): string[] {
  const content = fs.readFileSync(tmplPath, 'utf-8');
  const matches = content.matchAll(/\{\{(\w+)\}\}/g);
  const names = new Set<string>();
  for (const m of matches) {
    names.add(m[1]);
  }
  return [...names];
}

/** Parse case 'xxx': patterns from a handler file. */
function extractSwitchCases(filePath: string): Set<string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const cases = new Set<string>();
  const matches = content.matchAll(/case\s+'([^']+)'/g);
  for (const m of matches) {
    cases.add(m[1]);
  }
  return cases;
}

const ALL_TEMPLATES = discoverTemplates();
const ALL_CLAUDE_SKILL_MDS = discoverClaudeSkillMds();
const ALL_CODEX_SKILL_MDS = discoverCodexSkillMds();

// ─── RESOLVERS extracted from gen-skill-docs.ts ─────────────
// We import the RESOLVERS keys by reading the source file and parsing the object keys.
// This avoids importing the script (which has side effects from argv parsing).

const RESOLVER_NAMES: string[] = (() => {
  const genScript = fs.readFileSync(path.join(ROOT, 'scripts', 'gen-skill-docs.ts'), 'utf-8');
  const resolverBlock = genScript.match(/const RESOLVERS:\s*Record<[^>]+>\s*=\s*\{([\s\S]*?)\n\};/);
  if (!resolverBlock) return [];
  const names: string[] = [];
  const matches = resolverBlock[1].matchAll(/^\s+(\w+):/gm);
  for (const m of matches) {
    names.push(m[1]);
  }
  return names;
})();

// ═════════════════════════════════════════════════════════════
// 1. gen-skill-docs produces valid SKILL.md from templates
// ═════════════════════════════════════════════════════════════

describe('Pipeline: gen-skill-docs produces valid SKILL.md from templates', () => {
  test('--dry-run reports all skills as FRESH (generated files match committed)', () => {
    const result = Bun.spawnSync(['bun', 'run', 'scripts/gen-skill-docs.ts', '--dry-run'], {
      cwd: ROOT,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    expect(result.exitCode).toBe(0);
    const output = result.stdout.toString();
    expect(output).not.toContain('STALE');
    for (const tmpl of ALL_TEMPLATES) {
      const file = tmpl.dir === '.' ? 'SKILL.md' : `${tmpl.dir}/SKILL.md`;
      expect(output).toContain(`FRESH: ${file}`);
    }
  });

  test('every template has a corresponding generated .md file', () => {
    for (const tmpl of ALL_TEMPLATES) {
      const mdPath = tmpl.dir === '.'
        ? path.join(ROOT, 'SKILL.md')
        : path.join(ROOT, tmpl.dir, 'SKILL.md');
      expect(fs.existsSync(mdPath)).toBe(true);
    }
  });

  test('every {{PLACEHOLDER}} in templates maps to a resolver in RESOLVERS', () => {
    const missingResolvers: string[] = [];
    for (const tmpl of ALL_TEMPLATES) {
      const placeholders = extractPlaceholders(tmpl.tmplPath);
      for (const ph of placeholders) {
        if (!RESOLVER_NAMES.includes(ph)) {
          missingResolvers.push(`{{${ph}}} in ${tmpl.dir}/SKILL.md.tmpl has no resolver`);
        }
      }
    }
    expect(missingResolvers).toEqual([]);
  });

  test('no orphan resolvers — every resolver is referenced by at least one template', () => {
    const allPlaceholders = new Set<string>();
    for (const tmpl of ALL_TEMPLATES) {
      for (const ph of extractPlaceholders(tmpl.tmplPath)) {
        allPlaceholders.add(ph);
      }
    }
    const orphans = RESOLVER_NAMES.filter(r => !allPlaceholders.has(r));
    expect(orphans).toEqual([]);
  });
});

// ═════════════════════════════════════════════════════════════
// 2. Command registry is complete and consistent
// ═════════════════════════════════════════════════════════════

describe('Pipeline: command registry completeness and consistency', () => {
  test('COMMAND_DESCRIPTIONS covers exactly ALL_COMMANDS (no missing, no extras)', () => {
    const descKeys = new Set(Object.keys(COMMAND_DESCRIPTIONS));
    const missing = [...ALL_COMMANDS].filter(cmd => !descKeys.has(cmd));
    const extras = [...descKeys].filter(key => !ALL_COMMANDS.has(key));
    expect(missing).toEqual([]);
    expect(extras).toEqual([]);
  });

  test('ALL_COMMANDS is the exact union of READ_COMMANDS ∪ WRITE_COMMANDS ∪ META_COMMANDS', () => {
    const union = new Set([...READ_COMMANDS, ...WRITE_COMMANDS, ...META_COMMANDS]);
    const missingFromAll = [...union].filter(cmd => !ALL_COMMANDS.has(cmd));
    const extraInAll = [...ALL_COMMANDS].filter(cmd => !union.has(cmd));
    expect(missingFromAll).toEqual([]);
    expect(extraInAll).toEqual([]);
    expect(ALL_COMMANDS.size).toBe(union.size);
  });

  test('READ_COMMANDS, WRITE_COMMANDS, META_COMMANDS are disjoint (no command in multiple sets)', () => {
    const overlaps: string[] = [];
    for (const cmd of READ_COMMANDS) {
      if (WRITE_COMMANDS.has(cmd)) overlaps.push(`${cmd} in READ ∩ WRITE`);
      if (META_COMMANDS.has(cmd)) overlaps.push(`${cmd} in READ ∩ META`);
    }
    for (const cmd of WRITE_COMMANDS) {
      if (META_COMMANDS.has(cmd)) overlaps.push(`${cmd} in WRITE ∩ META`);
    }
    expect(overlaps).toEqual([]);
  });

  test('every COMMAND_DESCRIPTIONS entry has category and description with meaningful content', () => {
    const problems: string[] = [];
    for (const [cmd, meta] of Object.entries(COMMAND_DESCRIPTIONS)) {
      if (!meta.category || meta.category.trim().length === 0) {
        problems.push(`${cmd}: missing or empty category`);
      }
      if (!meta.description || meta.description.trim().length < 5) {
        problems.push(`${cmd}: missing or too-short description (${meta.description?.length ?? 0} chars)`);
      }
    }
    expect(problems).toEqual([]);
  });
});

// ═════════════════════════════════════════════════════════════
// 3. Server routes match the command registry
// ═════════════════════════════════════════════════════════════

describe('Pipeline: server handler dispatch matches command registry', () => {
  const readCases = extractSwitchCases(path.join(ROOT, 'browse', 'src', 'read-commands.ts'));
  const writeCases = extractSwitchCases(path.join(ROOT, 'browse', 'src', 'write-commands.ts'));
  const metaCases = extractSwitchCases(path.join(ROOT, 'browse', 'src', 'meta-commands.ts'));

  // Filter out sub-switch cases (like 'visible', 'hidden' inside 'is' command,
  // or 'get', 'set', 'delete', 'list', 'clear' inside 'state' command)
  const IS_SUBSTATES = new Set(['visible', 'hidden', 'enabled', 'disabled', 'checked', 'editable', 'focused']);
  const STATE_SUBCOMMANDS = new Set(['get', 'set', 'delete', 'list', 'clear']);
  const SUB_CASES = new Set([...IS_SUBSTATES, ...STATE_SUBCOMMANDS]);

  function filterTopLevelCases(cases: Set<string>): Set<string> {
    return new Set([...cases].filter(c => !SUB_CASES.has(c)));
  }

  test('every READ_COMMANDS entry has a case in handleReadCommand', () => {
    const topLevelCases = filterTopLevelCases(readCases);
    const missing = [...READ_COMMANDS].filter(cmd => !topLevelCases.has(cmd));
    expect(missing).toEqual([]);
  });

  test('every WRITE_COMMANDS entry has a case in handleWriteCommand', () => {
    const topLevelCases = filterTopLevelCases(writeCases);
    const missing = [...WRITE_COMMANDS].filter(cmd => !topLevelCases.has(cmd));
    expect(missing).toEqual([]);
  });

  test('every META_COMMANDS entry has a case in handleMetaCommand', () => {
    const topLevelCases = filterTopLevelCases(metaCases);
    const missing = [...META_COMMANDS].filter(cmd => !topLevelCases.has(cmd));
    expect(missing).toEqual([]);
  });
});

// ═════════════════════════════════════════════════════════════
// 4. Skill templates reference only valid commands
// ═════════════════════════════════════════════════════════════

describe('Pipeline: generated SKILL.md files reference only valid $B commands', () => {
  test('every Claude-variant SKILL.md passes $B command validation', () => {
    const failures: string[] = [];
    for (const skill of ALL_CLAUDE_SKILL_MDS) {
      const result = validateSkill(skill.mdPath);
      if (result.invalid.length > 0) {
        const cmds = result.invalid.map(c => `${c.command} (line ${c.line})`).join(', ');
        failures.push(`${skill.dir}/SKILL.md: invalid commands: ${cmds}`);
      }
    }
    expect(failures).toEqual([]);
  });

  test('every Claude-variant SKILL.md passes snapshot flag validation', () => {
    const failures: string[] = [];
    for (const skill of ALL_CLAUDE_SKILL_MDS) {
      const result = validateSkill(skill.mdPath);
      if (result.snapshotFlagErrors.length > 0) {
        const errs = result.snapshotFlagErrors.map(e => `${e.command.raw}: ${e.error}`).join(', ');
        failures.push(`${skill.dir}/SKILL.md: snapshot flag errors: ${errs}`);
      }
    }
    expect(failures).toEqual([]);
  });

  test('every Codex-variant SKILL.md passes $B command validation', () => {
    const failures: string[] = [];
    for (const skill of ALL_CODEX_SKILL_MDS) {
      const content = fs.readFileSync(skill.mdPath, 'utf-8');
      if (!content.includes('$B ')) continue; // skip skills without browse commands
      const result = validateSkill(skill.mdPath);
      if (result.invalid.length > 0) {
        const cmds = result.invalid.map(c => `${c.command} (line ${c.line})`).join(', ');
        failures.push(`${skill.name}/SKILL.md: invalid commands: ${cmds}`);
      }
    }
    expect(failures).toEqual([]);
  });

  test('no generated SKILL.md contains unresolved {{PLACEHOLDER}} markers', () => {
    const unresolved: string[] = [];
    for (const skill of ALL_CLAUDE_SKILL_MDS) {
      const content = fs.readFileSync(skill.mdPath, 'utf-8');
      const matches = content.match(/\{\{[A-Z_]+\}\}/g);
      if (matches) {
        unresolved.push(`${skill.dir}/SKILL.md: ${matches.join(', ')}`);
      }
    }
    for (const skill of ALL_CODEX_SKILL_MDS) {
      const content = fs.readFileSync(skill.mdPath, 'utf-8');
      const matches = content.match(/\{\{[A-Z_]+\}\}/g);
      if (matches) {
        unresolved.push(`${skill.name}/SKILL.md (codex): ${matches.join(', ')}`);
      }
    }
    expect(unresolved).toEqual([]);
  });
});
