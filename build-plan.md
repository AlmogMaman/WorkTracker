# Work Tracker — Step-by-Step Build Plan

**Stack:** React + TypeScript + Vite + Tailwind CSS + Zustand + localStorage

---

## Phase 1 — Project Scaffolding

### Step 1: Initialize the Vite + React + TypeScript project
- Run `npm create vite@latest work-tracker -- --template react-ts`
- `cd work-tracker && npm install`
- Verify it runs: `npm run dev`

### Step 2: Install dependencies
```
npm install zustand uuid
npm install -D tailwindcss @tailwindcss/vite
```
- Packages needed: `zustand` (state), `uuid` (unique IDs for work blocks)
- Configure Tailwind: add the Vite plugin to `vite.config.ts`, add `@import "tailwindcss"` to `index.css`

### Step 3: Set up project folder structure
```
src/
  components/       ← UI components
  store/            ← Zustand store
  types/            ← TypeScript types
  utils/            ← Pure helper functions
  hooks/            ← Custom React hooks
  App.tsx
  main.tsx
```

### Step 4: Define all TypeScript types
Create `src/types/index.ts` with:
- `WorkBlock` (id, project, startTime, endTime | null)
- `DayData` (date, blocks)
- `AppData` (days, projectNames, settings)
- `AppSettings` (dailyTargetHours, weekStartDay, timeFormat)

---

## Phase 2 — Data Layer

### Step 5: Build the storage utility
Create `src/utils/storage.ts`:
- `loadData(): AppData` — reads from `localStorage`, returns default structure if empty
- `saveData(data: AppData): void` — writes to `localStorage` (JSON.stringify)
- Define the default/empty `AppData` shape used on first run

### Step 6: Build time utility functions
Create `src/utils/time.ts`:
- `nowHHMM(): string` — current time as "HH:MM"
- `parseDuration(start: string, end: string | null): number` — returns minutes
- `formatDuration(minutes: number): string` — returns "Xh Ym" (e.g., "2h 30m")
- `formatDate(dateStr: string): string` — "YYYY-MM-DD" → "Monday, March 30, 2026"
- `todayStr(): string` — returns today as "YYYY-MM-DD"
- `addDays(dateStr: string, n: number): string` — date arithmetic
- `isSameOrBefore(a: string, b: string): boolean` — date comparison

### Step 7: Build the Zustand store
Create `src/store/useAppStore.ts` with:

**State:**
- `data: AppData` (loaded from localStorage on init)
- `selectedDate: string` (today by default)
- `view: "day" | "month" | "settings"` (current screen)

**Actions (all auto-persist after mutation):**
- `setSelectedDate(date: string)`
- `setView(view)`
- `addBlock(date: string)` — creates new block with startTime=now, endTime=null; auto-stops any running block first
- `stopBlock(id: string)` — sets endTime=now on the specified block
- `updateBlock(id: string, changes: Partial<WorkBlock>)` — for inline edits
- `deleteBlock(id: string, date: string)`
- `getRunningBlock(): WorkBlock | null` — finds the one block with endTime=null across all days
- `getDayBlocks(date: string): WorkBlock[]`
- `getDailySummary(date: string): { project: string; minutes: number }[]`
- `getMonthlySummary(yearMonth: string): { project: string; minutes: number }[]`
- `getAllProjectNames(): string[]` — sorted by recency for autocomplete
- `renameProject(oldName: string, newName: string)` — updates all blocks
- `updateSettings(changes: Partial<AppSettings>)`

---

## Phase 3 — Core Day View

### Step 8: Build the App shell + navigation bar
Create `src/App.tsx`:
- Top nav bar: app title ("Work Tracker"), today shortcut button, Monthly View button, Settings button
- Renders `<DayView />`, `<MonthView />`, or `<SettingsView />` based on store `view`

Create `src/components/NavBar.tsx`:
- View switcher (Day / Month / Settings)
- Dark mode toggle (reads `prefers-color-scheme`, stores preference)

### Step 9: Build the DayView container
Create `src/components/DayView.tsx`:
- Renders: DateNavigator, ProgressBar, WorkBlockList, DailySummaryPanel
- Pulls `selectedDate` and `getDayBlocks(selectedDate)` from store

### Step 10: Build DateNavigator
Create `src/components/DateNavigator.tsx`:
- Left arrow → previous day (`addDays(selectedDate, -1)`)
- Right arrow → next day (`addDays(selectedDate, +1)`)
- Center: formatted date label, clickable → opens DatePickerPopup
- "Today" shortcut button (jumps to `todayStr()`, disabled when already on today)

