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

      const message = { type: 'action-toggle' }

      // Notify tabs that are on a PR page so they can trigger the check.
      chrome.tabs.query({ url: 'https://github.com/*/*/pull/*' }, (tabs) => {
        tabs.forEach((tab) => chrome.tabs.sendMessage(tab.id, message))
      })

      // Notify other interested parts that are not tabs.
      chrome.runtime.sendMessage(message)
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
