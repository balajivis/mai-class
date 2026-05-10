---
name: doc
description: Auto-generate comprehensive documentation for a file or function
---

## Instructions

When the user runs `/doc [filepath]` or `/doc [filepath]:[line]`:

### Input Handling
1. Read the specified file, or current file if none given
2. If a line number is specified (e.g., `/doc file.js:42`), document only that function/class
3. If file already has partial documentation, preserve it and fill gaps

### Documentation Generation

Generate a structured document containing:

- **Purpose** — One-line summary of the file's role or function signature
- **Parameters** — Arguments with types and descriptions (if applicable)
- **Returns** — Type and description of return value (if applicable)
- **Exports** — All exported functions, classes, types, constants (omit private/internal items)
- **Dependencies** — What it imports and why (keep to essentials only)
- **Usage example** — Realistic code snippet showing typical usage
- **Edge cases** — Known limitations, error conditions, gotchas, or constraints
- **Related** — Links to related files/functions (optional, if applicable)

### Format by Language

**JavaScript/TypeScript**:
- Use JSDoc format for functions/classes (`/** ... */`)
- Use markdown header block for module-level docs at top of file

**Python**:
- Use docstrings (triple-quoted strings)
- Follow Google or NumPy style

**Go**:
- Use comment blocks above exported items
- Format: "Package/function/type does X" (Go convention)

**Other languages**:
- Match the language's standard doc format
- If unsure, use a markdown block comment at top

### Output Behavior

- **Print documentation** to console in formatted markdown (for review)
- **Ask before modifying** the original file
- If user approves, insert/update docs in the file without changing logic
- Never overwrite existing docs without explicit permission

### Important Rules

1. **Code logic**: Do NOT modify, refactor, or improve code logic — only document
2. **Accuracy**: Only document what exists; don't invent functionality
3. **Brevity**: Keep docs concise and scannable (max 2–3 sentences per section)
4. **Public items only**: Document exported/public items unless user explicitly asks for internal docs
5. **Standards**: Follow language conventions + any standards defined in CLAUDE.md

### Example Output Format

```markdown
## file.js

**Purpose**: Validates email addresses against common patterns

**Exports**:
- `isValidEmail(email: string): boolean` — Checks if email matches RFC 5322 basic pattern
- `normalizeEmail(email: string): string` — Lowercases and trims whitespace

**Dependencies**:
- None (no external imports)

**Usage**:
\`\`\`js
import { isValidEmail, normalizeEmail } from './email.js';

const email = '  USER@EXAMPLE.COM  ';
if (isValidEmail(email)) {
  const cleaned = normalizeEmail(email);
  console.log(cleaned); // 'user@example.com'
}
\`\`\`

**Edge cases**:
- Does not validate against DNS or real mailbox existence
- Rejects some valid emails with subdomains (e.g., `user+tag@example.co.uk`)
```