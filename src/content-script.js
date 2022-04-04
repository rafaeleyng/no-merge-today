'use strict'

let originalState = null
let didToggleCanMerge = false

const storeOriginalState = (canMerge, buttons) => {
  const storeState = () => {
    originalState = {
      canMerge: canMerge,
      buttonsDetails: buttons.map((button, i) => ({
        message: button.innerHTML,
        disabled: button.disabled,
      }))
    }
  }

  // We want to store the original state in 2 cases:
  // 1. if there was no original state stored, just store it, no more questions asked;
  const isFirstState = originalState === null
  if (isFirstState) {
    storeState()
    return
  }

  // 2. This detects the case where we open the page and the buttons are disabled with "Checking for ability to merge".
  // They become enabled again without the extension participating (didToggleCanMerge is false), so when that happen we
  // redefine the original buttons to be the enabled ones, instead of the disabled ones that appeared first.
  const allWereDisabled = originalState.buttonsDetails.every(button => button.disabled)
  const someAreEnabled = buttons.some(button => !button.disabled)
  const shouldOverrideFirstState = !didToggleCanMerge && allWereDisabled && someAreEnabled
  if (shouldOverrideFirstState) {
    storeState()
    return
  }
}

// Got some ideas from https://github.com/sanemat/do-not-merge-wip-for-github on which elements to block. Thanks!
const container = document.querySelector('#js-repo-pjax-container')
const getMergeButtons = () => [...container.querySelectorAll('.merge-message button[data-details-container]')]

const setMergeButtonStatus = (canMerge) => {
  const buttons = getMergeButtons()

  // If buttons not found, nothing to do. This can happen if we run preventively (before setting up a mutation observer)
  // and the buttons are not ready yet.
  if (buttons.length == 0) {
    return
  }

  storeOriginalState(canMerge, buttons)

  // Check if was ever toggled, or if all invocations so far happened just by observing DOM mutations.
  if (!didToggleCanMerge && originalState && canMerge !== originalState.canMerge) {
    didToggleCanMerge = true
  }

  // Set the status and message for each button.
  buttons.forEach((button, i) => {
    const originalDisabled = originalState.buttonsDetails[i].disabled
    const originalMessage = originalState.buttonsDetails[i].message
    const disabled = canMerge ? originalDisabled : true
    const message = canMerge ? originalMessage : (originalDisabled ? originalMessage : 'No merge today')

    // Important: only set if values are different, to avoid an infinite loop of calls to the observer callback.
    if (button.disabled !== disabled) {
      button.disabled = disabled
    }

    if (button.innerHTML !== message) {
      button.innerHTML = message
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
  const buttons = getMergeButtons()
  if (buttons.length > 0) {
    checkButtonForToday()
  }
})

const startMutationObserver = () => mutationObserver.observe(container, { childList: true, subtree: true })
const stopMutationObserver = () => mutationObserver.disconnect()

const handleNavigation = (data) => {
  // Reset, regardless we are going in or out of a PR page.
  originalState = null
  didToggleCanMerge = false

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
