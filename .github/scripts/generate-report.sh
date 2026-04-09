#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# generate-report.sh
# Generates the consolidated security pipeline report.
# Called by the `security-report` job in ci.yml.
#
# Required environment variables (set by the workflow from needs.<job>.result):
#   RESULT_TYPE_CHECK, RESULT_LINT, RESULT_AXIOS_BAN, RESULT_SECRET_SCAN,
#   RESULT_DEP_AUDIT, RESULT_SAST, RESULT_CLAUDE, RESULT_BUILD
#   GH_SHA, GH_REF, GH_ACTOR, GH_RUN_ID, GH_SERVER_URL, GH_REPOSITORY
#   CLAUDE_REPORT_PATH  — path to downloaded Claude report file (may not exist)
#   REPORT_FILE         — output path for the generated report
#   GITHUB_STEP_SUMMARY — set by GitHub Actions runtime
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Helpers ───────────────────────────────────────────────────────────────────
icon() {
  case "$1" in
    success)   echo "✅" ;;
    failure)   echo "❌" ;;
    skipped)   echo "⏭️" ;;
    cancelled) echo "🚫" ;;
    *)         echo "❓" ;;
  esac
}

any_failed=false
for r in \
  "$RESULT_TYPE_CHECK" "$RESULT_LINT" "$RESULT_AXIOS_BAN" \
  "$RESULT_SECRET_SCAN" "$RESULT_DEP_AUDIT" "$RESULT_SAST" \
  "$RESULT_CLAUDE" "$RESULT_BUILD"; do
  [ "$r" = "failure" ] && any_failed=true
done

# ── Report header ─────────────────────────────────────────────────────────────
cat > "$REPORT_FILE" << EOF
# 🔒 Security Pipeline Report

> **Commit:** \`${GH_SHA:0:8}\` · **Branch:** \`$GH_REF\` · **Author:** @$GH_ACTOR
> **Run:** [$GH_RUN_ID]($GH_SERVER_URL/$GH_REPOSITORY/actions/runs/$GH_RUN_ID)

EOF

if [ "$any_failed" = "true" ]; then
  echo "## ❌ Pipeline FAILED — action required before merge/deploy" >> "$REPORT_FILE"
else
  echo "## ✅ All security checks passed" >> "$REPORT_FILE"
fi

# ── Job results table ─────────────────────────────────────────────────────────
cat >> "$REPORT_FILE" << EOF

## Job Results

| Job | Result | What it checks |
|-----|--------|----------------|
| $(icon "$RESULT_TYPE_CHECK") TypeScript type-check | \`$RESULT_TYPE_CHECK\` | Strict TypeScript — type errors, unused vars, implicit any |
| $(icon "$RESULT_LINT") ESLint | \`$RESULT_LINT\` | Code quality, embedded secrets (high-entropy strings), React safety |
| $(icon "$RESULT_AXIOS_BAN") Axios ban | \`$RESULT_AXIOS_BAN\` | axios absent from source, manifests, and installed deps |
| $(icon "$RESULT_SECRET_SCAN") Secret scanning | \`$RESULT_SECRET_SCAN\` | Full git history (TruffleHog) + working-tree diff (Gitleaks) |
| $(icon "$RESULT_DEP_AUDIT") Dependency audit | \`$RESULT_DEP_AUDIT\` | CVE scan, license allowlist, lockfile integrity, supply-chain risk |
| $(icon "$RESULT_SAST") SAST | \`$RESULT_SAST\` | CodeQL dataflow analysis + Semgrep React/OWASP/XSS rules |
| $(icon "$RESULT_CLAUDE") Claude Code review | \`$RESULT_CLAUDE\` | AI security audit — XSS, injection, secrets, OWASP Top 10 |
| $(icon "$RESULT_BUILD") Build + artifact scan | \`$RESULT_BUILD\` | Build succeeds, dist/ free of leaked secrets, CSP headers intact |

EOF

# ── Per-job remediation guidance (only when jobs failed) ─────────────────────
if [ "$any_failed" = "true" ]; then

cat >> "$REPORT_FILE" << 'EOF'
## 🛠️ What to Fix

> Address every section below before re-running the pipeline.

EOF

  # ── TypeScript ──────────────────────────────────────────────────────────────
  if [ "$RESULT_TYPE_CHECK" = "failure" ]; then
    cat >> "$REPORT_FILE" << 'EOF'
### ❌ TypeScript type-check

**Reproduce locally:**
```bash
npx tsc --noEmit
```

**Fix:** Resolve every error printed above. Common causes:
- Missing or incorrect types — avoid implicit `any`
- Unused variables or parameters — strict mode flags these
- Missing null/undefined checks on optional values

EOF
  fi

  # ── ESLint ──────────────────────────────────────────────────────────────────
  if [ "$RESULT_LINT" = "failure" ]; then
    cat >> "$REPORT_FILE" << 'EOF'
### ❌ ESLint

**Reproduce locally:**
```bash
npx eslint src/ --ext .ts,.tsx --max-warnings 0
```

**Fix:** Resolve every ESLint error. Key security rules enforced:
- `no-secrets/no-secrets` — remove high-entropy strings that resemble credentials
- `react/no-danger` — do not use `dangerouslySetInnerHTML`
- `no-eval` / `no-implied-eval` / `no-new-func` — remove dynamic code execution
- `no-extend-native` — do not mutate built-in prototypes
- `react-hooks/rules-of-hooks` — fix hook call-order violations

EOF
  fi

  # ── Axios ban ───────────────────────────────────────────────────────────────
  if [ "$RESULT_AXIOS_BAN" = "failure" ]; then
    cat >> "$REPORT_FILE" << 'EOF'
### ❌ Axios ban

Axios was detected. Certain axios-adjacent packages have contained trojans.

**Full removal steps:**
```bash
# Remove the package
npm uninstall axios

