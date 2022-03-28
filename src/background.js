chrome.runtime.onInstalled.addListener(() => {
  const days = [true, true, true, true, true, true, true]
  chrome.storage.sync.set({ days })
})
