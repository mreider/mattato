// Mattato TimeCockpit Bridge - Background Service Worker
console.log('Mattato TimeCockpit Bridge background script loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener(function(details) {
    console.log('Extension installed:', details.reason);
    
    if (details.reason === 'install') {
        // Set default settings
        chrome.storage.sync.set({
            'mattato_bridge_enabled': true,
            'install_date': Date.now()
        });
    }
});

// Handle tab updates to detect TimeCockpit pages
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('timecockpit.com')) {
        console.log('TimeCockpit page detected:', tab.url);
        
        // Update extension badge
        chrome.action.setBadgeText({
            text: '✓',
            tabId: tabId
        });
        chrome.action.setBadgeBackgroundColor({
            color: '#28a745',
            tabId: tabId
        });
    } else if (changeInfo.status === 'complete') {
        // Clear badge on non-TimeCockpit pages
        chrome.action.setBadgeText({
            text: '',
            tabId: tabId
        });
    }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Background received message:', request);
    
    if (request.action === 'log') {
        console.log('Content script log:', request.message);
    }
    
    return true;
});