# Verify it is completely gone
grep -r "axios" package.json package-lock.json src/

# Replace with the native Fetch API:
#   axios.get(url)         →  fetch(url).then(r => r.json())
#   axios.post(url, data)  →  fetch(url, { method: 'POST', body: JSON.stringify(data) })
```

EOF
  fi

  # ── Secret scanning ─────────────────────────────────────────────────────────
  if [ "$RESULT_SECRET_SCAN" = "failure" ]; then
    cat >> "$REPORT_FILE" << 'EOF'
### ❌ Secret scanning (TruffleHog / Gitleaks)

A secret, credential, or high-entropy token was found in the code or git history.

**Fix steps:**
1. Identify the exact secret from the scanner output in the job log
2. **Immediately rotate/revoke** that credential — treat it as compromised
3. Remove the secret from the file
4. If the secret is in git history, rewrite history:
```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove a file from all history
git filter-repo --path <file-with-secret> --invert-paths

# Or redact a specific string from all history
git filter-repo --replace-text <(echo 'THE_SECRET==>REDACTED')

git push --force-with-lease origin main
```
5. Store all credentials in GitHub Secrets — never hardcode them

EOF
  fi

  # ── Dependency audit ────────────────────────────────────────────────────────
  if [ "$RESULT_DEP_AUDIT" = "failure" ]; then
    cat >> "$REPORT_FILE" << 'EOF'
### ❌ Dependency audit

A CVE, license violation, or lockfile inconsistency was detected.

**Reproduce locally:**
```bash
# CVE audit
npm audit

# License check
npx license-checker --onlyAllow "MIT;ISC;BSD-2-Clause;BSD-3-Clause;Apache-2.0;CC0-1.0;Unlicense;0BSD"

# Lockfile consistency
npm ci --dry-run
```

**Fix:**
- CVEs: run `npm audit fix` — review before using `--force`
- License violations: replace the dependency with a compatible alternative
- Lockfile drift: run `npm install`, commit the updated `package-lock.json`

EOF
  fi

  # ── SAST ────────────────────────────────────────────────────────────────────
  if [ "$RESULT_SAST" = "failure" ]; then
    cat >> "$REPORT_FILE" << 'EOF'
### ❌ SAST (CodeQL / Semgrep)

Static analysis detected a security vulnerability in the source code.

**Where to see findings:**
- CodeQL: GitHub repo → Security tab → Code scanning alerts
- Semgrep: printed in the job log

**Common fixes for this React/TypeScript PWA:**
- XSS via `innerHTML`: use `textContent` or JSX rendering instead
- Prototype pollution: validate/sanitize objects from `JSON.parse` before spreading
- ReDoS (unsafe regex): avoid exponential backtracking patterns like `(a+)+`
- `dangerouslySetInnerHTML`: sanitize with DOMPurify or restructure the component
- Open redirects: validate URLs against an allowlist before navigating

EOF
  fi

  # ── Claude ──────────────────────────────────────────────────────────────────
  if [ "$RESULT_CLAUDE" = "failure" ]; then
    cat >> "$REPORT_FILE" << 'EOF'
### ❌ Claude Code AI security review

Claude identified one or more CRITICAL security issues.
See the **Claude Code Full Security Report** section below for the full finding details,
file paths, risk descriptions, and the prioritised Remediation Checklist.

All CRITICAL findings must be resolved before this job will pass.

EOF
  fi

  # ── Build + artifact scan ───────────────────────────────────────────────────
  if [ "$RESULT_BUILD" = "failure" ]; then
    cat >> "$REPORT_FILE" << 'EOF'
### ❌ Build and artifact scan

The build failed, or a secret/forbidden library was detected in the compiled output.

**Build failure — reproduce locally:**
```bash
npm run build
```
Fix all TypeScript and Vite errors printed above.

**Axios found in compiled bundle:**
```bash
grep -r "axios" dist/
# Find the import in source and remove it
```

**Leaked secret in bundle:**
- A `VITE_*` env var containing a secret was embedded in the JS bundle
- Secrets must NEVER be passed via `VITE_*` — they are visible to all users
- Use a backend proxy to keep secrets server-side

**CSP regression:**
- `vercel.json` was modified to weaken the Content-Security-Policy
- Restore `script-src 'self'` — never add `'unsafe-inline'` or `'unsafe-eval'`

EOF
  fi

fi  # end any_failed block

# ── Claude full report (always append when available) ─────────────────────────
if [ -f "$CLAUDE_REPORT_PATH" ]; then
  cat >> "$REPORT_FILE" << 'EOF'

---

## 🤖 Claude Code Full Security Report

EOF
  # Append the Claude report as a preformatted block
  echo '```' >> "$REPORT_FILE"
  cat "$CLAUDE_REPORT_PATH" >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"
fi

# ── Footer ────────────────────────────────────────────────────────────────────
cat >> "$REPORT_FILE" << EOF

---
*Generated by the security pipeline · $(date -u '+%Y-%m-%d %H:%M UTC')*
EOF

# ── Publish to GitHub Actions Step Summary ────────────────────────────────────
cat "$REPORT_FILE" >> "$GITHUB_STEP_SUMMARY"

# ── Print to log ──────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════"
echo "  Consolidated Security Report"
echo "════════════════════════════════════════════"
cat "$REPORT_FILE"
