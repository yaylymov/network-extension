// @ts-check

let currentTabId = null;

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
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                currentTabId = tabs[0].id;
                chrome.runtime.sendMessage({action: 'getCount'}, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError.message);
                    }
                    if (response && typeof response.count === 'number') {
                        updateRequestCount(response.count);
                    }
                });
            }
        });
    }
}

// Listen for messages from the background script
if (chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender) => {
        if (message.action === 'updateCount' && message.tabId === currentTabId) {
            updateRequestCount(message.count);
        }
    });
}

// Request the current count when the popup is opened
document.addEventListener('DOMContentLoaded', requestCurrentCount);

// Periodically request the current count to ensure accuracy
setInterval(requestCurrentCount, 5000); // Update every 5 seconds