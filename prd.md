# Work Tracker — Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-30
**Status:** Draft

---

## 1. Overview

### 1.1 Problem Statement

Existing work-hour tracking tools at the company are inconvenient, slow, and don't reflect how knowledge workers actually work — jumping between multiple projects throughout a single day, often returning to the same project multiple times. The current tool makes it tedious to accurately record this reality.

### 1.2 Solution

A local, personal work-tracking application built as a web app (running locally) that models how work actually happens: a sequence of timed work blocks, each tagged with a project name. The app tracks when you start and stop working on something, accumulates totals per project per day, and gives you an at-a-glance view of whether you've hit your daily 9-hour target.

### 1.3 Goals

- Make daily time entry fast, accurate, and frictionless
- Reflect the real flow of work (context-switching, returning to the same project)
- Surface useful summaries at the day and month level
- Eliminate repetitive typing through smart autocomplete on project names

### 1.4 Non-Goals

- Syncing with the company's existing HR/timesheet system (manual export is acceptable)
- Team or multi-user features
- Billing or invoicing
- Mobile-first design (desktop browser is the primary target)

---

## 2. User Persona

**Primary user:** A single software engineer or knowledge worker who:
- Works across multiple projects in a single day
- Frequently context-switches (sometimes 5–10 times per day)
- Has a contractual obligation to log 9 hours per working day
- Wants to generate a daily/monthly summary to fill out the company's timesheet

---

## 3. Core Concepts

| Concept | Definition |
|---|---|
| **Work Block** | A single continuous period of work on one project. Has a start time, an end time (or is currently running), and a project name. |
| **Project** | A named piece of work. A project can have multiple work blocks in a day. |
| **Day View** | The primary screen: shows all work blocks for a selected calendar day. |
| **Daily Summary** | An aggregated view of total time per project for a given day, plus the total hours worked and a 9-hour target indicator. |
| **Monthly Summary** | An aggregated view of total time per project across all days in a calendar month. |

---

## 4. Feature Requirements

### 4.1 Day View (Primary Screen)

#### 4.1.1 Date Navigation
- The app opens to **today's date** by default.
- There are **Previous Day** and **Next Day** navigation arrows/buttons to move between dates.
- The currently selected date is displayed prominently (e.g., "Monday, March 30, 2026").
- Clicking directly on the date opens a **date picker** (calendar popup) to jump to any date.
- Navigating to a future date is allowed (to plan ahead or pre-enter known blocks).

#### 4.1.2 Work Block List
- The day view displays an **ordered list of work blocks** for the selected day, sorted chronologically by start time.
- Each work block row shows:
  - **Project name** (editable text field with autocomplete — see §4.3)
  - **Start time** (editable, displayed as HH:MM in 24-hour format)
  - **End time** (editable, displayed as HH:MM, or "Running…" if the timer is active)
  - **Duration** (auto-calculated: end time − start time, displayed as `Xh Ym`)
  - **Delete button** (icon button, with a confirmation prompt)
- If no work blocks exist for the selected day, an empty state is shown with a prompt to add the first block.

#### 4.1.3 Adding a Work Block
- A prominent **"+ Add Block"** button (or FAB) is always visible in the day view.
- Clicking it appends a new row with:
  - Start time defaulting to **now** (current time, rounded to the nearest minute)
  - End time left empty (timer is "running")
  - Project name field focused and empty, ready for input
- The user can also **manually enter** both start and end times without starting a live timer (for after-the-fact logging).

#### 4.1.4 Live Timer
- A work block with no end time is considered **active/running**.
- Only **one work block can be running at a time** across the entire app (not just the current day).
- If a block is running:
  - Its duration cell shows a live ticking duration (updates every second or every minute).
  - A visual indicator (e.g., pulsing dot or green badge) marks it as active.
  - A **"Stop"** button is shown on the active row.
- Clicking "Stop" sets the end time to the current time (rounded to the nearest minute) and stops the timer.
- Starting a new block while one is already running **automatically stops the running block** first (sets its end time to now), then creates the new block. The UI should make this transition obvious with a brief confirmation or animation.

#### 4.1.5 Editing a Work Block
- All fields of a work block are directly editable inline.
- **Project name**: clicking opens the autocomplete dropdown (see §4.3).
- **Start time / End time**: clicking opens a time picker (or allows direct keyboard input in HH:MM format). Validation ensures end time > start time.
- If the user manually changes times, the duration recalculates immediately.
- Overlapping time blocks are **allowed** (not forced to be non-overlapping) but flagged with a warning icon.

#### 4.1.6 Daily Progress Indicator
- A **daily progress bar and status badge** is always visible in the day view header.
- It shows:
  - Total hours worked so far that day (sum of all completed + running block durations)
  - A progress bar toward 9 hours
  - A **green checkmark / badge** when total ≥ 9 hours
  - A **red badge with remaining time** (e.g., "−1h 23m") when total < 9 hours
