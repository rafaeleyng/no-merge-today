'use strict'

// Got some ideas from https://github.com/sanemat/do-not-merge-wip-for-github, on which elements to block. Thanks!

const originalMessages = []

const setMergeButtonStatus = (canMerge) => {
  const disabled = !canMerge

  const container = document.querySelector('#js-repo-pjax-container')
  const buttonsMerge = container.querySelectorAll('.merge-message button[data-details-container]')

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

const checkButtonForToday = () => {
  chrome.storage.sync.get('days', ({ days }) => {
    const day = new Date().getDay()
    const canMerge = days[day]
    setMergeButtonStatus(canMerge)
  })
}

const main = () => {
  checkButtonForToday()
  setInterval(checkButtonForToday, 1000)
}

main()
