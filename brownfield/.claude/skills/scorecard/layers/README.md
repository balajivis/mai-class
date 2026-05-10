# Scorecard Layers

Add layer definition files here as `{NN}-{name}.md`.

Each layer file should specify:
- **Read**: which files to audit
- **Key question**: the core question to answer for this layer

Example:

```markdown
# Layer 1 — Authentication

Read:
- `lib/auth/` — authentication implementation
- `middleware/auth.ts` — how auth middleware is applied
- `app/api/auth/` — auth API routes

Key question: Is authentication properly enforced across all protected routes?
```
