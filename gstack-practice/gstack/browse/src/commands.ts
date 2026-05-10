/**
 * Command registry — single source of truth for all browse commands.
 *
 * Dependency graph:
 *   commands.ts ──▶ server.ts (runtime dispatch)
 *                ──▶ gen-skill-docs.ts (doc generation)
 *                ──▶ skill-parser.ts (validation)
 *                ──▶ skill-check.ts (health reporting)
 *
 * Zero side effects. Safe to import from build scripts and tests.
 */

const READ_COMMAND_NAMES = [
  'text', 'html', 'links', 'forms', 'accessibility',
  'js', 'eval', 'css', 'attrs',
  'console', 'network', 'cookies', 'storage', 'perf',
  'dialog', 'is',
] as const;
export type ReadCommand = typeof READ_COMMAND_NAMES[number];
export const READ_COMMANDS: ReadonlySet<ReadCommand> = new Set(READ_COMMAND_NAMES);

const WRITE_COMMAND_NAMES = [
  'goto', 'back', 'forward', 'reload',
  'click', 'fill', 'select', 'hover', 'type', 'press', 'scroll', 'wait',
  'viewport', 'cookie', 'cookie-import', 'cookie-import-browser', 'header', 'useragent',
  'upload', 'dialog-accept', 'dialog-dismiss',
] as const;
export type WriteCommand = typeof WRITE_COMMAND_NAMES[number];
export const WRITE_COMMANDS: ReadonlySet<WriteCommand> = new Set(WRITE_COMMAND_NAMES);

const META_COMMAND_NAMES = [
  'tabs', 'tab', 'newtab', 'closetab',
  'status', 'stop', 'restart',
  'screenshot', 'pdf', 'responsive',
  'chain', 'diff',
  'url', 'snapshot',
  'handoff', 'resume',
  'state',
] as const;
export type MetaCommand = typeof META_COMMAND_NAMES[number];
export const META_COMMANDS: ReadonlySet<MetaCommand> = new Set(META_COMMAND_NAMES);

export type AnyCommand = ReadCommand | WriteCommand | MetaCommand;

export const ALL_COMMANDS: ReadonlySet<string> = new Set([...READ_COMMAND_NAMES, ...WRITE_COMMAND_NAMES, ...META_COMMAND_NAMES]);

export function isReadCommand(s: string): s is ReadCommand {
  return (READ_COMMANDS as ReadonlySet<string>).has(s);
}

export function isWriteCommand(s: string): s is WriteCommand {
  return (WRITE_COMMANDS as ReadonlySet<string>).has(s);
}

export function isMetaCommand(s: string): s is MetaCommand {
  return (META_COMMANDS as ReadonlySet<string>).has(s);
}

export interface CommandDescriptionEntry {
  category: string;
  description: string;
  usage?: string;
}

