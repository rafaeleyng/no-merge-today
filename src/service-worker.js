'use strict'

const githubUrlPattern = 'https://github.com/*'
const navigationFilter = { urlMatches: githubUrlPattern }

const throttleInterval = 800 // this value was found empirically
let lastEventTimestamp = null

const main = () => {
  // Set the default configuration when installing the extension.
  // For updates, the existing days will be preserved.
  chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get('days', ({ days }) => {
      if (!days) {
        const defaultDays = [true, true, true, true, true, false, true]
        chrome.storage.sync.set({ days: defaultDays })
      }
    })
  })

  // Listen for navigation changes to know when the user is going to a PR page.
  chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    chrome.tabs.query({ url: githubUrlPattern }, (tabs) => {
      const targetTab = tabs.find(t => t.id === details.tabId)
      if (targetTab) {
        if (lastEventTimestamp && details.timeStamp - lastEventTimestamp < throttleInterval) {
          // Here we assume the history update event fired twice quickly for the same navigation (as it does),
          // so we discard the second.
          return
        }
        lastEventTimestamp = details.timeStamp

        // If a tab does a client-side navigation to a PR page, notify the content script on that tab,
        // so it can trigger the check.
        chrome.tabs.sendMessage(targetTab.id, { type: 'navigation', data: details })
      }
    })
  }, navigationFilter)
}

main()
