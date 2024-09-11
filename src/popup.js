// @ts-check

/**
 * Updates the request count displayed in the popup
 * @param {number} count - The number of successful requests
 */
function updateRequestCount(count) {
    const countElement = document.getElementById('request-count');
    if (countElement) {
        countElement.textContent = count.toString();
    }
}

/**
 * Requests the current count from the background script
 */
function requestCurrentCount() {
    if (chrome.runtime) {
        chrome.runtime.sendMessage({action: 'getCount'}, (response) => {
            if (response && typeof response.count === 'number') {
                updateRequestCount(response.count);
            }
        });
    }
}

// Listen for messages from the background script
if (chrome.runtime) {
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === 'updateCount') {
            updateRequestCount(message.count);
        }
    });
}

// Request the current count when the popup is opened
document.addEventListener('DOMContentLoaded', requestCurrentCount);