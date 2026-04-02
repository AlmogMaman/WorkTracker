// Runs synchronously before first paint to prevent flash of wrong theme.
// Keep this file minimal — it blocks rendering.
(function () {
  try {
    var saved = localStorage.getItem('theme')
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (saved === 'dark' || (saved === null && prefersDark)) {
      document.documentElement.classList.add('dark')
    }
  } catch (_) {
    // localStorage may be blocked in private-browsing; silently fall back to light mode
  }
})()
