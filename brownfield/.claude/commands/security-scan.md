---
description: Run Trivy, Semgrep, and Gitleaks security scans on a target directory, then analyze and act on the findings
user-invocable: true
---

# Security Scan

Run all three security scanning tools against the target path, analyze the results, and take action on findings.

## Target

The scan target is: $ARGUMENTS

If no target is provided, default to the current working directory.

## Steps

### 1. Run all three scans in parallel

Run these three commands concurrently:

- `trivy fs <target>` — dependency CVE scanning
- `semgrep scan --config auto <target>` — static analysis (SAST) for code vulnerabilities
- `gitleaks detect --source <target> --no-git` — hardcoded secrets detection

### 2. Analyze results

After all scans complete, produce a consolidated summary table with:

- **Trivy**: Count of CRITICAL/HIGH/MEDIUM/LOW CVEs. List the top 5 most severe with library name, CVE ID, installed version, and fixed version.
- **Semgrep**: Count of unique findings by rule. Group duplicates. Highlight any findings beyond bcrypt hash detection (those are typically seed data).
- **Gitleaks**: Count of leaked secrets. List each with file path and secret type.

### 3. Act on findings

Based on the scan results, take the following actions:

**For dependency CVEs (Trivy):**
- If the project uses Maven (`pom.xml`), identify which parent/dependency version bumps would resolve the most CVEs. Propose specific version changes.
- If the project uses npm/yarn/pip/etc., identify the relevant upgrade commands.
- Apply the fixes by editing the dependency file if the upgrades are straightforward (minor/patch bumps within the same major version). Ask before making major version bumps.

**For code vulnerabilities (Semgrep):**
- For each unique finding type, read the affected source file and fix the vulnerability directly.
- Skip findings in build output directories (`target/`, `build/`, `dist/`, `node_modules/`).

**For secrets (Gitleaks):**
- For each leaked secret, replace the hardcoded value with an environment variable reference appropriate to the framework.
- Add a comment noting the env var name to set.

### 4. Verify

After making fixes, re-run the scans to confirm the fix count decreased. Report the before/after comparison.
