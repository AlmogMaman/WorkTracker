// Deferred service-worker registration — does not block rendering.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {
      // SW registration failure is non-fatal; app still works without it.
    })
  })
}
