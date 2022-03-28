'use strict'

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get('days', ({ days }) => {
    if (!days) {
      const defaultDays = [true, true, true, true, true, false, true]
      chrome.storage.sync.set({ days: defaultDays })
    }
  })
})