Create `src/components/DatePickerPopup.tsx`:
- Simple calendar popup (build from scratch or use a tiny library like `react-day-picker`)
- Clicking a date sets `selectedDate` and closes the popup

### Step 11: Build ProgressBar
Create `src/components/ProgressBar.tsx`:
- Computes total minutes for the selected day (all blocks including running)
- Progress bar fills proportionally toward `dailyTargetHours * 60` minutes
- Badge: green "✓ 9h done" when met; red "−1h 23m" when not
- Refreshes every 30 seconds (to update running timer contribution)

### Step 12: Build WorkBlockList
Create `src/components/WorkBlockList.tsx`:
- Maps over `getDayBlocks(selectedDate)`, sorted by startTime
- Renders a `<WorkBlockRow />` for each block
- Shows empty state when no blocks exist
- "+ Add Block" button at the bottom (calls `addBlock(selectedDate)`)

### Step 13: Build WorkBlockRow
Create `src/components/WorkBlockRow.tsx` — the most complex component:

**Layout:** `[ProjectField] [StartTimeField] [EndTimeField] [DurationBadge] [StopBtn?] [DeleteBtn]`

- **ProjectField:** `<ProjectAutocomplete />` component (Step 14)
- **StartTimeField:** click-to-edit input, type in HH:MM; on blur validates and calls `updateBlock`
- **EndTimeField:** same as StartTimeField; if block is running, shows pulsing "Running…" badge instead
- **DurationBadge:** `formatDuration(parseDuration(start, end))`, live-updating if running (via `useInterval` hook)
- **StopBtn:** only shown when `endTime === null`; calls `stopBlock(id)`
- **DeleteBtn:** trash icon; shows a confirmation tooltip/dialog; calls `deleteBlock(id, date)`
- **Overlap warning:** if this block overlaps another, shows yellow `⚠` icon

### Step 14: Build ProjectAutocomplete
Create `src/components/ProjectAutocomplete.tsx` — critical feature:
- Input field; on focus: opens dropdown immediately with all known projects (recency-sorted)
- On change: filters suggestions by case-insensitive substring match
- Keyboard: ArrowDown/ArrowUp moves highlight; Enter selects; Escape closes
- Click outside: closes dropdown
- On select: calls `updateBlock(id, { project: value })`; also updates autocomplete list recency
- Uses a `useClickOutside` hook to detect outside clicks

### Step 15: Build DailySummaryPanel
Create `src/components/DailySummaryPanel.tsx`:
- Toggle button in DayView to show/hide this panel
- Table: Project | Total Duration, sorted by duration desc
- Grand Total footer row
- "Copy Summary" button: formats plain text and calls `navigator.clipboard.writeText(...)`
- Same ProgressBar / target indicator shown at top

---

## Phase 4 — Monthly View

### Step 16: Build MonthView container
Create `src/components/MonthView.tsx`:
- Month selector: left/right arrows + "Month Year" label
- State: `selectedYearMonth: string` ("2026-03")
- Renders `<MonthCalendarGrid />` and `<MonthSummaryTable />`

### Step 17: Build MonthCalendarGrid
Create `src/components/MonthCalendarGrid.tsx`:
- 7-column grid (Sun–Sat or Mon–Sun based on settings)
- For each day cell:
  - Day number
  - Total hours logged (e.g., "7h 20m")
  - Green dot (≥ target), red dot (< target and in the past), no dot (future / weekend with no entries)
  - Clicking a day: sets `selectedDate` to that day, switches to Day View

### Step 18: Build MonthSummaryTable
Create `src/components/MonthSummaryTable.tsx`:
- Calls `getMonthlySummary(selectedYearMonth)`
- Table: Project | Total Duration
- Grand Total footer
- "Export Month" button: builds a `.txt` string and triggers a file download via a data URL

---

## Phase 5 — Settings View

### Step 19: Build SettingsView
Create `src/components/SettingsView.tsx`:

**Sections:**
1. **Daily target:** number input (hours), updates `settings.dailyTargetHours`
2. **Time format:** radio toggle 24h / 12h
3. **Week start day:** radio toggle Sunday / Monday
4. **Project name manager:** list of all known project names
   - Each row: name label, "Rename" button (inline edit), "Remove from suggestions" button
   - Rename triggers `renameProject(old, new)` — updates all historical blocks
5. **Data:** "Export all data" button (downloads `worktracker.json`), "Import data" button (file input, merges or replaces)

---

## Phase 6 — Keyboard Shortcuts & Polish

