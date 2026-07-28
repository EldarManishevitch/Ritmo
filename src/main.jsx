import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Registers public/sw.js (push notifications + a stable SW context backing the
// Cache Storage API used by src/lib/lyricsCache.js for instant/offline reopen).
// Registration is deliberately fire-and-forget after load so it never delays
// first paint.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* noop */ })
  })
}
