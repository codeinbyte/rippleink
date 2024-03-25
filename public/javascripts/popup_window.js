// Create the popup container element
const popupContainer = document.createElement('div');
popupContainer.id = 'popup';

const popupContent = document.createElement('div');
popupContent.id = 'popup-content';

const popupBackground = document.createElement('div');
popupBackground.id = 'popup-background';

const closeButton = document.createElement('p');
closeButton.id = 'popup-close-button';
closeButton.textContent = 'X';

const messageParagraph = document.createElement('p');
messageParagraph.id = 'popup-message';

const okButton = document.createElement('button');
okButton.id = 'popup-btn-ok';
okButton.textContent = 'OK';

const cancelButton = document.createElement('button');
cancelButton.id = 'popup-btn-cancel';
cancelButton.textContent = 'Cancel';

// Append elements to popup content
popupContent.appendChild(closeButton);
popupContent.appendChild(messageParagraph);
popupContent.appendChild(okButton);
popupContent.appendChild(cancelButton);

// Append popup content and background to popup container
popupContainer.appendChild(popupContent);
popupContainer.appendChild(popupBackground);

// Append popup container to body element
document.body.appendChild(popupContainer);

// Show popup confirmation window when user try to perform critical action
function popupConfirmation(message, functionToPass) {

  // When popup is closed, remove event listener and hide popup
  function resetPopupSettings() {
    okButton.removeEventListener('click', onConfirmClick);
    cancelButton.removeEventListener('click', resetPopupSettings);
    closeButton.removeEventListener('click', resetPopupSettings);
    popupBackground.removeEventListener('click', resetPopupSettings);
    popupContainer.style.display = 'none';
    okButton.style.display = 'none';
    cancelButton.style.display = 'none';
  }

  function onConfirmClick() {
    resetPopupSettings();
    functionToPass();
  }

  messageParagraph.innerHTML = message;
  popupContainer.style.display = 'block';

  okButton.style.display = 'inline-block';
  okButton.addEventListener('click', onConfirmClick);

  cancelButton.style.display = 'inline-block';
  cancelButton.addEventListener('click', resetPopupSettings);

  closeButton.addEventListener('click', resetPopupSettings);
  popupBackground.addEventListener('click', resetPopupSettings);
}

// Show popup window to display text message or HTML, with optional timer to auto close
function popupMessage(message, duration=0) {
  let popupTimeout;
  messageParagraph.innerHTML = message;
  popupContainer.style.display = 'block';

  function closePopup() {
    closeButton.removeEventListener('click', closePopup);
    popupBackground.removeEventListener('click', closePopup);
    popupContainer.style.display = 'none';

    clearTimeout(popupTimeout);  // Clear auto close if user close it manually
  }

  // Auto close the popup window if user set duration
  if (duration !== 0) {
    popupTimeout = setTimeout(() => {
      closePopup();
    }, duration * 1000);  // convert to seconds
  }

  popupBackground.addEventListener('click', closePopup);
  closeButton.addEventListener('click', closePopup);
}
