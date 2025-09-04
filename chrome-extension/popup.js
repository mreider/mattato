document.addEventListener('DOMContentLoaded', function() {
    const statusElement = document.getElementById('status');
    const showWindowButton = document.getElementById('showWindowButton');
    const infoButton = document.getElementById('infoButton');

    // Check if we're on TimeCockpit
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        if (currentTab.url && currentTab.url.includes('timecockpit.com')) {
            statusElement.textContent = 'Connected to TimeCockpit - Ready for integration';
            statusElement.className = 'status ready';
            showWindowButton.disabled = false;
        } else {
            statusElement.textContent = 'Not on TimeCockpit page. Navigate to TimeCockpit first.';
            statusElement.className = 'status error';
            showWindowButton.disabled = true;
        }
    });

    showWindowButton.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'showWindow'}, function(response) {
                if (response && response.success) {
                    statusElement.textContent = 'Import window shown on page';
                    statusElement.className = 'status ready';
                    window.close(); // Close popup after showing window
                } else {
                    statusElement.textContent = 'Failed to show window: ' + (response ? response.error : 'No response');
                    statusElement.className = 'status error';
                }
            });
        });
    });

    infoButton.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'getPageInfo'}, function(response) {
                if (response) {
                    statusElement.textContent = 'Page: ' + response.title + ' | URL: ' + response.url.substring(0, 50) + '...';
                    statusElement.className = 'status ready';
                }
            });
        });
    });
});