export const COMMAND_DESCRIPTIONS: Record<string, CommandDescriptionEntry> = {
  // Navigation
  'goto':    { category: 'Navigation', description: 'Navigate to URL', usage: 'goto <url>' },
  'back':    { category: 'Navigation', description: 'History back' },
  'forward': { category: 'Navigation', description: 'History forward' },
  'reload':  { category: 'Navigation', description: 'Reload page' },
  'url':     { category: 'Navigation', description: 'Print current URL' },
  // Reading
  'text':    { category: 'Reading', description: 'Cleaned page text' },
  'html':    { category: 'Reading', description: 'innerHTML of selector (throws if not found), or full page HTML if no selector given', usage: 'html [selector]' },
  'links':   { category: 'Reading', description: 'All links as "text → href"' },
  'forms':   { category: 'Reading', description: 'Form fields as JSON' },
  'accessibility': { category: 'Reading', description: 'Full ARIA tree' },
  // Inspection
  'js':      { category: 'Inspection', description: 'Run JavaScript expression and return result as string', usage: 'js <expr>' },
  'eval':    { category: 'Inspection', description: 'Run JavaScript from file and return result as string (path must be under /tmp or cwd)', usage: 'eval <file>' },
  'css':     { category: 'Inspection', description: 'Computed CSS value', usage: 'css <sel> <prop>' },
  'attrs':   { category: 'Inspection', description: 'Element attributes as JSON', usage: 'attrs <sel|@ref>' },
  'is':      { category: 'Inspection', description: 'State check (visible/hidden/enabled/disabled/checked/editable/focused)', usage: 'is <prop> <sel>' },
  'console': { category: 'Inspection', description: 'Console messages (--errors filters to error/warning)', usage: 'console [--clear|--errors]' },
  'network': { category: 'Inspection', description: 'Network requests', usage: 'network [--clear]' },
  'dialog':  { category: 'Inspection', description: 'Dialog messages', usage: 'dialog [--clear]' },
  'cookies': { category: 'Inspection', description: 'All cookies as JSON' },
  'storage': { category: 'Inspection', description: 'Read all localStorage + sessionStorage as JSON, or set <key> <value> to write localStorage', usage: 'storage [set k v]' },
  'perf':    { category: 'Inspection', description: 'Page load timings' },
  // Interaction
  'click':   { category: 'Interaction', description: 'Click element', usage: 'click <sel>' },
  'fill':    { category: 'Interaction', description: 'Fill input', usage: 'fill <sel> <val>' },
  'select':  { category: 'Interaction', description: 'Select dropdown option by value, label, or visible text', usage: 'select <sel> <val>' },
  'hover':   { category: 'Interaction', description: 'Hover element', usage: 'hover <sel>' },
  'type':    { category: 'Interaction', description: 'Type into focused element', usage: 'type <text>' },
  'press':   { category: 'Interaction', description: 'Press key — Enter, Tab, Escape, ArrowUp/Down/Left/Right, Backspace, Delete, Home, End, PageUp, PageDown, or modifiers like Shift+Enter', usage: 'press <key>' },
  'scroll':  { category: 'Interaction', description: 'Scroll element into view, or scroll to page bottom if no selector', usage: 'scroll [sel]' },
  'wait':    { category: 'Interaction', description: 'Wait for element, network idle, or page load (timeout: 15s)', usage: 'wait <sel|--networkidle|--load>' },
  'upload':  { category: 'Interaction', description: 'Upload file(s)', usage: 'upload <sel> <file> [file2...]' },
  'viewport':{ category: 'Interaction', description: 'Set viewport size', usage: 'viewport <WxH>' },
  'cookie':  { category: 'Interaction', description: 'Set cookie on current page domain', usage: 'cookie <name>=<value>' },
  'cookie-import': { category: 'Interaction', description: 'Import cookies from JSON file', usage: 'cookie-import <json>' },
  'cookie-import-browser': { category: 'Interaction', description: 'Import cookies from Comet, Chrome, Arc, Brave, or Edge (opens picker, or use --domain for direct import)', usage: 'cookie-import-browser [browser] [--domain d]' },
  'header':  { category: 'Interaction', description: 'Set custom request header (colon-separated, sensitive values auto-redacted)', usage: 'header <name>:<value>' },
  'useragent': { category: 'Interaction', description: 'Set user agent', usage: 'useragent <string>' },
  'dialog-accept': { category: 'Interaction', description: 'Auto-accept next alert/confirm/prompt. Optional text is sent as the prompt response', usage: 'dialog-accept [text]' },
  'dialog-dismiss': { category: 'Interaction', description: 'Auto-dismiss next dialog' },
  // Visual
  'screenshot': { category: 'Visual', description: 'Save screenshot (supports element crop via CSS/@ref, --clip region, --viewport)', usage: 'screenshot [--viewport] [--clip x,y,w,h] [selector|@ref] [path]' },
  'pdf':     { category: 'Visual', description: 'Save as PDF', usage: 'pdf [path]' },
  'responsive': { category: 'Visual', description: 'Screenshots at mobile (375x812), tablet (768x1024), desktop (1280x720). Saves as {prefix}-mobile.png etc.', usage: 'responsive [prefix]' },
  'diff':    { category: 'Visual', description: 'Text diff between pages', usage: 'diff <url1> <url2>' },
  // Tabs
  'tabs':    { category: 'Tabs', description: 'List open tabs' },
  'tab':     { category: 'Tabs', description: 'Switch to tab', usage: 'tab <id>' },
  'newtab':  { category: 'Tabs', description: 'Open new tab', usage: 'newtab [url]' },
  'closetab':{ category: 'Tabs', description: 'Close tab', usage: 'closetab [id]' },
  // Server
  'status':  { category: 'Server', description: 'Health check' },
  'stop':    { category: 'Server', description: 'Shutdown server' },
  'restart': { category: 'Server', description: 'Restart server' },
  // Meta
  'snapshot':{ category: 'Snapshot', description: 'Accessibility tree with @e refs for element selection. Flags: -i interactive only, -c compact, -d N depth limit, -s sel scope, -D diff vs previous, -a annotated screenshot, -o path output, -C cursor-interactive @c refs', usage: 'snapshot [flags]' },
  'chain':   { category: 'Meta', description: 'Run commands from JSON stdin. Format: [["cmd","arg1",...],...]' },
  // Handoff
  'handoff': { category: 'Server', description: 'Open visible Chrome at current page for user takeover', usage: 'handoff [message]' },
  'resume':  { category: 'Server', description: 'Re-snapshot after user takeover, return control to AI', usage: 'resume' },
  // State
  'state':   { category: 'Meta', description: 'Get, set, or list shared skill state', usage: 'state get <key> | state set <key> <json> | state delete <key> | state list | state clear' },
};

// Load-time validation: descriptions must cover exactly the command sets
const descKeys = new Set(Object.keys(COMMAND_DESCRIPTIONS));
for (const cmd of ALL_COMMANDS) {
  if (!descKeys.has(cmd)) throw new Error(`COMMAND_DESCRIPTIONS missing entry for: ${cmd}`);
}
for (const key of descKeys) {
  if (!ALL_COMMANDS.has(key)) throw new Error(`COMMAND_DESCRIPTIONS has unknown command: ${key}`);
}
