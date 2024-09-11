// Object to store request counts for each tab
const tabRequestCounts = {};

// Function to update the badge text
function updateBadge(tabId) {
    const count = tabRequestCounts[tabId] || 0;
    chrome.action.setBadgeText({text: count.toString(), tabId: tabId});
    chrome.action.setBadgeBackgroundColor({color: '#53c458', tabId: tabId});
}

// Function to send updated count to all listeners
function broadcastCount(tabId) {
    const count = tabRequestCounts[tabId] || 0;
    chrome.tabs.sendMessage(tabId, {action: 'updateCount', count: count}, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error sending message to tab:', chrome.runtime.lastError.message);
        }
    });
    chrome.runtime.sendMessage({action: 'updateCount', count: count, tabId: tabId}, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error broadcasting update:', chrome.runtime.lastError.message);
        }
    });
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading') {
        console.log(`Tab ${tabId} is loading. Resetting request count.`);
        // Reset the count for the tab when it starts loading
        tabRequestCounts[tabId] = 0;
        updateBadge(tabId);
        broadcastCount(tabId);
    }

    if (changeInfo.status === 'complete') {
        // // Initialize the count for the tab if it doesn't exist
        // if (!tabRequestCounts[tabId]) {
        //     tabRequestCounts[tabId] = 0;
        // }
        console.log(`Tab ${tabId} has finished loading.`);
        updateBadge(tabId);
        broadcastCount(tabId);
    }
});

// Listen for tab removals
chrome.tabs.onRemoved.addListener((tabId) => {
    console.log(`Tab ${tabId} was closed. Removing request count.`);
    // Remove the count for the closed tab
    delete tabRequestCounts[tabId];
});

// Listen for web requests
chrome.webRequest.onCompleted.addListener(
    (details) => {
        if (details.tabId && details.tabId !== -1 && details.tabId !== 'undefined' && details.statusCode >= 200 && details.statusCode < 300) {
            // Increment the count for successful requests
            tabRequestCounts[details.tabId] = (tabRequestCounts[details.tabId] || 0) + 1;

            // Log the details of the request that was counted
            console.log(`Incremented request count for tab ${details.tabId}.`);
            console.log(`URL: ${details.url}, Status Code: ${details.statusCode}, Type: ${details.type}`);

            updateBadge(details.tabId);
            broadcastCount(details.tabId);
        } else {
            // Log the requests that were not counted (for debugging)
            console.log(`Request not counted for tab ${details.tabId}. URL: ${details.url}, Status Code: ${details.statusCode}`);
        }
    },
    {urls: ['<all_urls>']},
    ['responseHeaders']
);

// Listen for messages from the popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getCount') {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                const tabId = tabs[0].id;
                sendResponse({count: tabRequestCounts[tabId] || 0});
            }
        });
        return true; // Indicates we will send a response asynchronously
    }
});

// Periodic check to ensure badge is up-to-date
setInterval(() => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
            updateBadge(tabs[0].id);
        }
    });
}, 5000); // Check every 5 seconds