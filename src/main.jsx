import React from 'react'
import { createRoot } from 'react-dom/client'
import MusicTracker from '../music-tracker.jsx'

if (!window.storage) {
  window.storage = {
    get: async (key) => {
      const local = localStorage.getItem(key)
      return local ? { value: local } : null
    },
    set: async (key, value) => {
      localStorage.setItem(key, value)
    },
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MusicTracker />
  </React.StrictMode>
)
