// Object to store request counts for each tab
const tabRequestCounts = {};

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // Initialize the count for the tab if it doesn't exist
        if (!tabRequestCounts[tabId]) {
            tabRequestCounts[tabId] = 0;
        }
        updateBadge(tabId);
    }
});

// Listen for tab removals
chrome.tabs.onRemoved.addListener((tabId) => {
    // Remove the count for the closed tab
    delete tabRequestCounts[tabId];
});

// Listen for web requests
chrome.webRequest.onCompleted.addListener(
    (details) => {
        if (details.tabId !== -1 && details.type === 'main_frame') {
            // Reset count for main frame requests (new page loads)
            tabRequestCounts[details.tabId] = 0;
        }
        if (details.tabId !== -1) {
            // Increment the count for successful requests
            tabRequestCounts[details.tabId] = (tabRequestCounts[details.tabId] || 0) + 1;
            updateBadge(details.tabId);

            // Send updated count to content script
            chrome.tabs.sendMessage(details.tabId, {
                action: 'updateCount',
                count: tabRequestCounts[details.tabId]
            });
        }
    },
    {urls: ['<all_urls>']},
    ['responseHeaders']
);

// Function to update the badge text
function updateBadge(tabId) {
    const count = tabRequestCounts[tabId] || 0;
    chrome.action.setBadgeText({text: count.toString(), tabId: tabId});
    chrome.action.setBadgeBackgroundColor({color: '#53c458', tabId: tabId});
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getCount') {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tabId = tabs[0].id;
            sendResponse({count: tabRequestCounts[tabId] || 0});
        });
        return true; // Indicates we will send a response asynchronously
    }
});