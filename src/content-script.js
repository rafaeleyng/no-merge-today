'use strict'

// Got some ideas from https://github.com/sanemat/do-not-merge-wip-for-github, on which elements to block. Thanks!

const originalMessages = []

const container = document.querySelector('#js-repo-pjax-container')

const getButtonsMerge = () => container.querySelectorAll('.merge-message button[data-details-container]')

const setMergeButtonStatus = (canMerge) => {
  const disabled = !canMerge
  const buttonsMerge = getButtonsMerge()

  if (buttonsMerge.length > 0 && originalMessages.length === 0) {
    buttonsMerge.forEach((e, i) => originalMessages[i] = e.innerHTML)
  }

  buttonsMerge.forEach((buttonMerge, i) => {
    buttonMerge.disabled = disabled
    if (disabled) {
      buttonMerge.innerHTML = 'No merge today'
    } else {
      buttonMerge.innerHTML = originalMessages[i]
    }
  })
}

const checkButtonForToday = () => chrome.storage.sync.get('days', ({ days }) => {
  const day = new Date().getDay()
  const canMerge = days[day]
  setMergeButtonStatus(canMerge)
})

const watchMessages = () => chrome.runtime.onMessage.addListener(checkButtonForToday)

const watchButtons = () => new MutationObserver((mutationList, observer) => {
  // Query the DOM to see if the buttons are present. We could inspect the mutations but it is too complex for now.
  const buttonsMerge = getButtonsMerge()
  if (buttonsMerge.length > 0) {
    checkButtonForToday()
    // Now the buttons are already in the DOM and with the correct status, we can disconnect the observer
    // and just watch for messages.
    observer.disconnect()
    watchMessages()
  }
})
  .observe(container, { childList: true, subtree: true })


const main = () => {
  const buttonsMerge = getButtonsMerge()
  if (buttonsMerge.length > 0) {
    // If for some reason the buttons already exist before running this, skip setting up the mutation observer
    checkButtonForToday()
    watchMessages()
  } else {
    watchButtons()
  }
}

main()
