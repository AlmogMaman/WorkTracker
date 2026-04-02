# Work Tracker

A local, personal work-hour tracking app. Track time blocks per project throughout your day, see daily/monthly summaries, and make sure you're hitting your 9-hour target.

## Setup

```bash
cd work-tracker
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Start a new block (auto-stops current timer) |
| `S` | Stop the running timer |
| `← / →` | Previous / next day |
| `T` | Jump to today |
| `Ctrl + ,` | Open Settings |

## Data

All data is stored in your browser's `localStorage`. Nothing is sent anywhere.

Use **Settings → Export Backup** regularly to save a `.json` file of all your data.
