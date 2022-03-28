const buttons = document.querySelectorAll('.day')

const setButtonsListeners = () => buttons.forEach((button) => button.addEventListener('click', handleButtonClick))

const setButtonsStyle = (days) => buttons.forEach((button, i) => button.classList.toggle('active', days[i]))

const handleButtonClick = ({ target: button }) => {
  const day = parseInt(button.dataset.day)
  chrome.storage.sync.get('days', ({ days }) => {
    days[day] = !days[day]
    chrome.storage.sync.set({ days }, () => {
      setButtonsStyle(days)
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