- The target of 9 hours is the default; it should be configurable in Settings (§4.6).

---

### 4.2 Summary Views

#### 4.2.1 Daily Summary Panel
- Accessible via a **"Summary"** tab or button within the Day View.
- Displays a **grouped summary table** for the selected day:
  - One row per unique project name
  - Columns: Project Name | Total Duration
  - Rows sorted by total duration descending (most time first)
  - A footer row showing **Grand Total** (sum of all durations)
- Also shows the **9-hour target indicator** (same as in Day View header).
- A **"Copy Summary"** button copies the table as plain text (for pasting into the company tool), formatted as:
  ```
  Date: Monday, March 30, 2026
  ProjectA        3h 20m
  ProjectB        2h 45m
  ProjectC        1h 15m
  ──────────────────────
  Total           7h 20m  ⚠ 1h 40m remaining
  ```

#### 4.2.2 Monthly Summary View
- Accessible via a **"Monthly View"** button in the navigation area.
- Displays a **month calendar grid** at the top showing each working day with:
  - Total hours logged that day
  - Green dot (≥ 9h) or red dot (< 9h, and the day is in the past)
  - Grey dot / no dot for future days or weekends with no entries
- Below the calendar, a **monthly aggregate table**:
  - One row per unique project seen across the month
  - Columns: Project Name | Total Duration (across all days in that month)
  - Grand Total row at the bottom
- A **month selector** (Previous / Next month arrows + month label) to navigate months.
- A **"Export Month"** button that downloads a `.txt` or `.csv` file of the monthly summary.

---

### 4.3 Project Name Autocomplete

This is a first-class feature, not an afterthought.

#### 4.3.1 Behavior
- When the user clicks or focuses the project name field in any work block row, a **dropdown appears immediately** showing recently/frequently used project names.
- As the user types, the dropdown filters to show only matching project names (fuzzy match or prefix match).
- The user can:
  - **Click** a suggestion to fill the field
  - **Arrow-key** through suggestions and press Enter to select
  - **Type freely** to create a new project name not in the list
- Pressing Escape closes the dropdown without changing the value.

#### 4.3.2 Suggestion Logic
- Suggestions are drawn from **all project names ever used** in any previous work block (across all days).
- They are sorted by: **recency** (most recently used first) as the default sort, with frequently used projects boosted.
- The most recently used project name on the current day appears at the **top of the list** (to make "same project again" clicks instant).
- Suggestions are stored in local data (no external service).

#### 4.3.3 Project Name Management
- In the Settings screen (§4.6), the user can **rename or delete** project names from the global list.
- Renaming a project name retroactively updates all historical work blocks with that name.
- Deleting a project name from the list does **not** delete the associated work blocks; the project name simply stops appearing in autocomplete suggestions.

---

### 4.4 Data Persistence