### Step 20: Implement keyboard shortcuts
Create `src/hooks/useKeyboardShortcuts.ts`:
- `N` → `addBlock(selectedDate)` (only when not focused in an input)
- `S` → `stopBlock(runningBlock.id)` (only when a block is running)
- `ArrowLeft` → previous day
- `ArrowRight` → next day
- `T` → today
- `Ctrl+,` → open Settings
- `Escape` → close any open dropdown/modal

Register in `App.tsx` via `useEffect` on `window.addEventListener('keydown', ...)`.

### Step 21: Add toast notifications
Create `src/components/Toast.tsx` + `src/hooks/useToast.ts`:
- Show brief (3s) notifications for:
  - "Stopped [ProjectA] and started [ProjectB]"
  - "Summary copied to clipboard"
  - "Data exported"
  - Validation errors (e.g., "End time must be after start time")

### Step 22: Add dark mode support
- In `index.css`: Tailwind dark mode via `class` strategy
- In NavBar: toggle button flips `dark` class on `<html>`
- On startup: read `localStorage.getItem("theme")` or `prefers-color-scheme`
- Apply dark/light Tailwind classes to all components

### Step 23: Overlap detection
In `WorkBlockList.tsx` (or a utility):
- After rendering, detect pairs of blocks where time ranges intersect
- Pass an `overlapping: boolean` prop to affected `WorkBlockRow` instances
- Row shows yellow `⚠` icon when `overlapping === true`

### Step 24: Live timer tick
Create `src/hooks/useInterval.ts`:
- Generic hook: `useInterval(callback, delayMs)`
- Use in `WorkBlockRow` when `endTime === null` to re-render duration every 60 seconds
- Use in `ProgressBar` to re-compute total hours every 30 seconds

---

## Phase 7 — Data Persistence Hardening

### Step 25: Debounced localStorage writes
In the Zustand store:
- Wrap every state mutation to call a debounced `persist()` function (500ms delay)
- This prevents thrashing localStorage on rapid keystroke edits

### Step 26: Data migration / versioning
In `storage.ts`:
- Store a `version` field in the JSON (start at `1`)
- On load, if version is missing or old, run migration functions to bring data up to current schema
- This future-proofs the data format

### Step 27: Data export / import
In `SettingsView`:
- Export: serialize `AppData` → JSON → trigger browser download as `worktracker.json`
- Import: file input → parse JSON → validate shape → merge into store (or replace, with confirmation)

---

## Phase 8 — Final QA Checklist

### Step 28: Manual test all user flows
Go through each flow from the PRD:
- [ ] Primary daily flow: add block, switch projects, stop timer, view summary, copy it
- [ ] After-the-fact logging: navigate to past date, manually enter start/end times
- [ ] Monthly view: check dots, click a day, export month
- [ ] Settings: change target hours, rename a project, verify it updates history

### Step 29: Edge case verification
- [ ] Start timer → refresh browser → timer still shows as running
- [ ] Delete the only block of a day → day disappears from monthly view
- [ ] Enter end time before start time → see validation error
- [ ] Create two overlapping blocks → both show yellow warning
- [ ] Rename a project → all past blocks update
- [ ] Press N to start timer while already in an input → shortcut does NOT fire

### Step 30: Final cleanup
- Remove all `console.log` statements
- Verify no TypeScript errors (`npm run build` completes cleanly)
- Check that `npm run dev` + open `http://localhost:5173` is the only setup needed
- Write a short `README.md` with: setup instructions, how to run, how to export data

---

## Build Order Summary (what to build first)

```
Step 1–4    → Scaffold & types          (foundation, ~30 min)
Step 5–7    → Data layer & store        (all logic lives here, ~1–2h)
Step 8–9    → App shell + DayView       (skeleton visible, ~30 min)
Step 10     → DateNavigator             (navigate days, ~30 min)
Step 11     → ProgressBar               (instant value, very visible, ~20 min)
Step 12–13  → WorkBlockList + Row       (core of the app, ~1.5h)
Step 14     → ProjectAutocomplete       (key UX feature, ~1h)
Step 15     → DailySummaryPanel         (first summary, ~45 min)
Step 16–18  → MonthView                 (second major screen, ~1.5h)
Step 19     → SettingsView              (~45 min)
Step 20–24  → Polish: shortcuts, toasts, dark mode, overlaps, live tick (~1.5h)
Step 25–27  → Persistence hardening     (~45 min)
Step 28–30  → QA + cleanup              (~1h)
```

**Estimated total:** ~12–15 hours of focused work across multiple sessions.
