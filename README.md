# Work Tracker

A personal work-hour tracking PWA. Track time by project, see daily and monthly summaries, and hit your daily target — all stored locally in your browser with no account or server required.

---

## Features

- **Per-project timers** — start/stop a live timer per project with seconds precision; multiple sessions per project per day
- **Inline project rename** — tap the project name on any card to rename it in place
- **Manual blocks** — add and edit time blocks by hand with time pickers
- **Daily target** — configurable hour goal with a live progress bar (green when met, red when behind)
- **Custom targets** — override the daily target for a specific date or date range
- **Monthly calendar** — visual overview with color-coded dots; tap any day to see a summary popup with a "Go to day" button
- **Monthly summary** — per-project totals with `.txt` export
- **Project autocomplete** — searchable, scrollable picker; remove entries you no longer need
- **Swipe gestures** — swipe left/right to move between Day, Month, and Settings views (mobile)
- **English / Hebrew** — full UI translation with automatic RTL layout for Hebrew
- **Dark mode** — system preference detected on first load, toggleable at any time
- **PWA / installable** — works offline, installs to home screen on Android and iOS
- **Export / Import** — JSON backup and restore; import takes effect immediately without a reload

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| State | Zustand 5 |
| Styling | Tailwind CSS 3 (dark mode via `class`, RTL via `rtl:` variants) |
| IDs | `uuid` v4 (crypto-secure) |
| Persistence | `localStorage` (debounced, 400 ms) |
| PWA | Manual service worker + Web App Manifest |
| i18n | Custom lightweight system — no library |

No backend. No external API calls. No tracking.

---

## CI/CD Pipeline

Every push and pull request runs a full security pipeline on GitHub Actions before any code reaches production.

### CI Jobs (run in parallel, all must pass before deploy)

| Job | What it checks |
|---|---|
| TypeScript type-check | Strict `tsc --noEmit` — type errors, unused vars, implicit any |
| ESLint | Code quality, `react/no-danger`, `no-eval`, high-entropy string detection |
| Axios ban | Confirms axios is absent from source files, `package.json`, lockfile, and installed deps |
| Secret scanning | Full git history (TruffleHog) + working-tree diff (Gitleaks) |
| Dependency audit | CVE scan (`npm audit`), license allowlist, lockfile integrity |
| SAST | CodeQL deep dataflow analysis + Semgrep (React, OWASP Top 10, XSS, secrets rulesets) |
| Claude Code review | AI security audit — XSS, injection, prototype pollution, OWASP Top 10, service worker attack surface |
| Build + artifact scan | Build succeeds, `dist/` free of leaked secrets, CSP headers verified |

### CD (deploy to Vercel)

Triggers only when the full CI workflow passes on `main`. Runs a final axios check on the compiled bundle, deploys to Vercel, then verifies the live security headers on the deployed URL.

### Consolidated Security Report

On every failed run, a markdown report is published to the GitHub Actions **Summary** tab listing every failing job with exact reproduction commands and fix instructions. The Claude Code full findings report (with file paths, risk descriptions, and a prioritised remediation checklist) is embedded at the end.

### Required GitHub Secrets

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Account Settings → General → Your ID |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings → General → Project ID |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## Running on Your Phone (PWA)

### Option A — Deploy online (works anywhere)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com), import your repo — it auto-detects Vite
3. Open the generated URL in Chrome on Android
4. Tap the browser menu → **"Add to Home Screen"**

`vercel.json` is already configured with production security headers.

### Option B — Local Wi-Fi only

```bash
npm run dev -- --host
```

Find your PC's local IP (`ipconfig` on Windows, look for IPv4 under your Wi-Fi adapter), then open `http://192.168.x.x:5173` in Chrome on your phone. Add to Home Screen from the browser menu.

> Service worker offline caching requires HTTPS — Option B works fully online; offline caching only works with Option A (or any HTTPS host).

---

## Project Structure

```
src/
  components/       React components
  hooks/            useInterval, useClickOutside, useKeyboardShortcuts, useSwipeGesture
  i18n/             translations.ts (EN + HE), useTranslation hook
  store/            useAppStore.ts — Zustand store, all mutations
  types/            index.ts — shared TypeScript types
  utils/
    storage.ts      localStorage load/save, import/export, schema validation
    time.ts         Pure time/date helpers (seconds-precision duration formatting)
public/
  sw.js             Service worker (cache-first, cache v2)
  manifest.json     PWA manifest
  theme-init.js     Dark mode init (synchronous, no-FOUC)
  sw-register.js    Service worker registration (deferred)
  _headers          Netlify security headers
.github/
  workflows/
    ci.yml          Full security pipeline (8 parallel jobs)
    deploy.yml      Vercel production deployment
  scripts/
    generate-report.sh  Consolidated security report generator
vercel.json         Vercel deployment + security headers
.eslintrc.cjs       ESLint config with security rules
```

---

## Data Model

All data lives in `localStorage` under the key `worktracker_v1`.

```typescript
AppData {
  version: number
  days: Record<"YYYY-MM-DD", WorkBlock[]>
  settings: {
    dailyTargetHours: number      // default 9
    weekStartDay: 0 | 1           // 0 = Sunday
    timeFormat: "24h" | "12h"
    language: "en" | "he"
  }
  projectOrder: string[]          // MRU order for autocomplete
  dayTargets: Record<"YYYY-MM-DD", number>   // per-day overrides
  rangeTargets: RangeTarget[]     // date-range overrides
}

WorkBlock {
  id: string               // UUID v4
  project: string          // sanitized (strips < > " ' &, max 200 chars)
  startTime: string        // "HH:MM"
  startTimestamp?: number  // Date.now() — for live timer accuracy
  endTime: string | null   // null = running
}
```

---

## Custom Targets

Daily target priority (highest wins):

1. **Day override** — set inline via the pencil icon next to the progress bar
2. **Range override** — set in Settings → Custom Targets
3. **Global setting** — Settings → General → Daily target hours

---

## Security

- Input sanitization on all project names (`< > " ' &` stripped, 200-char cap)
- Full schema validation on every JSON import (type-checked, range-clamped)
- 5 MB import size cap
- CSP: `script-src 'self'` — no `unsafe-inline` for scripts
- HTTP security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS, `Referrer-Policy`, `Permissions-Policy`
- No external network requests — all data stays on your device
- Axios explicitly banned — detected at source, manifest, install, and bundle levels in CI
- All CI actions pinned to exact versions; Dependabot configured for weekly updates

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `N` | Start new project (auto-stops current) |
| `S` | Stop running timer |
| `← / →` | Previous / next day |
| `T` | Jump to today |
| `Ctrl + ,` | Open Settings |