- All data is stored **locally** on the user's machine.
- Storage format: a **JSON file** on disk in a configurable directory (default: the app's working directory or a user-configurable path).
- The JSON schema stores data per calendar date:
  ```json
  {
    "2026-03-30": [
      {
        "id": "uuid",
        "project": "ProjectA",
        "startTime": "09:00",
        "endTime": "11:20"
      },
      ...
    ]
  }
  ```
- The app reads this file on startup and writes it on every change (debounced, max 500ms delay).
- **No data is sent to any server or external service.**

---

### 4.5 Visual Design & UX

#### 4.5.1 Layout
- Single-page application.
- Top navigation bar with: app title, current date display, navigation to Monthly View, link to Settings.
- Main content area: Day View (default) or Monthly View.
- Clean, minimal aesthetic — no heavy UI frameworks visually cluttering the interface.
- Dark mode and light mode support, respecting the OS/system preference, with a manual toggle.

#### 4.5.2 Color Language
| Color | Meaning |
|---|---|
| Green | Daily target met (≥ 9h) |
| Red / Orange | Daily target not yet met |
| Blue pulsing dot | Active / running timer |
| Grey | Weekend / no-entry day |
| Yellow warning | Overlapping work blocks |

#### 4.5.3 Responsiveness
- Designed for **desktop browser at 1280px+ width**.
- Functional (but not optimized) on smaller screens.

---

### 4.6 Settings

A dedicated Settings screen accessible from the nav bar.

| Setting | Default | Description |
|---|---|---|
| Daily target hours | 9 | Number of hours required per day for the green indicator |
| Data file location | `./worktracker.json` | Path where the JSON data file is saved |
| Project name list | (auto-populated) | View, rename, or delete known project names |
| Week start day | Sunday | Controls the monthly calendar grid layout |
| Time format | 24h | Toggle 24h / 12h AM-PM |

---

### 4.7 Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `N` | Add a new work block (start timer) |
| `S` | Stop the currently running timer |
| `← / →` | Navigate to previous / next day |
| `T` | Jump to today |
| `Ctrl + ,` | Open Settings |
| `Escape` | Close any open dropdown or modal |

---

## 5. Technical Stack (Recommendation)

The app should be buildable and runnable entirely from this repository with minimal setup.

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | React (via Vite) | Fast dev setup, component model fits the UI well |
| **Language** | TypeScript | Type safety for the data model |
| **Styling** | Tailwind CSS | Rapid styling, dark mode support built in |
| **State** | Zustand or React Context | Lightweight, no Redux overhead needed |
| **Storage** | Node.js `fs` via Electron **or** `localStorage` / IndexedDB if pure browser | See §5.1 |
| **Build/Run** | Vite dev server | `npm run dev` to start |

### 5.1 Storage Architecture Decision

Two viable paths:

**Option A — Pure browser app (simpler):**
- Data stored in `localStorage` or IndexedDB.
- Run with `npm run dev`, open in browser.
- Export to `.json` file via a download button; import from file.
- Drawback: data lives in the browser profile, not a portable file.

**Option B — Electron app:**
- True desktop app, reads/writes a real `.json` file on disk.
- Can run at startup, show in system tray.
- Drawback: more setup complexity.

**Recommendation for v1:** Start with Option A (pure browser) to get to a working prototype fastest. Add Electron wrapping in v2 if needed.

---

## 6. Data Model (TypeScript Types)

```typescript
type WorkBlock = {
  id: string;           // UUID
  project: string;      // Project name (free text)
  startTime: string;    // "HH:MM" (24-hour)
  endTime: string | null; // null = timer is running
};

type DayData = {
  date: string;         // "YYYY-MM-DD"
  blocks: WorkBlock[];
};

type AppData = {
  days: Record<string, DayData>; // keyed by "YYYY-MM-DD"
  projectNames: string[];        // ordered list for autocomplete
  settings: AppSettings;
};

type AppSettings = {
  dailyTargetHours: number;      // default: 9
  dataFilePath: string;
  weekStartDay: 0 | 1;           // 0 = Sunday, 1 = Monday
  timeFormat: "24h" | "12h";
};
```

---

## 7. Edge Cases & Validation Rules

| Scenario | Behavior |
|---|---|
| Work block spans midnight | Start and end times can only be on the same calendar day. To work past midnight, the user creates a new block on the next day. |
| End time before start time | Validation error shown inline; block not saved. |
| Overlapping blocks | Allowed but flagged with a yellow warning icon on both overlapping rows. |
| Starting a new timer while one is running | Auto-stop the current running timer (set end = now), then start the new one. Show a toast notification: "Stopped [ProjectA] and started [ProjectB]." |
| Empty project name | Allowed for mid-entry state; a subtle placeholder ("Project name…") is shown. A work block with no project name is saved but highlighted to prompt completion. |
| Same project multiple times in a day | Fully supported. Each row is independent; the daily summary aggregates them. |
| No entries for a day | Show empty state; still show the 0h / 9h progress indicator. |
| Deleting the only block in a day | The day entry is removed from storage (no ghost empty days). |

---

## 8. User Flows

### 8.1 Primary Daily Flow

```
Open app (lands on today)
  → See existing blocks from today (if any)
  → Click "+ Add Block"
      → New row added, start = now, project field focused
      → Type project name (or pick from autocomplete)
  [Work…]
  → Click "Stop" on current block (or click "+ Add Block" for next project)
  → Repeat throughout the day
  → Check progress bar (green = done for the day)
  → Click "Summary" to review and copy daily summary
```

### 8.2 After-the-Fact Logging

```
Open app
  → Navigate to the target date
  → Click "+ Add Block"
      → Manually set start time and end time
      → Enter project name
  → Repeat for all blocks
  → Check summary
```

### 8.3 Monthly Review

```
Click "Monthly View"
  → See calendar grid with green/red dots per day
  → Click on a day to jump to its Day View
  → Scroll to monthly aggregate table
  → Click "Export Month" to download summary
```

---

## 9. Out of Scope for v1

- Integration with any external timesheet or HR system
- Reminders or notifications (e.g., "You haven't logged anything today")
- Pomodoro or break tracking
- Tags, labels, or categories beyond the project name
- Comments or notes on a work block
- Offline-first sync or cloud backup
- Multiple user profiles

These may be considered for future versions based on usage.

---

## 10. Success Criteria

The app is considered a successful v1 when:

1. A user can open the app, start a timer, switch projects multiple times in a day, stop the last timer, and see an accurate daily summary — all in under 60 seconds of interaction.
2. The project autocomplete correctly shows the most recently used project names without any typing.
3. The daily progress indicator correctly turns green when total hours ≥ 9h.
4. The monthly summary correctly aggregates all days in a month and is exportable.
5. Data persists across browser refreshes (no data loss on reload).
6. The app works entirely locally with no external API calls.
