'use strict'

const originalMessages = []

// Got some ideas from https://github.com/sanemat/do-not-merge-wip-for-github on which elements to block. Thanks!
const container = document.querySelector('#js-repo-pjax-container')
const getButtonsMerge = () => container.querySelectorAll('.merge-message button[data-details-container]')

const setMergeButtonStatus = (canMerge) => {
  // Draft and closed PRs have 'reviewable_state' === 'draft'.
  // Open and merged PRs have 'reviewable_state' === 'ready'.
  const state = document.querySelector('.State')
  if (state.attributes['reviewable_state'].value !== 'ready') {
    // Don't change draft PRs.
    return
  }

  const reviewPending = document.querySelectorAll('.branch-action-item.js-details-container .completeness-indicator-error')
  if (reviewPending.length > 0) {
    // Don't change PRs with pending reviews.
    return
  }

  const disabled = !canMerge
  const buttonsMerge = getButtonsMerge()

  // If buttons not found, nothing to do. This can happen if we run preventively (before setting up a mutation observer)
  // and the buttons are not ready yet.
  if (buttonsMerge.length == 0) {
    return
  }

  // Store the original messages so we can retrieve them back when toggling off.
  if (originalMessages.length === 0) {
    buttonsMerge.forEach((e, i) => originalMessages[i] = e.innerHTML)
  }

  // Set the status and message for each button.
  buttonsMerge.forEach((buttonMerge, i) => {
    buttonMerge.disabled = disabled
    if (disabled) {
      buttonMerge.innerHTML = 'No merge today'
    } else {
      buttonMerge.innerHTML = originalMessages[i]
    }
  })
}

const checkButtonForToday = () => {
  chrome.storage.sync.get('days', ({ days }) => {
    const day = new Date().getDay()
    const canMerge = days[day]
    setMergeButtonStatus(canMerge)
  })
}

const isPrUrl = (url) => new RegExp('^https://github.com/(.+)/pull/[0-9]+').test(url)

const mutationObserver = new MutationObserver(() => {
  // Query the DOM to see if the buttons are present. We could inspect the mutations but it is too complex for now.
  const buttonsMerge = getButtonsMerge()
  if (buttonsMerge.length > 0) {
    checkButtonForToday()
  }
})

const startMutationObserver = () => mutationObserver.observe(container, { childList: true, subtree: true })
const stopMutationObserver = () => mutationObserver.disconnect()

const handleNavigation = (data) => {
  if (isPrUrl(data.url)) {
    // If navigating to a pull request page (like following a like inside Github, with a client-side navigation),
    // start the mutation observer to catch the moment when the buttons are added.
    startMutationObserver()
  } else {
    // If navigating out of a pull request page, stop watching for mutations.
    stopMutationObserver()
  }
}

const handleMessages = (request, sender, sendResponse) => {
  const { type, data } = request

  switch (type) {
    case 'navigation':
      handleNavigation(data)
      break;
    case 'action-toggle':
      checkButtonForToday()
      break;
  }

  // Send empty response just to avoid errors in the console. We don't actually have anything to reply.
  sendResponse()
}


const main = () => {
  // If we are navigating directly to a pull request page, we should trigger the check.
  if (isPrUrl(location.href)) {
    // Check immediately just to cover the case where the buttons would have already loaded before setting
    // up the mutation observer. This scenario shouldn't usually happen, but just in case.
    checkButtonForToday()
    startMutationObserver()
  }

  // In either case (directly on a pull request page or not), listen for messages.
  chrome.runtime.onMessage.addListener(handleMessages)
}

main()
