// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getCount') {
        // Request the current count from the background script
        chrome.runtime.sendMessage({action: 'getCount'});
    }
});

// Listen for count updates from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateCount') {
        // Forward the updated count to the popup
        chrome.runtime.sendMessage({action: 'updateCount', count: message.count});
    }
});