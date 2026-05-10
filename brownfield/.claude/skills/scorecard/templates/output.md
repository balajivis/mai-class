# Scorecard Output Format

Write the updated scorecard to `scorecard.md` using this format:

```markdown
# Readiness Scorecard

*Last updated: {DATE} — audited via /scorecard command*

| Layer | Defined → Config | Config → Runtime | End-to-End | Verdict |
|-------|:----------------:|:----------------:|:----------:|---------|
| 1. {Layer} | ??% | ??% | **??%** | One sentence. |
| 2. {Layer} | ??% | ??% | **??%** | One sentence. |
| ... | | | | |

## Top 3 Blockers (for this sprint)

List the 3 lowest-scoring E2E layers and the single code change that would most improve their score.

1. **Layer N**: Gap is [X]. Fix: [specific file + function].
2. **Layer N**: Gap is [X]. Fix: [specific file + function].
3. **Layer N**: Gap is [X]. Fix: [specific file + function].
```
