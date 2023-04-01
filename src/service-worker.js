'use strict'

const githubUrlPattern = 'https://github.com/*'
const navigationFilter = { urlMatches: githubUrlPattern }

const throttleInterval = 500 // this value was found empirically
let lastEventTimestamp = null

const setIcon = (canMerge) => {
  if (canMerge) {
    chrome.action.setIcon({
      path: {
        16: chrome.runtime.getURL('./icons/icon16.png'),
        32: chrome.runtime.getURL('./icons/icon32.png'),
        48: chrome.runtime.getURL('./icons/icon48.png'),
        128: chrome.runtime.getURL('./icons/icon128.png'),
      }
    })
  } else {
    chrome.action.setIcon({
      path: {
        16: chrome.runtime.getURL('./icons/icon-disabled16.png'),
        32: chrome.runtime.getURL('./icons/icon-disabled32.png'),
        48: chrome.runtime.getURL('./icons/icon-disabled48.png'),
        128: chrome.runtime.getURL('./icons/icon-disabled128.png'),
      }
    })
  }
}

const checkIconForToday = () => {
  chrome.storage.sync.get('days', ({ days }) => {
    const day = new Date().getDay()
    const canMerge = days[day]
    setIcon(canMerge)
  })
}

const handleMessages = (request, sender, sendResponse) => {
  const { type, data } = request

  switch (type) {
    case 'action-toggle':
      checkIconForToday()
      break;
  }

  // Send empty response just to avoid errors in the console. We don't actually have anything to reply.
  sendResponse()
}

const main = () => {
  // Set the default configuration when installing the extension.
  // For updates, the existing days will be preserved.
  chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get('days', ({ days }) => {
      if (!days) {
        // Defaults to allowing everyday but Fridays. Week starts on Sunday.
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

  // After PR page has loaded, GitHub will make a request to check the merge status.
  // We listen for that request and notify the content script on the PR page, so it can trigger the check.
  chrome.webRequest.onCompleted.addListener((details) => {
    chrome.tabs.sendMessage(details.tabId, { type: 'after-check-merge-status', data: details });
  }, {
    urls: [
      // We only listen for the request to check the merge status.
      `${githubUrlPattern}/*/pull/*/partials/merging`
    ]
  });

  // Check the action icon once and then setup the listener for subsequent changes
  checkIconForToday()
  chrome.runtime.onMessage.addListener(handleMessages)
}

main()
