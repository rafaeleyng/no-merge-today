'use strict'

const buttons = document.querySelectorAll('.day')

const setButtonsListeners = () => buttons.forEach((button) => button.addEventListener('click', handleButtonClick))

const setButtonsStyle = (days) => buttons.forEach((button, i) => button.classList.toggle('active', days[i]))

const handleButtonClick = ({ target: button }) => {
  const day = parseInt(button.dataset.day)
  chrome.storage.sync.get('days', ({ days }) => {
    days[day] = !days[day]
    chrome.storage.sync.set({ days }, () => {
      setButtonsStyle(days)

      // Notify tabs that are on a PR page so they can trigger the check.
      chrome.tabs.query({ url: 'https://github.com/*/*/pull/*' }, (tabs) => {
        tabs.forEach((tab) => chrome.tabs.sendMessage(tab.id, { type: 'action-toggle' }))
      })
    })
  })
}

const main = () => {
  chrome.storage.sync.get('days', ({ days }) => {
    setButtonsStyle(days)
    setButtonsListeners()
  })
}

main()
