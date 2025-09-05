// Mattato TimeCockpit Bridge - Content Script
console.log('Mattato TimeCockpit Bridge loaded');

let floatingWindow = null;
let currentWeek = null;
let isWindowDragging = false;
let dragOffset = { x: 0, y: 0 };
let loadedJSON = null;
let overlay = null;
let debugConsole = null;
let isImportCancelled = false;

// Set up message listener immediately (don't wait)
console.log('MATTATO DEBUG: Setting up message listener immediately');

// Listen for messages from popup IMMEDIATELY - don't wait for initialization
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('MATTATO DEBUG: Received message:', request);
    
    if (request.action === 'showWindow') {
        try {
            console.log('MATTATO DEBUG: Show window message received');
            
            // Check if we're on the correct TimeCockpit Time Sheets page
            const currentUrl = window.location.href;
            
            if (!currentUrl.includes('app/lists/USR_TimesheetList')) {
                console.log('MATTATO DEBUG: Not on Time Sheets page, extension not available');
                sendResponse({
                    success: false,
                    error: 'Extension only available on Time Sheets page'
                });
                return true;
            }
            
            // Initialize extension if not already done
            if (!floatingWindow) {
                console.log('MATTATO DEBUG: Floating window not found, initializing extension');
                initializeExtension();
            }
            
            // Show the floating window
            if (floatingWindow) {
                console.log('MATTATO DEBUG: Showing floating window');
                floatingWindow.style.display = 'block';
                updateWeekDisplay();
                sendResponse({
                    success: true,
                    message: 'Import window shown'
                });
            } else {
                console.log('MATTATO DEBUG: Failed to create floating window');
                sendResponse({
                    success: false,
                    error: 'Failed to create floating window'
                });
            }
        } catch (error) {
            console.error('MATTATO DEBUG: Error showing window:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
        return true; // Keep message channel open for async response
    }
    
    if (request.action === 'getPageInfo') {
        sendResponse({
            title: document.title,
            url: window.location.href
        });
        return true;
    }
});

// Initialize when page loads - use a delay to avoid interfering with page load
setTimeout(() => {
    try {
        console.log('MATTATO DEBUG: Delayed initialization starting');
        if (window.location.href.includes('timecockpit.com')) {
            // Only show extension on timesheet calendar pages
            if (window.location.href.includes('/app/timesheetcalendar/')) {
                console.log('MATTATO DEBUG: On TimeCockpit timesheet calendar page, initializing extension');
                initializeExtension();
            } else {
                console.log('MATTATO DEBUG: Not on timesheet calendar page, extension will not be shown');
            }
        } else {
            console.log('MATTATO DEBUG: Not on TimeCockpit page, skipping initialization');
        }
    } catch (error) {
        console.warn('Mattato extension initialization failed:', error);
    }
}, 3000); // Wait 3 seconds after page load

// Overlay management functions
function showOverlay() {
    if (overlay) {
        overlay.remove();
    }
    
    overlay = document.createElement('div');
    overlay.id = 'mattato-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(3px);
        z-index: 2147483646;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        pointer-events: all;
    `;
    
    overlay.innerHTML = `
        <div style="
            background: #1e1e1e;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            width: 500px;
            max-width: 90vw;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            border: 1px solid #333;
        ">
            <div style="
                padding: 15px 20px;
                border-bottom: 1px solid #333;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: #2d2d2d;
                border-radius: 12px 12px 0 0;
            ">
                <div style="
                    display: flex;
                    align-items: center;
                    color: white;
                    font-weight: 600;
                    gap: 10px;
                ">
                    <div style="
                        width: 20px;
                        height: 20px;
                        border: 2px solid #ffffff40;
                        border-top: 2px solid #4CAF50;
                        border-radius: 50%;
                        animation: mattato-spin 1s linear infinite;
                    "></div>
                    🤖 Mattato Import Console
                </div>
                <button onclick="window.mattatoCancelImport()" style="
                    background: #ff4444;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                ">Cancel</button>
            </div>
            <div id="mattato-debug-console" style="
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                max-height: 400px;
                background: #1e1e1e;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 12px;
                line-height: 1.4;
                color: #e0e0e0;
                border-radius: 0 0 12px 12px;
            ">
                <div style="color: #4CAF50;">🚀 Starting import process...</div>
            </div>
        </div>
        <style>
            @keyframes mattato-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            #mattato-debug-console::-webkit-scrollbar {
                width: 8px;
            }
            #mattato-debug-console::-webkit-scrollbar-track {
                background: #2d2d2d;
                border-radius: 4px;
            }
            #mattato-debug-console::-webkit-scrollbar-thumb {
                background: #555;
                border-radius: 4px;
            }
            #mattato-debug-console::-webkit-scrollbar-thumb:hover {
                background: #777;
            }
        </style>
    `;
    
    // Store reference to debug console
    debugConsole = null;
    setTimeout(() => {
        debugConsole = document.getElementById('mattato-debug-console');
    }, 100);
    
    // Add cancel function to window
    window.mattatoCancelImport = function() {
        isImportCancelled = true;
        logToConsole('❌ Import cancelled by user', '#ff4444');
        hideOverlay();
    };
    
    document.body.appendChild(overlay);
    console.log('MATTATO DEBUG: Debug console overlay shown');
}

function hideOverlay() {
    if (overlay) {
        overlay.remove();
        overlay = null;
        debugConsole = null;
        console.log('MATTATO DEBUG: Overlay hidden');
    }
}

function logToConsole(message, color = '#e0e0e0') {
    console.log('MATTATO DEBUG:', message);
    if (debugConsole) {
        const logEntry = document.createElement('div');
        logEntry.style.color = color;
        logEntry.style.marginBottom = '4px';
        logEntry.innerHTML = `<span style="color: #888;">${new Date().toLocaleTimeString()}</span> ${message}`;
        debugConsole.appendChild(logEntry);
        
        // Auto-scroll to bottom
        debugConsole.scrollTop = debugConsole.scrollHeight;
    }
}

function initializeExtension() {
    try {
        createFloatingWindow();
        updateWeekDisplay();
        
        // Use less aggressive monitoring - only check when URL changes
        let lastUrl = window.location.href;
        setInterval(() => {
            try {
                if (window.location.href !== lastUrl) {
                    lastUrl = window.location.href;
                    
                    // Hide extension if not on timesheet calendar page
                    if (!window.location.href.includes('/app/timesheetcalendar/')) {
                        if (floatingWindow) {
                            floatingWindow.style.display = 'none';
                        }
                        console.log('MATTATO DEBUG: Not on timesheet calendar page, hiding extension');
                    } else {
                        if (floatingWindow) {
                            floatingWindow.style.display = 'block';
                        }
                        console.log('MATTATO DEBUG: Back on timesheet calendar page, showing extension');
                        updateWeekDisplay();
                    }
                }
            } catch (error) {
                console.warn('Mattato extension update failed:', error);
            }
        }, 5000); // Check every 5 seconds
    } catch (error) {
        console.error('Failed to initialize Mattato extension:', error);
    }
}

function createFloatingWindow() {
    // Remove existing window if present
    if (floatingWindow) {
        floatingWindow.remove();
    }
    
    floatingWindow = document.createElement('div');
    floatingWindow.id = 'mattato-floating-window';
    floatingWindow.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        width: 260px;
        background: white;
        border: 2px solid #007bff;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        cursor: move;
        display: none;
        pointer-events: auto;
    `;
    
    floatingWindow.innerHTML = `
        <div id="mattato-window-header" style="
            background: #007bff;
            color: white;
            padding: 8px 12px;
            border-radius: 6px 6px 0 0;
            font-weight: 600;
            display: flex;
            align-items: center;
            cursor: move;
        ">
            🤖 Mattato Import
            <span id="mattato-reload-btn" style="
                margin-left: auto;
                cursor: pointer;
                font-size: 12px;
                padding: 4px 8px;
                border-radius: 3px;
                background: rgba(255, 255, 255, 0.2);
                font-weight: 600;
                margin-right: 8px;
            ">↻ Reload</span>
            <span id="mattato-close-btn" style="
                cursor: pointer;
                font-size: 16px;
                padding: 2px 6px;
                border-radius: 3px;
                background: rgba(255, 255, 255, 0.2);
                font-weight: 600;
                line-height: 1;
            ">&times;</span>
        </div>
        <div id="mattato-window-content" style="padding: 12px;">
            <div id="mattato-week-display" style="
                background: #f8f9fa;
                padding: 8px;
                border-radius: 4px;
                margin-bottom: 12px;
                text-align: center;
                font-weight: 600;
                color: #495057;
            ">
                Ready to import Mattato sessions...
            </div>
            <div id="mattato-import-section">
                <button id="mattato-import-btn" style="
                    width: 100%;
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                ">Import JSON</button>
            </div>
            <div id="mattato-status" style="
                margin-top: 10px;
                padding: 8px;
                border-radius: 4px;
                font-size: 12px;
                display: none;
            "></div>
            <input type="file" id="mattato-file-input" accept=".json" style="display: none;">
        </div>
    `;
    
    document.body.appendChild(floatingWindow);
    setupWindowEvents();
}

function setupWindowEvents() {
    const header = floatingWindow.querySelector('#mattato-window-header');
    const reloadBtn = floatingWindow.querySelector('#mattato-reload-btn');
    const closeBtn = floatingWindow.querySelector('#mattato-close-btn');
    const importBtn = floatingWindow.querySelector('#mattato-import-btn');
    const fileInput = floatingWindow.querySelector('#mattato-file-input');
    
    // Reload button
    reloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        updateWeekDisplay();
        showStatus('Import window reloaded', 'success');
    });
    
    // Close button
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        hideOverlay();
        floatingWindow.style.display = 'none';
        console.log('MATTATO DEBUG: Extension window closed');
    });
    
    // Import button
    importBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        fileInput.click();
    });
    
    // File input
    fileInput.addEventListener('change', handleFileImport);
    
    // Dragging functionality - only attach to our window
    header.addEventListener('mousedown', startDrag);
    
    // Prevent the floating window from interfering with page events
    floatingWindow.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    floatingWindow.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });
}

function startDrag(e) {
    if (e.target.id === 'mattato-reload-btn') return;
    
    isWindowDragging = true;
    const rect = floatingWindow.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    floatingWindow.style.cursor = 'grabbing';
    
    // Add global listeners only when dragging
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    e.preventDefault();
    e.stopPropagation();
}

function drag(e) {
    if (!isWindowDragging) return;
    
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    
    // Keep window within viewport
    const maxX = window.innerWidth - floatingWindow.offsetWidth;
    const maxY = window.innerHeight - floatingWindow.offsetHeight;
    
    floatingWindow.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    floatingWindow.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    floatingWindow.style.right = 'auto'; // Remove right positioning
    
    e.preventDefault();
}

function stopDrag(e) {
    isWindowDragging = false;
    floatingWindow.style.cursor = 'move';
    
    // Remove global listeners when not dragging
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
    
    if (e) {
        e.preventDefault();
    }
}

function updateWeekDisplay() {
    ensureFloatingWindow();
    if (!floatingWindow) return;
    
    const weekDisplay = floatingWindow.querySelector('#mattato-week-display');
    
    // Always show the import window (no longer restricted to calendar pages)
    floatingWindow.style.display = 'block';
    weekDisplay.textContent = 'Mattato TimeCockpit Import';
    weekDisplay.style.background = '#d4edda';
    weekDisplay.style.color = '#155724';
}


function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            validateAndProcessJSON(jsonData);
        } catch (error) {
            showStatus('Invalid JSON file format', 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

function validateAndProcessJSON(jsonData) {
    const status = floatingWindow.querySelector('#mattato-status');
    
    // Check if it's a Mattato export format
    if (!jsonData.exported_at || !jsonData.export_title || (!jsonData.sessions && !jsonData.grouped_sessions)) {
        showStatus('This is not a valid Mattato JSON export format', 'error');
        return;
    }
    
    // Get sessions from either flat or grouped format
    let sessions = [];
    if (jsonData.sessions) {
        sessions = jsonData.sessions;
    } else if (jsonData.grouped_sessions) {
        // Flatten grouped sessions
        sessions = flattenGroupedSessions(jsonData.grouped_sessions);
    }
    
    if (sessions.length === 0) {
        showStatus('No sessions found in JSON file', 'error');
        return;
    }
    
    // Store loaded JSON and show confirmation (import all sessions regardless of date)
    loadedJSON = {
        originalData: jsonData,
        sessions: sessions,
        weekSessions: sessions  // Use all sessions instead of filtered ones
    };
    
    showImportConfirmation(sessions.length);
}

function flattenGroupedSessions(groupedSessions) {
    const sessions = [];
    
    function addSessions(obj) {
        if (Array.isArray(obj)) {
            sessions.push(...obj);
        } else if (typeof obj === 'object') {
            Object.values(obj).forEach(addSessions);
        }
    }
    
    addSessions(groupedSessions);
    return sessions;
}


function showImportConfirmation(sessionCount) {
    const content = floatingWindow.querySelector('#mattato-window-content');
    
    content.innerHTML = `
        <div style="text-align: center; padding: 10px;">
            <div style="
                background: #d4edda;
                color: #155724;
                padding: 10px;
                border-radius: 4px;
                margin-bottom: 15px;
                font-weight: 600;
            ">
                JSON Loaded Successfully!
            </div>
            <div style="margin-bottom: 15px;">
                <strong>${sessionCount}</strong> session(s) found<br>
                Ready to import into TimeCockpit
            </div>
            <div style="margin-bottom: 20px; font-size: 13px; color: #666;">
                Ready to import these sessions into TimeCockpit?
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="mattato-confirm-import" style="
                    flex: 1;
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                ">Yes, Import</button>
                <button id="mattato-cancel-import" style="
                    flex: 1;
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                ">Cancel</button>
            </div>
        </div>
    `;
    
    // Setup confirmation buttons
    content.querySelector('#mattato-confirm-import').addEventListener('click', (event) => {
        console.log('MATTATO DEBUG: Import confirmation clicked - starting direct import immediately');
        
        // Skip the button choice UI and go straight to direct import
        tryDirectImport();
        
        function tryDirectImport() {
            console.log('MATTATO DEBUG: tryDirectImport function called');
            
            // Simple approach: try to create timesheet entries directly via the data service
            try {
                showOverlay(); // Show debug console
                showStatus('🚀 Creating timesheet entries...', 'info');
                
                // Get the sessions to import
                const sessions = loadedJSON.weekSessions;
                console.log('MATTATO DEBUG: Sessions to import:', sessions);
                
                if (!sessions || sessions.length === 0) {
                    throw new Error('No sessions to import');
                }
                
                // Try the simplest approach: direct data context service
                createTimesheetEntriesDirectly(sessions);
                
            } catch (error) {
                console.error('MATTATO DEBUG: Direct import failed:', error);
                showStatus('❌ Import failed: ' + error.message, 'error');
                hideOverlay();
            }
        }
        
        async function createTimesheetEntriesDirectly(sessions) {
            console.log('MATTATO DEBUG: Creating timesheet entries using DOM manipulation');
            
            try {
                const success = await createTimesheetsViaDOMManipulation(sessions);
                if (!success) {
                    showStatus('❌ DOM manipulation failed', 'error');
                }
            } catch (error) {
                console.error('MATTATO DEBUG: Error in timesheet creation:', error);
                showStatus('❌ Creation failed: ' + error.message, 'error');
                hideOverlay();
            }
        }
        
        async function createTimesheetsViaDOMManipulation(sessions) {
            console.log('MATTATO DEBUG: Starting DOM manipulation approach');
            showStatus('🚀 Creating timesheet entries via form manipulation...', 'info');
            
            let createdCount = 0;
            const totalSessions = sessions.length;
            
            for (const session of sessions) {
                // Check if import was cancelled
                if (isImportCancelled) {
                    logToConsole('🛑 Import cancelled, stopping process', '#ff4444');
                    break;
                }
                
                const sessionNum = createdCount + 1;
                logToConsole(`📝 Processing session ${sessionNum}/${totalSessions}: "${session.description}"`, '#4CAF50');
                console.log(`MATTATO DEBUG: Processing session ${sessionNum}/${totalSessions}:`, session.description);
                
                try {
                    // Step 1: Open timesheet entry modal
                    logToConsole('🔘 Opening timesheet modal...', '#87CEEB');
                    const modalOpened = await openTimesheetModal();
                    if (!modalOpened) {
                        logToConsole('❌ Could not open timesheet modal', '#ff4444');
                        console.error('MATTATO DEBUG: Could not open timesheet modal');
                        continue;
                    }
                    
                    // Step 2: Search for ticket using Search Tickets feature
                    logToConsole(`🔍 Searching for ticket: "${session.project || session.description}"`, '#87CEEB');
                    const ticketFound = await searchAndSelectTicket(session);
                    if (!ticketFound) {
                        logToConsole(`⚠️ No ticket found for "${session.description}"`, '#FFA500');
                        showStatus(`⚠️ No ticket found for "${session.description}"`, 'warning');
                        // Close modal and continue to next session
                        await closeCurrentModal();
                        continue;
                    }
                    logToConsole('✅ Ticket found and selected', '#4CAF50');
                    
                    // Step 3: Fill date and time fields (we're back in timesheet modal)
                    logToConsole('📅 Filling date and time fields...', '#87CEEB');
                    const formFilled = await fillDateAndTimeFields(session);
                    if (!formFilled) {
                        logToConsole(`❌ Could not fill date/time fields for: ${session.description}`, '#ff4444');
                        console.error('MATTATO DEBUG: Could not fill date/time fields for:', session.description);
                        await closeCurrentModal();
                        continue;
                    }
                    logToConsole('✅ Date and time fields filled', '#4CAF50');
                    
                    // Step 4: Save the timesheet entry
                    logToConsole('💾 Saving timesheet entry...', '#87CEEB');
                    const formSubmitted = await submitTimesheetForm();
                    if (formSubmitted) {
                        createdCount++;
                        logToConsole(`✅ Entry saved successfully! (${createdCount}/${totalSessions})`, '#4CAF50');
                        showStatus(`✅ Created ${createdCount}/${totalSessions} entries...`, 'success');
                    } else {
                        logToConsole(`❌ Failed to save "${session.description}"`, '#ff4444');
                        showStatus(`⚠️ Failed to submit "${session.description}"`, 'warning');
                        await closeCurrentModal();
                    }
                    
                    // Short delay between entries to avoid overwhelming TimeCockpit
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (sessionError) {
                    console.error('MATTATO DEBUG: Session processing failed:', session.description, sessionError);
                    showStatus(`❌ Failed "${session.description}": ${sessionError.message}`, 'error');
                }
            }
            
            if (createdCount > 0) {
                showStatus(`🎉 Successfully created ${createdCount} timesheet entries!`, 'success');
                
                // Hide overlay after success
                setTimeout(() => {
                    hideOverlay();
                }, 2000);
                
                return true;
            } else {
                showStatus('❌ No timesheet entries were created', 'error');
                return false;
            }
        }
        
        async function openTimesheetModal() {
            console.log('MATTATO DEBUG: Looking for + Add button to open timesheet modal');
            
            // First check if a timesheet modal is already open
            const existingTimesheetLinks = document.querySelectorAll('.k-tabstrip-items .k-link');
            const existingModal = Array.from(existingTimesheetLinks).find(link => 
                link.textContent.includes('Time Sheet')
            ) || document.querySelector('span[ng-bind="\'Time Sheet\'"]');
            
            if (existingModal) {
                console.log('MATTATO DEBUG: Timesheet modal already open, reusing it');
                return true;
            }
            
            // Look for the + Add button on timesheet calendar page
            const addButton = document.querySelector('button.k-button.k-icon-button[title*="Add a new timesheet entry"]') ||
                             document.querySelector('button.cofx-list-add.k-button[title*="Add a new item"]');
            
            if (addButton) {
                console.log('MATTATO DEBUG: Found + Add button:', addButton);
                addButton.click();
                
                // Wait for timesheet modal to appear
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Check if timesheet modal appeared (look for Time Sheet tab)
                const timesheetLinks = document.querySelectorAll('.k-tabstrip-items .k-link');
                const timesheetModal = Array.from(timesheetLinks).find(link => 
                    link.textContent.includes('Time Sheet')
                ) || document.querySelector('span[ng-bind="\'Time Sheet\'"]');
                if (timesheetModal) {
                    console.log('MATTATO DEBUG: Timesheet modal opened successfully');
                    return true;
                }
            }
            
            console.log('MATTATO DEBUG: Could not find or click + Add button');
            return false;
        }
        
        async function searchAndSelectTicket(session) {
            console.log('MATTATO DEBUG: Looking for Search tickets button');
            
            // Find the specific Search tickets button
            const searchButton = document.querySelector('button.cofx-action-button[ng-show="\'Search tickets\'"]');
            
            if (!searchButton) {
                console.log('MATTATO DEBUG: Search tickets button not found');
                return false;
            }
            
            console.log('MATTATO DEBUG: Found Search tickets button:', searchButton);
            searchButton.click();
            
            // Wait for search modal to appear
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Find the CODE input field with exact selector
            const codeField = document.querySelector('input[name="USR_Code"]') || 
                             document.querySelector('input.k-textbox[ng-model*="USR_Code"]');
            
            if (!codeField) {
                console.log('MATTATO DEBUG: USR_Code input field not found');
                return false;
            }
            
            console.log('MATTATO DEBUG: Found USR_Code field:', codeField);
            
            // Enter search term (try project name, then description)
            const searchTerm = session.project || session.description || 'Imported from Mattato';
            codeField.focus();
            codeField.value = searchTerm;
            codeField.dispatchEvent(new Event('input', { bubbles: true }));
            codeField.dispatchEvent(new Event('change', { bubbles: true }));
            codeField.dispatchEvent(new Event('blur', { bubbles: true }));
            console.log('MATTATO DEBUG: Entered search term in CODE field:', searchTerm);
            
            // Wait a moment for any validation
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Find and click "Execute action" button
            const executeButtons = document.querySelectorAll('button.k-button-solid-primary, button[ng-click*="execute"], button.k-button');
            const executeButton = Array.from(executeButtons).find(btn => 
                btn.textContent.includes('Execute action')
            );
            
            if (!executeButton) {
                console.log('MATTATO DEBUG: Execute action button not found');
                return false;
            }
            
            console.log('MATTATO DEBUG: Found Execute action button:', executeButton);
            executeButton.click();
            
            // Wait for results
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check for "not found" dialog
            const notFoundDialog = document.querySelector('.k-dialog .message-service-description');
            if (notFoundDialog && notFoundDialog.textContent.includes('was not found')) {
                console.log('MATTATO DEBUG: Ticket not found for:', searchTerm);
                console.log('MATTATO DEBUG: Error message:', notFoundDialog.textContent);
                
                // Close the error dialog
                const okButtons = document.querySelectorAll('.k-dialog-actions button');
                const okButton = Array.from(okButtons).find(btn => btn.textContent.includes('Ok'));
                if (okButton) {
                    okButton.click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                return false;
            }
            
            // If no error dialog, ticket should be found and we're back in timesheet modal
            console.log('MATTATO DEBUG: Ticket search successful, back in timesheet modal');
            return true;
        }
        
        async function fillDateAndTimeFields(session) {
            console.log('MATTATO DEBUG: Filling date and time fields for session:', session.description);
            console.log('MATTATO DEBUG: Session JSON data:', session);
            
            const startDate = new Date(session.start_time);
            const endTime = session.end_time ? 
                new Date(session.end_time) : 
                new Date(startDate.getTime() + (25 * 60 * 1000));
            
            console.log('MATTATO DEBUG: Calculated times:');
            console.log('MATTATO DEBUG: - Start time raw:', session.start_time);
            console.log('MATTATO DEBUG: - Start time object:', startDate);
            console.log('MATTATO DEBUG: - Start time ISO:', startDate.toISOString());
            console.log('MATTATO DEBUG: - Start time local:', startDate.toLocaleString());
            console.log('MATTATO DEBUG: - End time raw:', session.end_time);
            console.log('MATTATO DEBUG: - End time object:', endTime);
            console.log('MATTATO DEBUG: - End time ISO:', endTime.toISOString());
            console.log('MATTATO DEBUG: - End time local:', endTime.toLocaleString());
            
            try {
                // First fill description field
                const descriptionField = document.querySelector('textarea[name="APP_Description"]');
                if (descriptionField) {
                    console.log('MATTATO DEBUG: Before filling description - current value:', descriptionField.value);
                    descriptionField.focus();
                    descriptionField.value = session.description || 'Imported from Mattato';
                    descriptionField.dispatchEvent(new Event('input', { bubbles: true }));
                    descriptionField.dispatchEvent(new Event('change', { bubbles: true }));
                    descriptionField.dispatchEvent(new Event('blur', { bubbles: true }));
                    console.log('MATTATO DEBUG: After filling description - new value:', descriptionField.value);
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                
                // Fill date fields - handle both single and dual date picker scenarios
                await fillDateFields(startDate, endTime);
                
                // Fill start time - find the first timepicker input (improved selectors for calendar page)
                const allTimeFields = document.querySelectorAll('kendo-timepicker input.k-input-inner');
                console.log(`MATTATO DEBUG: Found ${allTimeFields.length} time picker fields`);
                
                // Log all time fields for debugging
                for (let i = 0; i < allTimeFields.length; i++) {
                    console.log(`MATTATO DEBUG: Time field ${i}:`, allTimeFields[i], `ID: ${allTimeFields[i].id}`);
                }
                
                const startTimeField = allTimeFields[0];
                if (startTimeField) {
                    console.log(`MATTATO DEBUG: About to fill START TIME field ${startTimeField.id} with:`, startDate.toLocaleString());
                    await fillTimeCockpitTimeField(startTimeField, startDate, 'start');
                } else {
                    console.log('MATTATO DEBUG: Start time field not found');
                }
                
                // Fill end time - use the second timepicker input
                const endTimeField = allTimeFields[1];
                if (endTimeField) {
                    console.log(`MATTATO DEBUG: About to fill END TIME field ${endTimeField.id} with:`, endTime.toLocaleString());
                    await fillTimeCockpitTimeField(endTimeField, endTime, 'end');
                } else {
                    console.log('MATTATO DEBUG: End time field not found');
                }
                
                // Small delay to let validations process
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                console.log('MATTATO DEBUG: All fields filled successfully');
                return true;
                
            } catch (error) {
                console.error('MATTATO DEBUG: Error filling date/time fields:', error);
                return false;
            }
        }
        
        async function fillDateFields(startDate, endDate) {
            console.log('MATTATO DEBUG: Filling date fields');
            console.log('MATTATO DEBUG: Start date:', startDate);
            console.log('MATTATO DEBUG: End date:', endDate);
            
            // Find all date input fields (placeholder="m/d/yyyy")
            const allDateFields = document.querySelectorAll('input[placeholder="m/d/yyyy"]');
            console.log(`MATTATO DEBUG: Found ${allDateFields.length} date picker fields total`);
            
            if (allDateFields.length === 0) {
                console.log('MATTATO DEBUG: No date fields found');
                return;
            }
            
            // Debug: Log all date fields with detailed visibility analysis + visual position
            for (let i = 0; i < allDateFields.length; i++) {
                const field = allDateFields[i];
                const isVisible = field.offsetParent !== null && field.offsetWidth > 0 && field.offsetHeight > 0;
                const computedStyle = window.getComputedStyle(field);
                const isDisplayed = computedStyle.display !== 'none';
                const isOpaque = computedStyle.visibility !== 'hidden' && computedStyle.opacity !== '0';
                
                // Get visual position and size info
                const rect = field.getBoundingClientRect();
                const isInViewport = rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
                const hasVisualPresence = rect.width > 0 && rect.height > 0;
                
                // Get parent container info
                const kendoTextBox = field.closest('kendo-textbox');
                const datePickerContainer = field.closest('.date-picker-container');
                const cofxDatePicker = field.closest('cofx-date-picker');
                
                // Check if parent containers are visible
                const kendoTextBoxVisible = kendoTextBox ? (kendoTextBox.offsetParent !== null) : 'N/A';
                const containerVisible = datePickerContainer ? (datePickerContainer.offsetParent !== null) : 'N/A';
                const cofxVisible = cofxDatePicker ? (cofxDatePicker.offsetParent !== null) : 'N/A';
                
                // Check what value is actually displayed to the user
                const displayedValue = field.value || field.getAttribute('value') || field.placeholder || 'EMPTY';
                
                console.log(`MATTATO DEBUG: === DATE FIELD ${i} DETAILED ANALYSIS ===`);
                console.log(`MATTATO DEBUG: - Field:`, field);
                console.log(`MATTATO DEBUG: - Current displayed value: "${displayedValue}"`);
                console.log(`MATTATO DEBUG: - ID: ${field.id}`);
                console.log(`MATTATO DEBUG: - Position: top=${rect.top}, left=${rect.left}, width=${rect.width}, height=${rect.height}`);
                console.log(`MATTATO DEBUG: - Field visible (offset): ${isVisible}`);
                console.log(`MATTATO DEBUG: - Field displayed (CSS): ${isDisplayed}`);
                console.log(`MATTATO DEBUG: - Field opaque: ${isOpaque}`);
                console.log(`MATTATO DEBUG: - In viewport: ${isInViewport}`);
                console.log(`MATTATO DEBUG: - Has visual size: ${hasVisualPresence}`);
                console.log(`MATTATO DEBUG: - KendoTextBox visible: ${kendoTextBoxVisible}`);
                console.log(`MATTATO DEBUG: - Container visible: ${containerVisible}`);
                console.log(`MATTATO DEBUG: - CofxDatePicker visible: ${cofxVisible}`);
                console.log(`MATTATO DEBUG: - SHOULD BE VISIBLE TO USER: ${isVisible && isDisplayed && isOpaque && hasVisualPresence && isInViewport}`);
                
                // Skip visual highlighting since dates are working
            }
            
            // Enhanced filtering for truly visible date fields (the ones user can actually see)
            const visibleDateFields = Array.from(allDateFields).filter(field => {
                // Basic visibility check
                const basicVisible = field.offsetParent !== null && field.offsetWidth > 0 && field.offsetHeight > 0;
                
                // Visual position check
                const rect = field.getBoundingClientRect();
                const isInViewport = rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
                const hasVisualPresence = rect.width > 0 && rect.height > 0;
                
                // CSS visibility check
                const computedStyle = window.getComputedStyle(field);
                const isDisplayed = computedStyle.display !== 'none';
                const isOpaque = computedStyle.visibility !== 'hidden' && computedStyle.opacity !== '0';
                
                // Check parent containers are also visible
                const kendoTextBox = field.closest('kendo-textbox');
                const kendoVisible = kendoTextBox ? (kendoTextBox.offsetParent !== null) : true;
                
                const cofxDatePicker = field.closest('cofx-date-picker');
                const cofxVisible = cofxDatePicker ? (cofxDatePicker.offsetParent !== null) : true;
                
                const fullyVisible = basicVisible && kendoVisible && cofxVisible && isDisplayed && isOpaque && hasVisualPresence && isInViewport;
                
                console.log(`MATTATO DEBUG: Field ${field.id} final visibility check: basic=${basicVisible}, kendo=${kendoVisible}, cofx=${cofxVisible}, displayed=${isDisplayed}, opaque=${isOpaque}, hasSize=${hasVisualPresence}, inViewport=${isInViewport} => RESULT=${fullyVisible}`);
                return fullyVisible;
            });
            
            console.log(`MATTATO DEBUG: Found ${visibleDateFields.length} VISIBLE date picker fields`);
            
            // Use visible fields if we found any, otherwise use all fields
            const fieldsToUse = visibleDateFields.length > 0 ? visibleDateFields : Array.from(allDateFields);
            console.log(`MATTATO DEBUG: Using ${fieldsToUse.length} date fields for filling`);
            
            if (fieldsToUse.length === 0) {
                console.log('MATTATO DEBUG: No usable date fields found');
                return;
            }
            
            // Function to format date in M/D/YYYY format (Kendo-compatible)
            function formatDateForTimeCockpit(date) {
                const month = date.getMonth() + 1;
                const day = date.getDate();
                const year = date.getFullYear();
                
                // Ensure we have a valid date
                if (isNaN(month) || isNaN(day) || isNaN(year)) {
                    console.log('MATTATO DEBUG: Invalid date detected, using fallback');
                    return '9/3/2025'; // Fallback date
                }
                
                const formatted = `${month}/${day}/${year}`;
                console.log(`MATTATO DEBUG: Formatted date: ${date.toISOString()} -> ${formatted}`);
                return formatted;
            }
            
            // Function to fill a date field by typing directly (no Kendo API)
            async function fillSingleDateField(field, date, fieldName) {
                const dateString = formatDateForTimeCockpit(date);
                console.log(`MATTATO DEBUG: Typing directly into ${fieldName} with: ${dateString}`);
                console.log(`MATTATO DEBUG: Before typing ${fieldName} - current value:`, field.value);
                
                try {
                    // Focus the field
                    field.focus();
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Clear existing value by selecting all and deleting
                    field.select();
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    // Clear the field completely
                    field.value = '';
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Type each character of the date string
                    console.log(`MATTATO DEBUG: Typing characters: ${dateString}`);
                    for (let i = 0; i < dateString.length; i++) {
                        const char = dateString[i];
                        
                        // Create and dispatch a keydown event for the character
                        field.dispatchEvent(new KeyboardEvent('keydown', {
                            key: char,
                            code: `Digit${char}`,
                            charCode: char.charCodeAt(0),
                            keyCode: char.charCodeAt(0),
                            bubbles: true
                        }));
                        
                        // Update the field value character by character
                        field.value += char;
                        
                        // Dispatch input event after each character
                        field.dispatchEvent(new Event('input', { bubbles: true }));
                        
                        // Small delay between characters to simulate real typing
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                    
                    console.log(`MATTATO DEBUG: Finished typing, current value: ${field.value}`);
                    
                    // Final events to complete the input
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    field.dispatchEvent(new Event('blur', { bubbles: true }));
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    // Tab out to complete
                    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
                    await new Promise(resolve => setTimeout(resolve, 400));
                    
                } catch (error) {
                    console.log(`MATTATO DEBUG: Direct typing error for ${fieldName}:`, error);
                }
                
                console.log(`MATTATO DEBUG: After typing ${fieldName} - final value:`, field.value);
            }
            
            try {
                console.log(`MATTATO DEBUG: Found ${fieldsToUse.length} date fields to fill`);
                
                if (fieldsToUse.length === 1) {
                    // Single date picker (today's date scenario)
                    // Fill the single date field with start date
                    console.log('MATTATO DEBUG: Single date picker mode - filling with start date');
                    await fillSingleDateField(fieldsToUse[0], startDate, 'single date picker (start date)');
                    
                } else if (fieldsToUse.length >= 2) {
                    // Multiple date pickers - Since we're starting from past date on calendar page,
                    // we should have two date pickers already visible (easier workflow)
                    console.log('MATTATO DEBUG: Two date pickers detected - using normal workflow');
                    console.log('MATTATO DEBUG: First field = start date, Second field = end date');
                    
                    // For most Pomodoro sessions, both start and end are on the same day
                    // So both date fields should get the same date (the session date)
                    const sessionDate = startDate; // Use start date for both fields for same-day sessions
                    const endDateForField = endTime; // This is the actual end timestamp
                    
                    // Check if session spans multiple days
                    const startDay = startDate.toDateString();
                    const endDay = endDateForField.toDateString();
                    const isMultiDay = startDay !== endDay;
                    
                    console.log(`MATTATO DEBUG: Session spans multiple days: ${isMultiDay}`);
                    console.log(`MATTATO DEBUG: Start day: ${startDay}, End day: ${endDay}`);
                    
                    // Fill the FIRST field with start date
                    await fillSingleDateField(fieldsToUse[0], startDate, 'FIRST field (start date)');
                    
                    // Wait between date field fills
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Fill the SECOND field with end date (same as start date for same-day sessions)
                    const dateForSecondField = isMultiDay ? endDateForField : startDate;
                    await fillSingleDateField(fieldsToUse[1], dateForSecondField, 'SECOND field (end date)');
                    
                } else {
                    console.log('MATTATO DEBUG: No date fields available to fill');
                }
                
                console.log('MATTATO DEBUG: Date fields filling completed');
                
            } catch (error) {
                console.error('MATTATO DEBUG: Error filling date fields:', error);
            }
        }

        async function fillTimeCockpitTimeField(field, dateTime, fieldType) {
            console.log(`MATTATO DEBUG: Filling ${fieldType} time field using Kendo TimePicker API`);
            console.log(`MATTATO DEBUG: Raw ${fieldType} dateTime object:`, dateTime);
            console.log(`MATTATO DEBUG: Raw ${fieldType} dateTime ISO:`, dateTime.toISOString());
            console.log(`MATTATO DEBUG: Raw ${fieldType} dateTime local:`, dateTime.toLocaleString());
            
            const hours = dateTime.getHours();
            const minutes = dateTime.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            
            // Create the complete time string
            const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
            
            console.log(`MATTATO DEBUG: Before filling ${fieldType} time - current value:`, field.value);
            console.log(`MATTATO DEBUG: ${fieldType} time breakdown: hours=${hours}, minutes=${minutes}, displayHours=${displayHours}, ampm=${ampm}`);
            console.log(`MATTATO DEBUG: Time to enter:`, timeString);
            console.log(`MATTATO DEBUG: Timezone info - UTC: ${dateTime.toISOString()}, Local: ${dateTime.toLocaleString()}`);
            
            try {
                // Method 1: Try to access the Angular TimePicker component directly
                const timePickerContainer = field.closest('kendo-timepicker');
                if (!timePickerContainer) {
                    console.log(`MATTATO DEBUG: Could not find TimePicker container`);
                    throw new Error('TimePicker container not found');
                }
                
                console.log(`MATTATO DEBUG: Found TimePicker container, looking for Angular component`);
                
                // Try to access Angular component through various methods
                let timePickerComponent = null;
                
                // Method 1a: Check if there's an Angular component reference
                if (timePickerContainer.__ngContext__ || timePickerContainer._ngElementData) {
                    console.log(`MATTATO DEBUG: Found Angular context on TimePicker`);
                    // Try to get the component instance
                    const ngContext = timePickerContainer.__ngContext__ || timePickerContainer._ngElementData;
                    if (ngContext && ngContext[0] && ngContext[0].component) {
                        timePickerComponent = ngContext[0].component;
                        console.log(`MATTATO DEBUG: Found Angular component via context`);
                    }
                }
                
                // Method 1b: Try to find via global Angular debugging
                if (!timePickerComponent && window.ng) {
                    try {
                        const componentInstance = window.ng.getComponent(timePickerContainer);
                        if (componentInstance && componentInstance.timePicker) {
                            timePickerComponent = componentInstance.timePicker;
                            console.log(`MATTATO DEBUG: Found TimePicker via ng.getComponent`);
                        }
                    } catch (e) {
                        console.log(`MATTATO DEBUG: ng.getComponent failed:`, e);
                    }
                }
                
                // Method 1c: Try Kendo widget approach
                if (!timePickerComponent && window.kendo) {
                    const kendoWidget = window.kendo.widgetInstance(timePickerContainer, 'kendoTimePicker');
                    if (kendoWidget) {
                        console.log(`MATTATO DEBUG: Found Kendo TimePicker widget`);
                        kendoWidget.value(dateTime);
                        await new Promise(resolve => setTimeout(resolve, 500));
                        console.log(`MATTATO DEBUG: Set time via Kendo widget API`);
                        return;
                    }
                }
                
                // Method 1d: If we found Angular component, try to set value directly
                if (timePickerComponent) {
                    console.log(`MATTATO DEBUG: Attempting to set value via Angular component API`);
                    
                    if (timePickerComponent.value !== undefined) {
                        timePickerComponent.value = dateTime;
                        console.log(`MATTATO DEBUG: Set timePicker.value directly`);
                        
                        // Trigger change detection
                        if (timePickerComponent.valueChange && timePickerComponent.valueChange.emit) {
                            timePickerComponent.valueChange.emit(dateTime);
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, 500));
                        return;
                    }
                }
                
                console.log(`MATTATO DEBUG: Angular/Kendo API methods failed, trying dropdown method`);
                throw new Error('Could not access TimePicker API');
                
            } catch (error) {
                console.log(`MATTATO DEBUG: API method failed, trying dropdown approach:`, error);
                
                // Method 2: Fallback to dropdown clicking approach
                try {
                    const timePickerContainer = field.closest('kendo-timepicker');
                    console.log(`MATTATO DEBUG: TimePicker container:`, timePickerContainer);
                    
                    if (!timePickerContainer) {
                        throw new Error('No TimePicker container found for dropdown method');
                    }
                    
                    // Look for clock button with more detailed debugging
                    let clockButton = timePickerContainer.querySelector('button.k-input-button[title="Toggle time list"]');
                    console.log(`MATTATO DEBUG: Clock button (method 1):`, clockButton);
                    
                    if (!clockButton) {
                        clockButton = timePickerContainer.querySelector('button[aria-label="Toggle time list"]');
                        console.log(`MATTATO DEBUG: Clock button (method 2):`, clockButton);
                    }
                    
                    if (!clockButton) {
                        clockButton = timePickerContainer.querySelector('button.k-input-button');
                        console.log(`MATTATO DEBUG: Clock button (method 3):`, clockButton);
                    }
                    
                    if (!clockButton) {
                        // Let's see what buttons are actually available
                        const allButtons = timePickerContainer.querySelectorAll('button');
                        console.log(`MATTATO DEBUG: All buttons in TimePicker:`, allButtons);
                        for (let i = 0; i < allButtons.length; i++) {
                            console.log(`MATTATO DEBUG: Button ${i}:`, allButtons[i], 'title:', allButtons[i].title, 'aria-label:', allButtons[i].getAttribute('aria-label'));
                        }
                        throw new Error('No clock button found');
                    }
                    
                    console.log(`MATTATO DEBUG: Found clock button, clicking it:`, clockButton);
                    
                    field.focus();
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    clockButton.click();
                    console.log(`MATTATO DEBUG: Clock button clicked, waiting for dropdown`);
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Increased wait time
                    
                    // Look for dropdown with more detailed debugging and specific TimePicker selectors
                    let timeList = document.querySelector('kendo-timelist[role="listbox"]');
                    console.log(`MATTATO DEBUG: Dropdown (kendo-timelist):`, timeList);
                    
                    if (!timeList) {
                        timeList = document.querySelector('.k-list-container.k-timepicker-list');
                        console.log(`MATTATO DEBUG: Dropdown (method 1):`, timeList);
                    }
                    
                    if (!timeList) {
                        timeList = document.querySelector('.k-popup .k-list');
                        console.log(`MATTATO DEBUG: Dropdown (method 2):`, timeList);
                    }
                    
                    if (!timeList) {
                        timeList = document.querySelector('[role="listbox"]');
                        console.log(`MATTATO DEBUG: Dropdown (method 3):`, timeList);
                    }
                    
                    if (!timeList) {
                        // Let's see what popups/lists are available, including ActionSheet
                        const allPopups = document.querySelectorAll('.k-popup, .k-list, [role="listbox"], kendo-timelist, kendo-actionsheet');
                        console.log(`MATTATO DEBUG: All popups/lists on page:`, allPopups);
                        
                        // Check if ActionSheet is being used (newer Kendo versions)
                        const actionSheet = document.querySelector('kendo-actionsheet:not([style*="display: none"])');
                        if (actionSheet) {
                            console.log(`MATTATO DEBUG: Found ActionSheet (newer UI):`, actionSheet);
                            timeList = actionSheet.querySelector('kendo-timelist, [role="listbox"], .k-time-list');
                            if (timeList) {
                                console.log(`MATTATO DEBUG: Found time list in ActionSheet:`, timeList);
                            }
                        }
                        
                        if (!timeList) {
                            throw new Error('Dropdown did not open - no time list found');
                        }
                    }
                    
                    console.log(`MATTATO DEBUG: Found dropdown, looking for time options:`, timeList);
                    
                    const timeOptions = timeList.querySelectorAll('li, .k-item, [role="option"]');
                    console.log(`MATTATO DEBUG: Found ${timeOptions.length} time options`);
                    
                    if (timeOptions.length === 0) {
                        throw new Error('Dropdown opened but contains no time options');
                    }
                    
                    // Log first few options to see the format
                    console.log(`MATTATO DEBUG: Target time: "${timeString}"`);
                    console.log(`MATTATO DEBUG: Looking for hour: ${displayHours}, AM/PM: ${ampm}`);
                    
                    for (let i = 0; i < Math.min(5, timeOptions.length); i++) {
                        console.log(`MATTATO DEBUG: Sample option ${i}: "${timeOptions[i].textContent.trim()}"`);
                    }
                    
                    // This is a multi-step time picker! We need to select hour, then minute, then AM/PM
                    console.log(`MATTATO DEBUG: Detected multi-step time picker (hour selector)`);
                    
                    // Step 1: Select the hour
                    let hourMatch = null;
                    const targetHourStr = displayHours.toString();
                    
                    for (const option of timeOptions) {
                        const optionText = option.textContent.trim();
                        if (optionText === targetHourStr) {
                            hourMatch = option;
                            console.log(`MATTATO DEBUG: Found hour match: "${optionText}"`);
                            break;
                        }
                    }
                    
                    if (!hourMatch) {
                        console.log(`MATTATO DEBUG: Could not find hour ${targetHourStr} in options`);
                        clockButton.click(); // Close dropdown
                        throw new Error(`Hour ${targetHourStr} not found in dropdown`);
                    }
                    
                    console.log(`MATTATO DEBUG: Clicking hour: ${targetHourStr}`);
                    hourMatch.click();
                    await new Promise(resolve => setTimeout(resolve, 800));
                    
                    // Step 2: Look for minute selector (next dropdown should appear)
                    console.log(`MATTATO DEBUG: Looking for minute selector`);
                    const minuteList = document.querySelector('kendo-timelist[aria-label="Minute"]') ||
                                     document.querySelectorAll('kendo-timelist')[1] ||
                                     document.querySelector('[role="listbox"][aria-label*="inute"]');
                    
                    if (minuteList) {
                        console.log(`MATTATO DEBUG: Found minute selector:`, minuteList);
                        
                        const minuteOptions = minuteList.querySelectorAll('li, .k-item, [role="option"]');
                        console.log(`MATTATO DEBUG: Found ${minuteOptions.length} minute options`);
                        
                        // Find closest minute (round to nearest 15-minute increment, but cap at 45)
                        let targetMinute = Math.round(minutes / 15) * 15;
                        if (targetMinute >= 60) {
                            targetMinute = 45; // Cap at 45 minutes max for time picker
                        }
                        const targetMinuteStr = targetMinute.toString().padStart(2, '0');
                        
                        console.log(`MATTATO DEBUG: Looking for minute: ${targetMinuteStr} (rounded from ${minutes})`);
                        
                        let minuteMatch = null;
                        for (const option of minuteOptions) {
                            const optionText = option.textContent.trim();
                            if (optionText === targetMinuteStr || optionText === targetMinute.toString()) {
                                minuteMatch = option;
                                console.log(`MATTATO DEBUG: Found minute match: "${optionText}"`);
                                break;
                            }
                        }
                        
                        if (minuteMatch) {
                            console.log(`MATTATO DEBUG: Clicking minute: ${targetMinuteStr}`);
                            minuteMatch.click();
                            await new Promise(resolve => setTimeout(resolve, 800));
                        } else {
                            console.log(`MATTATO DEBUG: Could not find minute ${targetMinuteStr}, using first available`);
                            if (minuteOptions.length > 0) {
                                minuteOptions[0].click();
                                await new Promise(resolve => setTimeout(resolve, 800));
                            }
                        }
                    }
                    
                    // Step 3: Look for AM/PM selector
                    console.log(`MATTATO DEBUG: Looking for AM/PM selector`);
                    const ampmList = document.querySelector('kendo-timelist[aria-label*="AM"]') ||
                                   document.querySelector('kendo-timelist[aria-label*="PM"]') ||
                                   document.querySelectorAll('kendo-timelist')[2] ||
                                   document.querySelector('[role="listbox"]:last-child');
                    
                    if (ampmList) {
                        console.log(`MATTATO DEBUG: Found AM/PM selector:`, ampmList);
                        
                        const ampmOptions = ampmList.querySelectorAll('li, .k-item, [role="option"]');
                        console.log(`MATTATO DEBUG: Found ${ampmOptions.length} AM/PM options`);
                        
                        let ampmMatch = null;
                        for (const option of ampmOptions) {
                            const optionText = option.textContent.trim();
                            if (optionText === ampm || optionText.includes(ampm)) {
                                ampmMatch = option;
                                console.log(`MATTATO DEBUG: Found AM/PM match: "${optionText}"`);
                                break;
                            }
                        }
                        
                        if (ampmMatch) {
                            console.log(`MATTATO DEBUG: Clicking AM/PM: ${ampm}`);
                            ampmMatch.click();
                            await new Promise(resolve => setTimeout(resolve, 500));
                        } else {
                            console.log(`MATTATO DEBUG: Could not find AM/PM ${ampm}`);
                        }
                    }
                    
                    // Step 4: Click the "Set" button to confirm the time selection
                    console.log(`MATTATO DEBUG: Looking for Set button to confirm time selection`);
                    
                    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for UI to update
                    
                    // Look for Set button ONLY within time picker popup, avoiding Settings buttons
                    let setButton = null;
                    
                    // First try specific time picker popup locations
                    setButton = document.querySelector('.k-actionsheet button[title*="Set"]') ||
                               document.querySelector('kendo-actionsheet button[title*="Set"]') ||
                               document.querySelector('.k-popup button.k-button-solid-primary') ||
                               document.querySelector('.k-popup button.k-primary') ||
                               document.querySelector('.k-time-container button');
                    
                    // If not found, search by text content but ONLY in time picker areas
                    if (!setButton) {
                        const timePickerButtons = document.querySelectorAll('.k-actionsheet button, kendo-actionsheet button, .k-popup button, .k-time-container button');
                        setButton = Array.from(timePickerButtons).find(btn => {
                            const text = btn.textContent.trim().toLowerCase();
                            const title = btn.title?.toLowerCase() || '';
                            
                            // Make sure it's NOT a settings button
                            if (title.includes('settings') || text.includes('settings') || btn.classList.contains('k-i-gear')) {
                                return false;
                            }
                            
                            // Look for Set/OK/Apply/Confirm buttons
                            return text.includes('set') || text.includes('ok') || text.includes('apply') || text.includes('confirm') ||
                                   title.includes('set') || title.includes('ok') || title.includes('apply') || title.includes('confirm');
                        });
                    }
                    
                    if (setButton) {
                        console.log(`MATTATO DEBUG: Found Set button:`, setButton, `Text: "${setButton.textContent.trim()}"`);
                        setButton.click();
                        await new Promise(resolve => setTimeout(resolve, 500));
                        console.log(`MATTATO DEBUG: Clicked Set button - time selection should be complete`);
                    } else {
                        // If no Set button found, let's see what buttons are available in time picker areas
                        const allPopupButtons = document.querySelectorAll('.k-actionsheet button, kendo-actionsheet button, .k-popup button, .k-time-container button');
                        console.log(`MATTATO DEBUG: Could not find Set button. Available buttons in time picker areas:`, allPopupButtons);
                        
                        for (let i = 0; i < allPopupButtons.length; i++) {
                            const btn = allPopupButtons[i];
                            console.log(`MATTATO DEBUG: Button ${i}:`, btn, `Text: "${btn.textContent.trim()}", Title: "${btn.title}", Class: "${btn.className}"`);
                        }
                        
                        // Try clicking any button that looks like confirmation (but NOT Settings)
                        const confirmButton = Array.from(allPopupButtons).find(btn => {
                            const text = btn.textContent.trim().toLowerCase();
                            const title = btn.title?.toLowerCase() || '';
                            
                            // Skip Settings buttons
                            if (title.includes('settings') || text.includes('settings') || btn.classList.contains('k-i-gear')) {
                                return false;
                            }
                            
                            return btn.textContent.trim() !== '' && 
                                   (btn.classList.contains('k-primary') || btn.classList.contains('k-button-solid-primary'));
                        });
                        
                        if (confirmButton) {
                            console.log(`MATTATO DEBUG: Trying primary button as Set button:`, confirmButton);
                            confirmButton.click();
                            await new Promise(resolve => setTimeout(resolve, 500));
                        } else {
                            console.log(`MATTATO DEBUG: No Set button found - time picker might auto-close`);
                        }
                    }
                    
                    console.log(`MATTATO DEBUG: Multi-step time selection completed`);
                    return;
                    
                } catch (dropdownError) {
                    console.log(`MATTATO DEBUG: Dropdown method failed:`, dropdownError);
                    
                    // Method 3: Last resort - direct value assignment
                    console.log(`MATTATO DEBUG: Final fallback - direct assignment`);
                    field.focus();
                    field.value = timeString;
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    field.blur();
                }
            }
            
            console.log(`MATTATO DEBUG: After filling ${fieldType} time - new value:`, field.value);
        }
        
        async function closeCurrentModal() {
            console.log('MATTATO DEBUG: Attempting to close current modal');
            
            // Look for close buttons (X, Cancel, etc.)
            const allButtons = document.querySelectorAll(
                'button[aria-label*="close"], button[title*="close"], ' +
                '.close-button, .modal-close, .dialog-close, ' +
                'button'
            );
            
            for (const button of allButtons) {
                if (button.offsetParent !== null && // Check if visible
                    (button.textContent.includes('Cancel') || 
                     button.textContent.includes('Close') ||
                     button.getAttribute('aria-label')?.includes('close') ||
                     button.getAttribute('title')?.includes('close'))) {
                    button.click();
                    console.log('MATTATO DEBUG: Clicked close button');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return true;
                }
            }
            
            // Try ESC key
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            console.log('MATTATO DEBUG: Sent ESC key to close modal');
            await new Promise(resolve => setTimeout(resolve, 500));
            return true;
        }
        
        async function fillTimesheetForm(session) {
            console.log('MATTATO DEBUG: Filling timesheet form for session:', session.description);
            
            const startDate = new Date(session.start_time);
            const endTime = session.end_time ? 
                new Date(session.end_time) : 
                new Date(startDate.getTime() + (25 * 60 * 1000));
            
            try {
                // Fill description field
                const descriptionFields = document.querySelectorAll(
                    'input[placeholder*="escription"], textarea[placeholder*="escription"], ' +
                    'input[name*="escription"], textarea[name*="escription"], ' +
                    'input[id*="escription"], textarea[id*="escription"]'
                );
                
                for (const field of descriptionFields) {
                    field.focus();
                    field.value = session.description || 'Imported from Mattato';
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('MATTATO DEBUG: Filled description field');
                    break;
                }
                
                // Fill start time
                const startTimeFields = document.querySelectorAll(
                    'input[type="time"], input[placeholder*="start"], input[placeholder*="begin"], ' +
                    'input[name*="start"], input[name*="begin"], input[id*="start"], input[id*="begin"]'
                );
                
                for (const field of startTimeFields) {
                    const timeString = startDate.toTimeString().slice(0, 5); // HH:MM format
                    field.focus();
                    field.value = timeString;
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('MATTATO DEBUG: Filled start time field:', timeString);
                    break;
                }
                
                // Fill end time
                const endTimeFields = document.querySelectorAll(
                    'input[placeholder*="end"], input[name*="end"], input[id*="end"]'
                );
                
                for (const field of endTimeFields) {
                    const timeString = endTime.toTimeString().slice(0, 5); // HH:MM format
                    field.focus();
                    field.value = timeString;
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('MATTATO DEBUG: Filled end time field:', timeString);
                    break;
                }
                
                // Fill date field if present
                const dateFields = document.querySelectorAll('input[type="date"]');
                for (const field of dateFields) {
                    const dateString = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format
                    field.focus();
                    field.value = dateString;
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('MATTATO DEBUG: Filled date field:', dateString);
                    break;
                }
                
                console.log('MATTATO DEBUG: Form filling completed');
                return true;
                
            } catch (error) {
                console.error('MATTATO DEBUG: Error filling form:', error);
                return false;
            }
        }
        
        async function submitTimesheetForm() {
            console.log('MATTATO DEBUG: Looking for Save & close button');
            
            // Look for the specific "Save & close" button
            const saveButtons = document.querySelectorAll('button.k-button-solid-primary, button.k-button');
            const saveButton = Array.from(saveButtons).find(btn => 
                btn.textContent.includes('Save & close')
            );
            
            if (saveButton) {
                console.log('MATTATO DEBUG: Found Save & close button:', saveButton);
                saveButton.click();
                
                // Wait for submission to process
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log('MATTATO DEBUG: Save & close clicked');
                return true;
            }
            
            // Alternative: Look for just "Save" button
            const saveOnlyButtons = document.querySelectorAll('button.k-button');
            const saveOnlyButton = Array.from(saveOnlyButtons).find(btn => 
                btn.textContent.trim() === 'Save'
            );
            if (saveOnlyButton) {
                console.log('MATTATO DEBUG: Found Save button:', saveOnlyButton);
                saveOnlyButton.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log('MATTATO DEBUG: Save clicked');
                return true;
            }
            
            console.log('MATTATO DEBUG: No save button found');
            return false;
        }
        
        async function tryDataContextService(sessions) {
            try {
                console.log('MATTATO DEBUG: Attempting dataContextService approach with multiple access methods');
                
                let dataContextService = null;
                
                // Method 1: Try Angular element approach (most reliable)
                try {
                    const appElement = document.querySelector('[ng-app]') || document.body;
                    const injector = angular.element(appElement).injector();
                    dataContextService = injector.get('dataContextService');
                    console.log('MATTATO DEBUG: Got dataContextService via Angular injector');
                } catch (angularError) {
                    console.log('MATTATO DEBUG: Angular injector method failed:', angularError.message);
                }
                
                // Method 2: Try CockpitFramework if Method 1 failed
                if (!dataContextService) {
                    try {
                        const injector = window.CockpitFramework?.Application?.ApplicationService?.getInjector();
                        if (injector) {
                            dataContextService = injector.get("dataContextService");
                            console.log('MATTATO DEBUG: Got dataContextService via CockpitFramework');
                        }
                    } catch (frameworkError) {
                        console.log('MATTATO DEBUG: CockpitFramework method failed:', frameworkError.message);
                    }
                }
                
                if (!dataContextService) {
                    console.log('MATTATO DEBUG: No dataContextService available via any method');
                    return false;
                }
                
                console.log('MATTATO DEBUG: Got dataContextService, creating entries...');
                
                let createdCount = 0;
                const totalSessions = sessions.length;
                
                // Create entries using exact same pattern as line 4720
                for (const session of sessions) {
                    console.log('MATTATO DEBUG: Creating entry for session:', session.description);
                    
                    const timesheetData = {
                        APP_Description: session.description || 'Imported from Mattato',
                        APP_BeginTime: new Date(session.start_time),
                        APP_EndTime: session.end_time ? 
                            new Date(session.end_time) : 
                            new Date(new Date(session.start_time).getTime() + (25 * 60 * 1000)),
                        LastBookingCompletionDate: new Date(session.start_time).toISOString().split('T')[0]
                    };
                    
                    console.log('MATTATO DEBUG: Timesheet data:', timesheetData);
                    
                    try {
                        // Use exact same pattern: dataContextService.addObject(entityName, entityData, calculatedProperties)
                        const response = await dataContextService.addObject('Timesheet', timesheetData, []).toPromise();
                        createdCount++;
                        console.log(`MATTATO DEBUG: Created via dataContextService ${createdCount}/${totalSessions}:`, response);
                        showStatus(`✅ Created ${createdCount}/${totalSessions} entries...`, 'success');
                    } catch (serviceError) {
                        console.error('MATTATO DEBUG: dataContextService error for session:', session.description, serviceError);
                        showStatus(`❌ Failed to create "${session.description}": ${serviceError.message}`, 'error');
                    }
                }
                
                if (createdCount > 0) {
                    showStatus(`🎉 Successfully created ${createdCount} timesheet entries via dataContextService!`, 'success');
                    hideOverlay();
                    
                    // Refresh page to show results
                    setTimeout(() => {
                        console.log('MATTATO DEBUG: Refreshing page to show new entries');
                        window.location.reload();
                    }, 2000);
                    return true;
                } else {
                    return false;
                }
                
            } catch (error) {
                console.error('MATTATO DEBUG: dataContextService approach failed:', error);
                return false;
            }
        }
        
        async function tryDirectAPICall(sessions) {
            console.log('MATTATO DEBUG: Falling back to direct API approach');
            
            // Try different possible API endpoints
            const possibleEndpoints = [
                '/odata/APP_Timesheet',
                '/odata/Timesheet',
                '/api/timesheet',
                '/api/Timesheet',
                '/odata/TimesheetEntry',
                '/odata/APP_TimesheetEntry'
            ];
            
            const apiBaseUrl = window.location.origin;
            console.log('MATTATO DEBUG: Will try multiple endpoints:', possibleEndpoints);
            
            // Get authentication headers
            const authHeaders = await getAuthHeaders();
            console.log('MATTATO DEBUG: Got auth headers:', Object.keys(authHeaders));
            
            let createdCount = 0;
            const totalSessions = sessions.length;
            
            // Process each session
            for (const session of sessions) {
                console.log('MATTATO DEBUG: Processing session via API:', session.description);
                
                try {
                    // Get current user UUID and other context from TimeCockpit's application service
                    let currentUserUuid = null;
                    let defaultProjectUuid = null;
                    let defaultTaskUuid = null;
                    let timesheetTypeUuid = null;
                    
                    try {
                        const app = window.CockpitFramework?.Application?.ApplicationService?.getCurrentApplication();
                        if (app && app.useruuid) {
                            currentUserUuid = app.impersonationUserUuid || app.useruuid;
                            console.log('MATTATO DEBUG: Found user UUID:', currentUserUuid);
                        }
                        
                        // Try to get timesheet calendar service for selected user and defaults
                        const injector = window.CockpitFramework?.Application?.injector;
                        if (injector) {
                            try {
                                const timesheetCalendarService = injector.get('timeSheetCalendarService');
                                if (timesheetCalendarService?.selectedUser) {
                                    console.log('MATTATO DEBUG: Found selected user:', timesheetCalendarService.selectedUser);
                                    // Could get default project/task from selected user context
                                }
                            } catch (serviceError) {
                                console.log('MATTATO DEBUG: Could not get timesheet calendar service:', serviceError.message);
                            }
                            
                            try {
                                // Try to get default timesheet type from user preferences or settings
                                const settingsService = injector.get('settingsService');
                                if (settingsService?.timesheetDefaults) {
                                    timesheetTypeUuid = settingsService.timesheetDefaults.timesheetTypeUuid;
                                    defaultProjectUuid = settingsService.timesheetDefaults.projectUuid;
                                    defaultTaskUuid = settingsService.timesheetDefaults.taskUuid;
                                    console.log('MATTATO DEBUG: Found defaults:', {
                                        timesheetTypeUuid,
                                        defaultProjectUuid,
                                        defaultTaskUuid
                                    });
                                }
                            } catch (settingsError) {
                                console.log('MATTATO DEBUG: Could not get settings service:', settingsError.message);
                            }
                        }
                    } catch (userError) {
                        console.log('MATTATO DEBUG: Could not get TimeCockpit context:', userError.message);
                    }
                    
                    // Build timesheet data matching TimeCockpit's exact structure
                    const startTime = new Date(session.start_time);
                    const endTime = session.end_time ? 
                        new Date(session.end_time) : 
                        new Date(startTime.getTime() + (25 * 60 * 1000));
                    
                    const timesheetData = {
                        "APP_BeginTime": startTime.toISOString().slice(0, -1), // Remove 'Z' suffix
                        "APP_Description": session.description || 'Imported from Mattato',
                        "APP_EndTime": endTime.toISOString().slice(0, -1), // Remove 'Z' suffix
                        "APP_HourlyRate": null,
                        "APP_HourlyRateBilled": null,
                        "APP_IsDurationTimesheet": false,
                        "APP_IsHomeOffice": false,
                        "APP_JourneyDistance": null,
                        "APP_JourneyFrom": null,
                        "APP_JourneyTo": null,
                        "APP_Location": null,
                        "APP_NoBilling": false,
                        "APP_OperationId": null,
                        "USR_ApprovedBy": null,
                        "USR_ApprovedMailSentTimestamp": null,
                        "USR_ApprovedTimestamp": null,
                        "USR_CreationDate": null,
                        "USR_CreationSentToJiraTimestamp": null,
                        "USR_JiraId": null,
                        "USR_MedicalConfirmationReceived": false,
                        "USR_RejectedMailSentTimestamp": null,
                        "USR_RequestForApprovalSentTimestamp": null,
                        "USR_UnapprovedBy": null,
                        "USR_UnapprovedTimestamp": null,
                        "USR_UpdateDate": null,
                        "USR_UpdateSentToJiraTimestamp": null,
                        "APP_InvoiceUuid": null,
                        "APP_JourneyMeansOfTransportUuid": null,
                        "APP_ProjectUuid": defaultProjectUuid, // Use extracted default project
                        "APP_TaskUuid": defaultTaskUuid, // Use extracted default task
                        "APP_UserDetailUuid": currentUserUuid, // Use real current user UUID
                        "APP_WorkingTimeWeightUuid": null,
                        "USR_TimesheetTypeUuid": timesheetTypeUuid, // Use extracted timesheet type
                        "USR_WorkingTimeSurchargeConfigurationUuid": null,
                        "LastBookingCompletionDate": startTime.toISOString().split('T')[0] // Required date field
                    };
                    
                    console.log('MATTATO DEBUG: API Timesheet data:', timesheetData);
                    
                    // Try different endpoints until one works
                    let response = null;
                    let workingEndpoint = null;
                    
                    for (const endpoint of possibleEndpoints) {
                        try {
                            console.log(`MATTATO DEBUG: Trying endpoint: ${apiBaseUrl}${endpoint}`);
                            
                            const requestHeaders = {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'DataServiceVersion': '3.0',
                                'MaxDataServiceVersion': '3.0',
                                'OData-Version': '4.0',
                                'OData-MaxVersion': '4.0',
                                'Origin': window.location.origin,
                                'Referer': window.location.href,
                                ...authHeaders
                            };
                            
                            const requestBody = JSON.stringify(timesheetData);
                            console.log('MATTATO DEBUG: Request headers:', requestHeaders);
                            console.log('MATTATO DEBUG: Request body:', requestBody);
                            
                            const testResponse = await fetch(`${apiBaseUrl}${endpoint}`, {
                                method: 'POST',
                                headers: requestHeaders,
                                body: requestBody,
                                credentials: 'same-origin'
                            });
                            
                            console.log(`MATTATO DEBUG: Response status: ${testResponse.status} ${testResponse.statusText}`);
                            console.log('MATTATO DEBUG: Response headers:', [...testResponse.headers.entries()]);
                            
                            if (testResponse.ok || testResponse.status !== 404) {
                                response = testResponse;
                                workingEndpoint = endpoint;
                                console.log(`MATTATO DEBUG: Found working endpoint: ${endpoint}`);
                                break;
                            } else {
                                console.log(`MATTATO DEBUG: Endpoint ${endpoint} returned ${testResponse.status}`);
                            }
                            
                        } catch (endpointError) {
                            console.log(`MATTATO DEBUG: Endpoint ${endpoint} failed:`, endpointError.message);
                        }
                    }
                    
                    if (response && response.ok) {
                        const result = await response.json();
                        createdCount++;
                        console.log(`MATTATO DEBUG: Created via API ${createdCount}/${totalSessions} using ${workingEndpoint}:`, result);
                        showStatus(`✅ Created ${createdCount}/${totalSessions} entries...`, 'success');
                    } else if (response) {
                        let errorDetails = '';
                        try {
                            // Read as text first
                            const responseText = await response.text();
                            console.log('MATTATO DEBUG: Raw response text:', responseText);
                            
                            // Try to parse as JSON for better formatting
                            try {
                                const errorJson = JSON.parse(responseText);
                                errorDetails = JSON.stringify(errorJson, null, 2);
                            } catch (parseError) {
                                errorDetails = responseText;
                            }
                        } catch (readError) {
                            errorDetails = `Failed to read response: ${readError.message}`;
                        }
                        console.error('MATTATO DEBUG: API error:', response.status, errorDetails);
                        showStatus(`❌ API error ${response.status}: ${errorDetails}`, 'error');
                    } else {
                        console.error('MATTATO DEBUG: No working endpoint found for session:', session.description);
                        showStatus(`❌ No working endpoint found for "${session.description}"`, 'error');
                    }
                    
                } catch (sessionError) {
                    console.error('MATTATO DEBUG: Failed to create session via API:', session.description, sessionError);
                    showStatus(`❌ Failed to create "${session.description}": ${sessionError.message}`, 'error');
                }
            }
            
            if (createdCount > 0) {
                showStatus(`🎉 Successfully created ${createdCount} timesheet entries via API!`, 'success');
                
                // Refresh page after short delay
                setTimeout(() => {
                    console.log('MATTATO DEBUG: Refreshing page to show new entries');
                    window.location.reload();
                }, 3000);
            } else {
                showStatus('❌ No entries were created', 'error');
            }
            
            hideOverlay();
        }
        
        async function getAuthHeaders() {
            console.log('MATTATO DEBUG: Getting authentication headers');
            const headers = {};
            
            // 1. Check for CSRF/anti-forgery tokens
            const csrfSelectors = [
                'meta[name="__RequestVerificationToken"]',
                'input[name="__RequestVerificationToken"]',
                'meta[name="_token"]',
                'input[name="_token"]'
            ];
            
            for (const selector of csrfSelectors) {
                const element = document.querySelector(selector);
                const token = element?.content || element?.value;
                if (token) {
                    headers['X-Requested-With'] = 'XMLHttpRequest';
                    headers['RequestVerificationToken'] = token;
                    headers['__RequestVerificationToken'] = token;
                    console.log('MATTATO DEBUG: Found CSRF token via', selector);
                    break;
                }
            }
            
            // 2. Look for Bearer tokens in existing network requests
            try {
                const performanceEntries = performance.getEntriesByType('navigation');
                // Check if we can intercept auth headers from existing requests
                if (window.fetch) {
                    console.log('MATTATO DEBUG: Will use existing session authentication');
                }
            } catch (e) {
                console.log('MATTATO DEBUG: Could not analyze existing requests');
            }
            
            // 3. Extract session info from cookies
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [name, value] = cookie.trim().split('=');
                acc[name] = value;
                return acc;
            }, {});
            
            // Look for common authentication cookie names
            const authCookieNames = ['ASP.NET_SessionId', 'ASPXAUTH', '.ASPXAUTH', 'AUTH_TOKEN', 'sessionid'];
            for (const cookieName of authCookieNames) {
                if (cookies[cookieName]) {
                    console.log(`MATTATO DEBUG: Found auth cookie: ${cookieName}`);
                }
            }
            
            // 4. Add standard headers for API requests
            headers['Content-Type'] = 'application/json';
            headers['Accept'] = 'application/json';
            headers['X-Requested-With'] = 'XMLHttpRequest';
            
            console.log('MATTATO DEBUG: Final auth headers:', Object.keys(headers));
            return headers;
        }
    });
    
    content.querySelector('#mattato-cancel-import').addEventListener('click', () => {
        resetToInitialState();
    });
}

function resetToInitialState() {
    loadedJSON = null;
    
    const content = floatingWindow.querySelector('#mattato-window-content');
    content.innerHTML = `
        <div id="mattato-week-display" style="
            background: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 12px;
            text-align: center;
            font-weight: 600;
            color: #495057;
        ">
            Ready to import Mattato sessions...
        </div>
        <div id="mattato-import-section">
            <button id="mattato-import-btn" style="
                width: 100%;
                background: #28a745;
                color: white;
                border: none;
                padding: 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
            ">Import JSON</button>
        </div>
        <div id="mattato-status" style="
            margin-top: 10px;
            padding: 8px;
            border-radius: 4px;
            font-size: 12px;
            display: none;
        "></div>
        <input type="file" id="mattato-file-input" accept=".json" style="display: none;">
    `;
    
    // Re-setup events
    setupWindowEvents();
    updateWeekDisplay();
}

function ensureFloatingWindow() {
    if (!floatingWindow || !document.body.contains(floatingWindow)) {
        console.log('MATTATO DEBUG: Floating window missing, recreating...');
        createFloatingWindow();
        return true;
    }
    return false;
}

function showStatus(message, type = 'info') {
    console.log('MATTATO DEBUG: showStatus called with:', message, type);
    
    ensureFloatingWindow();
    
    if (!floatingWindow) {
        console.error('MATTATO ERROR: Cannot show status - floating window is null after recreation. Message:', message);
        return;
    }
    
    let status = floatingWindow.querySelector('#mattato-status');
    if (!status) {
        console.warn('MATTATO WARN: Status element not found, trying to create it. Message:', message);
        
        // Try to find the content div and add status element
        const content = floatingWindow.querySelector('#mattato-window-content');
        if (content) {
            const existingStatus = content.querySelector('#mattato-status');
            if (!existingStatus) {
                console.log('MATTATO DEBUG: Creating new status element');
                const statusDiv = document.createElement('div');
                statusDiv.id = 'mattato-status';
                statusDiv.style.cssText = `
                    margin-top: 10px;
                    padding: 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    display: none;
                `;
                content.appendChild(statusDiv);
                status = statusDiv;
            } else {
                status = existingStatus;
            }
        }
        
        if (!status) {
            console.error('MATTATO ERROR: Could not create or find status element. Message:', message);
            // Fallback to console
            console.log('MATTATO STATUS:', message);
            return;
        }
    }
    
    status.style.display = 'block';
    status.textContent = message;
    
    const colors = {
        error: { bg: '#f8d7da', color: '#721c24' },
        success: { bg: '#d4edda', color: '#155724' },
        info: { bg: '#d1ecf1', color: '#0c5460' }
    };
    
    const colorScheme = colors[type] || colors.info;
    status.style.background = colorScheme.bg;
    status.style.color = colorScheme.color;
    
    // Auto-hide after 5 seconds for non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            if (status && status.style.display !== 'none') {
                status.style.display = 'none';
            }
        }, 5000);
    }
}

function waitForModalToOpen(attempts = 0, maxAttempts = 30, interval = 500) {
    console.log(`MATTATO DEBUG: Waiting for timesheet modal, attempt ${attempts + 1}/${maxAttempts}`);
    
    // Show animated "searching" message
    const dots = '.'.repeat((attempts % 3) + 1);
    showStatus(`Finding timesheet modal${dots}`, 'info');
    
    // Check for specific timesheet modal elements based on the HTML structure
    const timesheetModalFound = checkForTimesheetModal();
    
    if (timesheetModalFound) {
        console.log('MATTATO DEBUG: Timesheet modal detected after', attempts + 1, 'attempts');
        showStatus('Timesheet modal found!', 'success');
        console.log('MATTATO DEBUG: Floating window state when modal found:', floatingWindow ? 'exists' : 'null', 
                    floatingWindow && document.body.contains(floatingWindow) ? 'in DOM' : 'not in DOM');
        try {
            verifyTimesheetModalOpened(timesheetModalFound);
        } catch (error) {
            console.error('MATTATO DEBUG: Error in verifyTimesheetModalOpened:', error);
            showStatus('Error verifying modal: ' + error.message, 'error');
        }
        return;
    }
    
    // If we haven't reached max attempts, try again
    if (attempts < maxAttempts - 1) {
        setTimeout(() => {
            waitForModalToOpen(attempts + 1, maxAttempts, interval);
        }, interval);
    } else {
        console.log('MATTATO DEBUG: Max attempts reached, no timesheet modal detected');
        showStatus('Timeout: No timesheet modal found after 15 seconds. The modal may take longer to load or the plus button may not have worked.', 'error');
        hideOverlay();
    }
}

function checkForTimesheetModal() {
    // Look for the specific timesheet modal structure from the HTML
    // Main modal container
    const modalContainer = document.querySelector('.cofx-view-content[aria-hidden="false"]');
    
    if (modalContainer) {
        console.log('MATTATO DEBUG: Found modal container:', modalContainer);
        
        // Check for specific timesheet form elements
        const descriptionField = modalContainer.querySelector('textarea[name="APP_Description"]');
        const formWrapper = modalContainer.querySelector('.cofx-form-wrapper');
        const timesheetTab = modalContainer.querySelector('.k-tab-on-top .k-link');
        
        console.log('MATTATO DEBUG: Timesheet elements check:', {
            descriptionField: !!descriptionField,
            formWrapper: !!formWrapper,
            timesheetTab: !!timesheetTab,
            tabText: timesheetTab?.textContent?.trim()
        });
        
        // Verify this is actually the timesheet modal
        if (formWrapper && (descriptionField || (timesheetTab && timesheetTab.textContent.includes('Time Sheet')))) {
            console.log('MATTATO DEBUG: Confirmed timesheet modal structure');
            return modalContainer;
        }
    }
    
    // Fallback: look for any modal-like element with timesheet indicators
    const fallbackSelectors = [
        '.cofx-view-content',
        '.cofx-form-wrapper',
        '[class*="form"][class*="view"]'
    ];
    
    for (const selector of fallbackSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            const style = window.getComputedStyle(element);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
                const text = element.textContent.toLowerCase();
                if (text.includes('description') && text.includes('project') && 
                    (text.includes('timesheet') || text.includes('time sheet'))) {
                    console.log('MATTATO DEBUG: Found timesheet modal via fallback:', element);
                    return element;
                }
            }
        }
    }
    
    console.log('MATTATO DEBUG: No timesheet modal found');
    return null;
}

function attemptToOpenTimesheetModal() {
    console.log('MATTATO DEBUG: attemptToOpenTimesheetModal started');
    console.log('MATTATO DEBUG: Floating window state at start:', floatingWindow ? 'exists' : 'null', 
                floatingWindow && document.body.contains(floatingWindow) ? 'in DOM' : 'not in DOM');
    showStatus('Looking for add timesheet button...', 'info');
    
    try {
        // Look for the plus icon button
        console.log('MATTATO DEBUG: Searching for plus button');
        const plusButton = findPlusIconButton();
        console.log('MATTATO DEBUG: Plus button search result:', plusButton);
        
        if (plusButton) {
            try {
                console.log('MATTATO DEBUG: Attempting to click plus button');
                
                // Capture DOM state before click
                const beforeModals = document.querySelectorAll('.modal, [class*="modal"], [class*="dialog"], [class*="overlay"], [role="dialog"], [aria-modal="true"]');
                console.log('MATTATO DEBUG: Elements before click:', beforeModals.length, Array.from(beforeModals).map(el => ({
                    tag: el.tagName,
                    class: el.className,
                    id: el.id,
                    visible: window.getComputedStyle(el).display !== 'none'
                })));
                
                // Click the button
                plusButton.click();
                console.log('MATTATO DEBUG: Plus button clicked, waiting for modal');
                
                // Capture DOM state immediately after click
                setTimeout(() => {
                    const afterModals = document.querySelectorAll('.modal, [class*="modal"], [class*="dialog"], [class*="overlay"], [role="dialog"], [aria-modal="true"]');
                    console.log('MATTATO DEBUG: Elements immediately after click:', afterModals.length, Array.from(afterModals).map(el => ({
                        tag: el.tagName,
                        class: el.className,
                        id: el.id,
                        visible: window.getComputedStyle(el).display !== 'none'
                    })));
                }, 100);
                console.log('MATTATO DEBUG: Floating window state after click:', floatingWindow ? 'exists' : 'null', 
                            floatingWindow && document.body.contains(floatingWindow) ? 'in DOM' : 'not in DOM');
                
                // Wait for modal with polling approach
                waitForModalToOpen();
                
            } catch (error) {
                console.error('MATTATO DEBUG: Error clicking plus button:', error);
                showStatus('Error clicking add timesheet button: ' + error.message, 'error');
            }
        } else {
            console.log('MATTATO DEBUG: No plus button found');
            showStatus('Could not find add timesheet plus button. Make sure you are on the calendar page.', 'error');
            hideOverlay();
        }
    } catch (error) {
        console.error('MATTATO DEBUG: Error in attemptToOpenTimesheetModal:', error);
        showStatus('Error in modal process: ' + error.message, 'error');
        hideOverlay();
    }
}

function findPlusIconButton() {
    console.log('MATTATO DEBUG: findPlusIconButton started');
    
    // Look for the plus icon specifically
    console.log('MATTATO DEBUG: Searching for kendo-icon.k-i-plus');
    const plusIcons = document.querySelectorAll('kendo-icon.k-i-plus');
    console.log('MATTATO DEBUG: Found kendo plus icons:', plusIcons.length);
    
    for (const icon of plusIcons) {
        console.log('MATTATO DEBUG: Checking plus icon:', icon);
        // Check if this is likely the add timesheet button
        const button = icon.closest('button');
        console.log('MATTATO DEBUG: Button parent:', button);
        if (button && !button.disabled) {
            // Additional checks to ensure it's the right button
            const buttonParent = button.closest('.k-grid-toolbar, .k-toolbar, [data-role="toolbar"]');
            console.log('MATTATO DEBUG: Button toolbar parent:', buttonParent);
            if (buttonParent) {
                console.log('MATTATO DEBUG: Found valid plus button:', button);
                return button;
            }
        }
    }
    
    console.log('MATTATO DEBUG: No kendo plus button found, trying fallback');
    // Fallback: look for any clickable element containing the plus icon
    const allPlusIcons = document.querySelectorAll('.k-i-plus, .k-icon.k-i-plus');
    console.log('MATTATO DEBUG: Found all plus icons:', allPlusIcons.length);
    
    for (const icon of allPlusIcons) {
        console.log('MATTATO DEBUG: Checking fallback plus icon:', icon);
        const clickableParent = icon.closest('button, a, [role="button"]');
        console.log('MATTATO DEBUG: Clickable parent:', clickableParent);
        if (clickableParent && !clickableParent.disabled) {
            console.log('MATTATO DEBUG: Found clickable plus button:', clickableParent);
            return clickableParent;
        }
    }
    
    console.log('MATTATO DEBUG: No plus button found at all');
    return null;
}

function verifyTimesheetModalOpened(modalElement) {
    console.log('MATTATO DEBUG: verifyTimesheetModalOpened started');
    console.log('MATTATO DEBUG: Modal element:', modalElement);
    
    try {
        // Simple verification - just confirm we found the right modal
        const descriptionField = modalElement.querySelector('textarea[name="APP_Description"]');
        const formWrapper = modalElement.querySelector('.cofx-form-wrapper');
        
        console.log('MATTATO DEBUG: Key elements check:', {
            descriptionField: !!descriptionField,
            formWrapper: !!formWrapper
        });
        
        if (descriptionField || formWrapper) {
            console.log('MATTATO DEBUG: ✅ Timesheet modal successfully detected and verified!');
            showStatus('✅ Timesheet modal detected successfully!', 'success');
            
            // Now click the Search tickets button and test the flow
            setTimeout(() => {
                clickSearchTicketsButton(modalElement);
            }, 1000);
            
        } else {
            console.log('MATTATO DEBUG: ❌ Modal structure not as expected');
            showStatus('Modal found but structure unexpected', 'error');
        }
        
    } catch (error) {
        console.error('MATTATO DEBUG: Error in modal verification:', error);
        showStatus('Error verifying modal: ' + error.message, 'error');
    }
    
    console.log('MATTATO DEBUG: verifyTimesheetModalOpened completed');
}

function clickSearchTicketsButton(timesheetModal) {
    console.log('MATTATO DEBUG: clickSearchTicketsButton started');
    showStatus('Looking for Search tickets button...', 'info');
    
    try {
        // Find the Search tickets button - try multiple approaches
        const searchButton1 = timesheetModal.querySelector('button.cofx-action-button[ng-click*="USR_SearchTasksAction"]');
        const searchButton2 = timesheetModal.querySelector('button[ng-click*="actionManager.executeActionByName"]');
        const searchButtonByText = Array.from(timesheetModal.querySelectorAll('button')).find(btn => 
            btn.textContent.trim().includes('Search tickets')
        );
        const searchButtonByClass = timesheetModal.querySelector('button.cofx-action-button');
        
        const buttonToClick = searchButton1 || searchButton2 || searchButtonByText || searchButtonByClass;
        
        console.log('MATTATO DEBUG: Search button search results:', {
            searchButton1: !!searchButton1,
            searchButton2: !!searchButton2,
            searchButtonByText: !!searchButtonByText,
            searchButtonByClass: !!searchButtonByClass,
            buttonToClick: !!buttonToClick,
            buttonText: buttonToClick?.textContent?.trim(),
            buttonClass: buttonToClick?.className,
            ngClick: buttonToClick?.getAttribute('ng-click')
        });
        
        if (buttonToClick) {
            console.log('MATTATO DEBUG: Clicking Search tickets button');
            showStatus('Clicking Search tickets button...', 'info');
            
            // Single click to avoid creating duplicate modals
            buttonToClick.click();
            
            // Wait for the search tickets modal to appear
            setTimeout(() => {
                waitForSearchTicketsModal();
            }, 1000); // Increased wait time
            
        } else {
            console.log('MATTATO DEBUG: Search tickets button not found');
            showStatus('Search tickets button not found in timesheet modal', 'error');
            
            // Debug: log all buttons in the modal
            const allButtons = timesheetModal.querySelectorAll('button');
            console.log('MATTATO DEBUG: All buttons in timesheet modal:', Array.from(allButtons).map(btn => ({
                text: btn.textContent.trim(),
                class: btn.className,
                ngClick: btn.getAttribute('ng-click'),
                visible: window.getComputedStyle(btn).display !== 'none'
            })));
        }
        
    } catch (error) {
        console.error('MATTATO DEBUG: Error clicking search tickets button:', error);
        showStatus('Error clicking search tickets button: ' + error.message, 'error');
    }
}

function waitForSearchTicketsModal(attempts = 0, maxAttempts = 20, interval = 500) {
    console.log(`MATTATO DEBUG: Waiting for search tickets modal, attempt ${attempts + 1}/${maxAttempts}`);
    
    const dots = '.'.repeat((attempts % 3) + 1);
    showStatus(`Finding Search Tickets modal${dots}`, 'info');
    
    // Check for the search tickets modal
    const searchModal = checkForSearchTicketsModal();
    
    if (searchModal) {
        console.log('MATTATO DEBUG: Search Tickets modal detected after', attempts + 1, 'attempts');
        showStatus('Search Tickets modal found!', 'success');
        
        try {
            verifySearchTicketsModal(searchModal);
        } catch (error) {
            console.error('MATTATO DEBUG: Error verifying search tickets modal:', error);
            showStatus('Error verifying search modal: ' + error.message, 'error');
        }
        return;
    }
    
    // If we haven't reached max attempts, try again
    if (attempts < maxAttempts - 1) {
        setTimeout(() => {
            waitForSearchTicketsModal(attempts + 1, maxAttempts, interval);
        }, interval);
    } else {
        console.log('MATTATO DEBUG: Max attempts reached, no search tickets modal detected');
        showStatus('Timeout: Search Tickets modal not found after 10 seconds', 'error');
        hideOverlay();
    }
}

function checkForSearchTicketsModal() {
    // Look for the search tickets modal structure
    const allModals = document.querySelectorAll('.cofx-view-content[aria-hidden="false"]');
    
    console.log('MATTATO DEBUG: Found', allModals.length, 'visible modal containers');
    
    for (const modal of allModals) {
        const tabText = modal.querySelector('.k-link')?.textContent?.trim();
        const codeInput = modal.querySelector('input[name="USR_Code"]');
        const executeButton = Array.from(modal.querySelectorAll('button')).find(btn => 
            btn.textContent.trim().includes('Execute action')
        );
        
        // Additional checks for search tickets modal
        const searchTicketsHeader = modal.querySelector('h2 span') || modal.querySelector('[ng-bind*="Search tickets"]');
        const searchTicketsInContent = modal.textContent.toLowerCase().includes('search tickets');
        
        console.log('MATTATO DEBUG: Modal check:', {
            tabText,
            codeInput: !!codeInput,
            executeButton: !!executeButton,
            searchTicketsHeader: !!searchTicketsHeader,
            searchTicketsInContent,
            modalText: modal.textContent.substring(0, 100) + '...'
        });
        
        // Check if this is the search tickets modal
        const isSearchTicketsModal = (tabText === 'Search tickets') || 
                                   (codeInput && executeButton && searchTicketsInContent) ||
                                   (searchTicketsHeader && codeInput);
        
        if (isSearchTicketsModal) {
            console.log('MATTATO DEBUG: Found search tickets modal');
            return modal;
        }
    }
    
    // Also check for any modal with the specific form structure
    const searchModalByForm = document.querySelector('div[model-entity="USR_SearchTasksAction"]');
    if (searchModalByForm) {
        const parentModal = searchModalByForm.closest('.cofx-view-content');
        if (parentModal && window.getComputedStyle(parentModal).display !== 'none') {
            console.log('MATTATO DEBUG: Found search tickets modal by form structure');
            return parentModal;
        }
    }
    
    console.log('MATTATO DEBUG: No search tickets modal found');
    return null;
}

function verifySearchTicketsModal(searchModal) {
    console.log('MATTATO DEBUG: verifySearchTicketsModal started');
    
    try {
        const codeInput = searchModal.querySelector('input[name="USR_Code"]');
        const executeButton = Array.from(searchModal.querySelectorAll('button')).find(btn => 
            btn.textContent.trim().includes('Execute action')
        );
        
        console.log('MATTATO DEBUG: Search modal elements:', {
            codeInput: !!codeInput,
            executeButton: !!executeButton
        });
        
        if (codeInput && executeButton) {
            console.log('MATTATO DEBUG: ✅ Search Tickets modal successfully detected and verified!');
            showStatus('✅ That works! Search Tickets modal detected!', 'success');
            
            // Now fill the code input and execute the search
            setTimeout(() => {
                fillCodeAndExecuteSearch(searchModal, codeInput, executeButton);
            }, 1000);
            
        } else {
            console.log('MATTATO DEBUG: ❌ Search modal missing expected elements');
            showStatus('Search modal found but missing expected elements', 'error');
        }
        
    } catch (error) {
        console.error('MATTATO DEBUG: Error in search modal verification:', error);
        showStatus('Error verifying search modal: ' + error.message, 'error');
    }
    
    console.log('MATTATO DEBUG: verifySearchTicketsModal completed');
}

function fillCodeAndExecuteSearch(searchModal, codeInput, executeButton) {
    console.log('MATTATO DEBUG: fillCodeAndExecuteSearch started');
    
    try {
        // Get the project from the first session
        const projectText = getFirstSessionProject();
        
        if (!projectText) {
            showStatus('No project found in loaded sessions', 'error');
            return;
        }
        
        console.log('MATTATO DEBUG: Using project text:', projectText);
        console.log('MATTATO DEBUG: Code input field found:', codeInput);
        console.log('MATTATO DEBUG: Execute button found:', executeButton);
        
        // Try simpler Angular-compatible form filling (Option 3)
        showStatus(`Trying to fill Code field with: ${projectText}`, 'info');
        
        try {
            console.log('MATTATO DEBUG: Using simpler approach - focus, set value, trigger events');
            
            // Simple approach: Focus + Set Value + Key Events
            codeInput.focus();
            codeInput.value = projectText;
            
            // Trigger the essential events Angular needs
            codeInput.dispatchEvent(new Event('input', { bubbles: true }));
            codeInput.dispatchEvent(new Event('blur', { bubbles: true }));
            codeInput.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Check if value was set successfully, then execute
            setTimeout(() => {
                const actualValue = codeInput.value;
                console.log('MATTATO DEBUG: Input value after filling:', actualValue);
                
                if (actualValue === projectText) {
                    showStatus('✅ Code field filled! Executing search...', 'success');
                    console.log('MATTATO DEBUG: ✅ Form filling successful, now clicking Execute');
                    
                    // Click Execute Action button
                    setTimeout(() => {
                        executeButton.click();
                        
                        // Wait and check for results
                        setTimeout(() => {
                            checkExecuteResults(searchModal);
                        }, 2000);
                        
                    }, 500);
                    
                } else {
                    showStatus(`⚠️ Value not set correctly. Expected: ${projectText}, Got: ${actualValue}`, 'error');
                    console.log('MATTATO DEBUG: ⚠️ Form filling failed, not executing');
                }
            }, 500);
            
        } catch (error) {
            console.error('MATTATO DEBUG: Error in safe form filling:', error);
            showStatus('Error filling form safely: ' + error.message, 'error');
        }
        
    } catch (error) {
        console.error('MATTATO DEBUG: Error filling code and executing search:', error);
        showStatus('Error executing search: ' + error.message, 'error');
    }
}

function getFirstSessionProject() {
    console.log('MATTATO DEBUG: getFirstSessionProject started');
    
    if (!loadedJSON || !loadedJSON.weekSessions) {
        console.log('MATTATO DEBUG: No loaded JSON or week sessions');
        return null;
    }
    
    const firstSession = loadedJSON.weekSessions[0];
    console.log('MATTATO DEBUG: First session:', firstSession);
    
    if (!firstSession) {
        console.log('MATTATO DEBUG: No first session found');
        return null;
    }
    
    // Look for project-related fields in the session
    const projectText = firstSession.project || 
                       firstSession.description || 
                       firstSession.title ||
                       firstSession.name ||
                       'Test Project'; // fallback
    
    console.log('MATTATO DEBUG: Extracted project text:', projectText);
    return projectText;
}

function fillTimesheetFields(timesheetModal) {
    console.log('MATTATO DEBUG: fillTimesheetFields started');
    showStatus('Filling remaining timesheet fields...', 'info');
    
    try {
        // Optionally disable interference before filling fields
        const disableInterference = true; // Set to false to skip disabling
        let originalValidation = null;
        
        if (disableInterference) {
            console.log('MATTATO DEBUG: Temporarily disabling validation interference');
            originalValidation = temporarilyDisableValidationInterference();
        }
        // Get session data for filling fields
        const firstSession = loadedJSON?.weekSessions?.[0];
        if (!firstSession) {
            showStatus('No session data available for filling fields', 'error');
            return;
        }
        
        console.log('MATTATO DEBUG: Using session for field filling:', firstSession);
        
        // 1. Fill Description field
        const descriptionField = timesheetModal.querySelector('textarea[name="APP_Description"]');
        if (descriptionField) {
            console.log('MATTATO DEBUG: Filling description field');
            descriptionField.focus();
            descriptionField.value = 'Refer to Ticket';
            descriptionField.dispatchEvent(new Event('input', { bubbles: true }));
            descriptionField.dispatchEvent(new Event('blur', { bubbles: true }));
            descriptionField.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            console.log('MATTATO DEBUG: Description field not found');
        }
        
        // 2. Fill Start Date field - focus on just this one field
        const startDateInput = timesheetModal.querySelector('input[placeholder="m/d/yyyy"]');
        console.log('MATTATO DEBUG: Start date input found:', !!startDateInput);
        console.log('MATTATO DEBUG: Start date input element:', startDateInput);
        
        if (startDateInput && firstSession.start_time) {
            console.log('MATTATO DEBUG: Attempting to fill start date field');
            const sessionDate = new Date(firstSession.start_time);
            const usFormattedDate = `${sessionDate.getMonth() + 1}/${sessionDate.getDate()}/${sessionDate.getFullYear()}`;
            console.log('MATTATO DEBUG: Date to fill:', usFormattedDate);
            console.log('MATTATO DEBUG: Current value:', startDateInput.value);
            
            // Try the simplest possible approach
            startDateInput.focus();
            console.log('MATTATO DEBUG: Field focused');
            
            // Just set the value directly
            startDateInput.value = usFormattedDate;
            console.log('MATTATO DEBUG: Value set, new value:', startDateInput.value);
            
            // Dispatch events
            startDateInput.dispatchEvent(new Event('input', { bubbles: true }));
            startDateInput.dispatchEvent(new Event('change', { bubbles: true }));
            startDateInput.blur();
            
            console.log('MATTATO DEBUG: Events dispatched, final value:', startDateInput.value);
            console.log('MATTATO DEBUG: Start date fill attempt completed');
        } else {
            console.log('MATTATO DEBUG: Start date field not found or no start_time');
            console.log('MATTATO DEBUG: startDateInput:', startDateInput);
            console.log('MATTATO DEBUG: firstSession.start_time:', firstSession.start_time);
        }
        
        // 3. Fill Start Time field - simulate the exact typing pattern you described
        const startTimeInput = timesheetModal.querySelector('input[id^="timepicker-"]');
        console.log('MATTATO DEBUG: Start time input found:', !!startTimeInput);
        console.log('MATTATO DEBUG: Start time input element:', startTimeInput);
        
        if (startTimeInput && firstSession.start_time) {
            console.log('MATTATO DEBUG: Attempting to fill start time field - checking for picker interference');
            const sessionDate = new Date(firstSession.start_time);
            // Format exactly as TimeCockpit expects: h:mm tt (no leading zero on hour)
            let hours = sessionDate.getHours();
            const minutes = sessionDate.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            if (hours === 0) hours = 12; // Convert 0 to 12 for 12-hour format
            const timeString = `${hours}:${minutes} ${ampm}`;
            console.log('MATTATO DEBUG: Time to fill:', timeString);
            console.log('MATTATO DEBUG: Current value:', startTimeInput.value);
            
            // Check if there's a time picker button that might interfere
            const timePickerButton = startTimeInput.parentElement?.querySelector('button[title*="Toggle time"], button[aria-label*="Toggle time"]');
            console.log('MATTATO DEBUG: Found time picker button:', !!timePickerButton);
            if (timePickerButton) {
                console.log('MATTATO DEBUG: Time picker button:', timePickerButton);
                // Make sure the dropdown is closed before we start
                const isExpanded = startTimeInput.getAttribute('aria-expanded') === 'true';
                console.log('MATTATO DEBUG: Picker is expanded:', isExpanded);
                if (isExpanded) {
                    console.log('MATTATO DEBUG: Closing time picker dropdown first');
                    timePickerButton.click();
                    
                    setTimeout(() => {
                        fillTimeAfterPickerClosed();
                    }, 200);
                    return;
                }
            }
            
            fillTimeAfterPickerClosed();
            
            function fillTimeAfterPickerClosed() {
                console.log('MATTATO DEBUG: Filling time (picker should be closed)');
                
                // Monitor for external value changes
                let valueChangeCount = 0;
                const originalValue = startTimeInput.value;
                const monitorInterval = setInterval(() => {
                    const currentValue = startTimeInput.value;
                    if (currentValue !== timeString && currentValue !== originalValue) {
                        valueChangeCount++;
                        console.log(`MATTATO DEBUG: External value change detected #${valueChangeCount}: "${currentValue}"`);
                        if (valueChangeCount > 5) {
                            clearInterval(monitorInterval);
                            console.log('MATTATO DEBUG: Too many external changes, stopping monitor');
                        }
                    }
                }, 50);
                
                // Stop monitoring after 5 seconds
                setTimeout(() => {
                    clearInterval(monitorInterval);
                    console.log('MATTATO DEBUG: Value monitoring stopped');
                }, 5000);
                
                startTimeInput.focus();
                console.log('MATTATO DEBUG: Field focused, current value:', startTimeInput.value);
                
                // Try to access the Kendo TimePicker widget directly
                let kendoSuccess = false;
                try {
                    // Try to access jQuery first
                    const $ = window.$ || window.jQuery;
                    if (!$) {
                        console.log('MATTATO DEBUG: jQuery not available');
                        throw new Error('jQuery not available');
                    }
                    
                    const kendoWidget = $(startTimeInput).data('kendoTimePicker');
                    if (kendoWidget) {
                        console.log('MATTATO DEBUG: Found Kendo TimePicker widget');
                        
                        // Create a proper Date object for the time
                        const sessionDate = new Date(firstSession.start_time);
                        const timeDate = new Date();
                        timeDate.setHours(sessionDate.getHours());
                        timeDate.setMinutes(sessionDate.getMinutes());
                        timeDate.setSeconds(0);
                        
                        console.log('MATTATO DEBUG: Setting Kendo widget value to:', timeDate);
                        kendoWidget.value(timeDate);
                        kendoSuccess = true;
                        
                        // Trigger the change event on the widget
                        kendoWidget.trigger('change');
                        console.log('MATTATO DEBUG: Kendo widget value set and change triggered');
                    } else {
                        console.log('MATTATO DEBUG: No Kendo TimePicker widget found');
                    }
                } catch (kendoError) {
                    console.log('MATTATO DEBUG: Error accessing Kendo widget:', kendoError);
                }
                
                // If Kendo approach didn't work, try DOM manipulation
                if (!kendoSuccess) {
                    console.log('MATTATO DEBUG: Falling back to DOM approach');
                    // Try a different approach - simulate user typing without triggering picker
                    startTimeInput.select(); // Select existing content
                    console.log('MATTATO DEBUG: Content selected, value:', startTimeInput.value);
                    
                    // Try to set the Angular model value directly first
                try {
                    if (typeof window.angular !== 'undefined') {
                        const angularElement = window.angular.element(startTimeInput);
                        const inputScope = angularElement.scope();
                        if (inputScope && inputScope.dataItems && inputScope.dataItems[0] && inputScope.dataItems[0].entity) {
                            console.log('MATTATO DEBUG: Found Angular scope, trying to set model directly');
                            // Try to set the model value directly
                            if (inputScope.dataItems[0].entity.APP_BeginTime !== undefined) {
                                const oldValue = inputScope.dataItems[0].entity.APP_BeginTime;
                                inputScope.dataItems[0].entity.APP_BeginTime = timeString;
                                console.log(`MATTATO DEBUG: Set Angular model APP_BeginTime: ${oldValue} -> ${timeString}`);
                                
                                // Trigger Angular digest
                                try {
                                    inputScope.$apply();
                                    console.log('MATTATO DEBUG: Angular digest triggered');
                                } catch (e) {
                                    console.log('MATTATO DEBUG: Angular digest already in progress');
                                }
                            }
                        } else {
                            console.log('MATTATO DEBUG: Angular scope or dataItems not found');
                        }
                    } else {
                        console.log('MATTATO DEBUG: Angular not available in global scope');
                    }
                } catch (angularError) {
                    console.log('MATTATO DEBUG: Error accessing Angular:', angularError);
                }
                
                // Try character-by-character simulation approach
                console.log('MATTATO DEBUG: Attempting character-by-character input simulation');
                
                // Clear the field first
                startTimeInput.value = '';
                startTimeInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Type each character with delays
                const typeCharacter = (char, index) => {
                    setTimeout(() => {
                        startTimeInput.value += char;
                        console.log(`MATTATO DEBUG: Typed character '${char}', current value: "${startTimeInput.value}"`);
                        
                        // Dispatch input event after each character
                        const inputEvent = new InputEvent('input', { 
                            bubbles: true, 
                            inputType: 'insertText',
                            data: char 
                        });
                        startTimeInput.dispatchEvent(inputEvent);
                        
                        // If this is the last character, finish up
                        if (index === timeString.length - 1) {
                            setTimeout(() => {
                                console.log('MATTATO DEBUG: Finished typing, final value:', startTimeInput.value);
                                startTimeInput.dispatchEvent(new Event('change', { bubbles: true }));
                                startTimeInput.blur();
                            }, 50);
                        }
                    }, index * 100); // 100ms delay between characters
                };
                
                // Type each character
                for (let i = 0; i < timeString.length; i++) {
                    typeCharacter(timeString[i], i);
                }
                
                // Also try the normal approach as fallback
                setTimeout(() => {
                    if (startTimeInput.value !== timeString) {
                        console.log('MATTATO DEBUG: Character typing failed, trying direct assignment');
                        startTimeInput.value = timeString;
                        console.log('MATTATO DEBUG: Value set immediately after assignment:', startTimeInput.value);
                    }
                }, (timeString.length * 100) + 200);
                
                // Check if value stuck immediately
                setTimeout(() => {
                    console.log('MATTATO DEBUG: Value after 10ms:', startTimeInput.value);
                }, 10);
                
                // Only dispatch essential events - avoid events that might trigger picker
                const inputEvent = new Event('input', { bubbles: true });
                inputEvent.inputType = 'insertText';
                startTimeInput.dispatchEvent(inputEvent);
                console.log('MATTATO DEBUG: Value after input event:', startTimeInput.value);
                
                // Wait before final change event to let Kendo process
                setTimeout(() => {
                    console.log('MATTATO DEBUG: Value before change event:', startTimeInput.value);
                    startTimeInput.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('MATTATO DEBUG: Value after change event:', startTimeInput.value);
                    
                    startTimeInput.blur();
                    console.log('MATTATO DEBUG: Value after blur:', startTimeInput.value);
                    
                    // Final check after all events
                    setTimeout(() => {
                        console.log('MATTATO DEBUG: Final value after all processing:', startTimeInput.value);
                        console.log('MATTATO DEBUG: Start time fill attempt completed');
                    }, 50);
                }, 100);
                } // Close the if (!kendoSuccess) block
            }
        } else {
            console.log('MATTATO DEBUG: Start time field not found or no start_time');
            console.log('MATTATO DEBUG: startTimeInput:', startTimeInput);
            console.log('MATTATO DEBUG: firstSession.start_time:', firstSession.start_time);
        }
        
        // TEMPORARILY DISABLED - focusing on date and start time only
        /*
        // 4. Fill End Date field (try to find second date picker)
        // 5. Fill End Time field (second time picker)
        */
        console.log('MATTATO DEBUG: End date and end time temporarily disabled - focusing on start date and start time only');
        
        // Verify fields were actually filled before claiming success
        setTimeout(() => {
            let success = true;
            let failedFields = [];
            
            // Check if start date was actually filled
            const startDateCheck = timesheetModal.querySelector('input[placeholder="m/d/yyyy"]');
            if (startDateCheck && firstSession.start_time) {
            const expectedDate = `${new Date(firstSession.start_time).getMonth() + 1}/${new Date(firstSession.start_time).getDate()}/${new Date(firstSession.start_time).getFullYear()}`;
            if (startDateCheck.value !== expectedDate) {
                success = false;
                failedFields.push(`Start date (expected: ${expectedDate}, actual: ${startDateCheck.value})`);
            }
        }
        
        // Check if start time was actually filled
        const startTimeCheck = timesheetModal.querySelector('input[id^="timepicker-"]');
        if (startTimeCheck && firstSession.start_time) {
            const sessionDate = new Date(firstSession.start_time);
            // Format exactly as TimeCockpit expects: h:mm tt (no leading zero on hour)
            let hours = sessionDate.getHours();
            const minutes = sessionDate.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            if (hours === 0) hours = 12; // Convert 0 to 12 for 12-hour format
            const expectedTime = `${hours}:${minutes} ${ampm}`;
            if (startTimeCheck.value !== expectedTime) {
                success = false;
                failedFields.push(`Start time (expected: ${expectedTime}, actual: ${startTimeCheck.value})`);
            }
        }
        
        // Report results based on actual field values
        if (success) {
            showStatus('✅ All timesheet fields filled successfully!', 'success');
            hideOverlay();
            
            setTimeout(() => {
                showStatus('Import complete! Review and save the timesheet entry.', 'success');
            }, 2000);
        } else {
            console.log('MATTATO DEBUG: Field verification failed:', failedFields);
            showStatus('❌ Field filling failed: ' + failedFields.join(', '), 'error');
            hideOverlay();
        }
        
        // Restore validation interference after field verification
        if (typeof disableInterference !== 'undefined' && disableInterference && originalValidation) {
            setTimeout(() => {
                restoreValidationInterference(originalValidation);
            }, 3000); // Restore after a delay to let our changes settle
        }
    }, 2000); // Wait longer to let the field filling complete
        
    } catch (error) {
        console.error('MATTATO DEBUG: Error filling timesheet fields:', error);
        showStatus('Error filling timesheet fields: ' + error.message, 'error');
        hideOverlay();
        
        // Restore validation interference even on error
        if (typeof disableInterference !== 'undefined' && disableInterference && originalValidation) {
            restoreValidationInterference(originalValidation);
        }
    }
}

function checkExecuteResults(searchModal) {
    console.log('MATTATO DEBUG: checkExecuteResults started');
    
    try {
        // First check if we can find the search modal in the current DOM
        const currentSearchModal = checkForSearchTicketsModal();
        
        // Check if search modal is still visible
        const searchModalStillVisible = currentSearchModal && 
            window.getComputedStyle(currentSearchModal).display !== 'none' &&
            currentSearchModal.getAttribute('aria-hidden') !== 'true';
            
        console.log('MATTATO DEBUG: Current search modal found:', !!currentSearchModal);
        console.log('MATTATO DEBUG: Search modal still visible:', searchModalStillVisible);
        
        if (searchModalStillVisible) {
            // Look for Action Result box (project not found) - but be more specific
            const actionResultSelectors = [
                '[class*="action-result"]',
                '.cofx-action-result',
                '.alert-danger',
                '.error-message'
            ];
            
            let actionResult = null;
            for (const selector of actionResultSelectors) {
                actionResult = currentSearchModal.querySelector(selector);
                if (actionResult) {
                    console.log('MATTATO DEBUG: Found action result element:', selector, actionResult);
                    break;
                }
            }
            
            // Check for specific error messages, but ignore validation errors
            const modalText = currentSearchModal.textContent.toLowerCase();
            const hasSpecificError = modalText.includes('no tickets found') || 
                                   modalText.includes('not found') ||
                                   modalText.includes('no results found');
            
            // Don't count form validation errors as search errors
            const isJustValidationError = modalText.includes('mandatory field') ||
                                        modalText.includes('required field');
            
            console.log('MATTATO DEBUG: Action result element found:', !!actionResult);
            console.log('MATTATO DEBUG: Specific error text found:', hasSpecificError);
            console.log('MATTATO DEBUG: Is just validation error:', isJustValidationError);
            
            if (actionResult && !isJustValidationError && hasSpecificError) {
                console.log('MATTATO DEBUG: ❌ Import failed - Project not found as ticket');
                showStatus('❌ Import failed: Project not found as ticket', 'error');
                
                setTimeout(() => {
                    showStatus('The project from your session does not exist as a ticket in TimeCockpit', 'error');
                }, 2000);
                
            } else {
                console.log('MATTATO DEBUG: ⏳ Search still processing or completed successfully...');
                showStatus('Checking search results...', 'info');
                
                // Check again after a shorter interval
                setTimeout(() => {
                    checkExecuteResults(searchModal);
                }, 1000);
            }
        } else {
            // Search modal closed - SUCCESS! Back to timesheet modal with populated tickets
            console.log('MATTATO DEBUG: ✅ SUCCESS! Search modal closed - tickets should be populated');
            
            const timesheetModal = checkForTimesheetModal();
            if (timesheetModal) {
                showStatus('✅ SUCCESS! Tickets found and populated!', 'success');
                console.log('MATTATO DEBUG: ✅ Complete success: Project found, tickets populated, back to timesheet');
                
                // Now fill the remaining timesheet fields
                setTimeout(() => {
                    fillTimesheetFields(timesheetModal);
                }, 1000);
            } else {
                showStatus('✅ Search completed but checking timesheet modal...', 'info');
                
                // Give timesheet modal a moment to reappear
                setTimeout(() => {
                    const timesheetModalRetry = checkForTimesheetModal();
                    if (timesheetModalRetry) {
                        showStatus('✅ SUCCESS! Back to timesheet with populated tickets!', 'success');
                    } else {
                        showStatus('⚠️ Search completed but timesheet modal not visible', 'error');
                    }
                }, 1000);
            }
        }
        
    } catch (error) {
        console.error('MATTATO DEBUG: Error checking execute results:', error);
        showStatus('Error checking results: ' + error.message, 'error');
    }
}

function temporarilyDisableValidationInterference() {
    console.log('MATTATO DEBUG: Attempting to disable validation interference');
    const disabledItems = [];
    
    try {
        // 1. Disable Kendo TimePicker validation events
        const timePickerInputs = document.querySelectorAll('input[id^="timepicker-"]');
        timePickerInputs.forEach(input => {
            console.log('MATTATO DEBUG: Found TimePicker input:', input.id);
            
            // Store original event listeners (if we can access them)
            const kendoWidget = input.kendoTimePicker;
            if (kendoWidget) {
                console.log('MATTATO DEBUG: Found Kendo TimePicker widget');
                disabledItems.push({
                    type: 'kendoWidget',
                    element: input,
                    widget: kendoWidget,
                    originalOptions: kendoWidget.options
                });
                
                // Temporarily disable validation
                try {
                    if (kendoWidget.options.change) {
                        kendoWidget.options._originalChange = kendoWidget.options.change;
                        kendoWidget.options.change = function() { console.log('MATTATO DEBUG: Kendo change event suppressed'); };
                    }
                } catch (e) {
                    console.log('MATTATO DEBUG: Could not disable Kendo change event:', e);
                }
            }
            
            // Also try to disable Angular validation
            const angularScope = angular.element(input).scope();
            if (angularScope && angularScope.validator) {
                console.log('MATTATO DEBUG: Found Angular validator scope');
                disabledItems.push({
                    type: 'angularValidator',
                    element: input,
                    scope: angularScope,
                    originalValidator: angularScope.validator
                });
                
                // Temporarily disable validator
                try {
                    angularScope.validator._originalValidateElement = angularScope.validator.validateElement;
                    angularScope.validator.validateElement = function() { return true; };
                } catch (e) {
                    console.log('MATTATO DEBUG: Could not disable Angular validator:', e);
                }
            }
        });
        
        // 2. Remove time properties from validation manager ignore list
        try {
            const modalElement = document.querySelector('.cofx-view-content[aria-hidden="false"]');
            const modalScope = modalElement && typeof window.angular !== 'undefined' ? 
                window.angular.element(modalElement).scope() : null;
        if (modalScope && modalScope.ignoreUpdatedPropertiesFromValidationManager) {
            console.log('MATTATO DEBUG: Found validation manager ignore list:', modalScope.ignoreUpdatedPropertiesFromValidationManager);
            
            const timeProperties = ['APP_BeginTime', 'APP_EndTime', 'APP_BeginTimeActual', 'APP_EndTimeActual'];
            const removedProperties = [];
            
            timeProperties.forEach(prop => {
                const index = modalScope.ignoreUpdatedPropertiesFromValidationManager.indexOf(prop);
                if (index >= 0) {
                    modalScope.ignoreUpdatedPropertiesFromValidationManager.splice(index, 1);
                    removedProperties.push(prop);
                    console.log(`MATTATO DEBUG: Removed ${prop} from ignore list`);
                }
            });
            
            if (removedProperties.length > 0) {
                disabledItems.push({
                    type: 'validationIgnoreList',
                    scope: modalScope,
                    removedProperties: removedProperties
                });
                console.log('MATTATO DEBUG: Removed time properties from validation ignore list:', removedProperties);
            }
        }
        } catch (angularScopeError) {
            console.log('MATTATO DEBUG: Error accessing Angular modal scope:', angularScopeError);
        }
        
        // 3. Disable general form validation temporarily
        const formValidators = document.querySelectorAll('.cofx-form-wrapper [data-kendo-validator]');
        formValidators.forEach(validator => {
            console.log('MATTATO DEBUG: Found form validator');
            disabledItems.push({
                type: 'formValidator',
                element: validator
            });
        });
        
        console.log('MATTATO DEBUG: Disabled', disabledItems.length, 'validation items');
        
    } catch (error) {
        console.error('MATTATO DEBUG: Error disabling validation:', error);
    }
    
    return disabledItems;
}

function restoreValidationInterference(disabledItems) {
    if (!disabledItems) return;
    
    console.log('MATTATO DEBUG: Restoring validation interference');
    
    try {
        disabledItems.forEach(item => {
            switch (item.type) {
                case 'kendoWidget':
                    if (item.widget.options._originalChange) {
                        item.widget.options.change = item.widget.options._originalChange;
                        delete item.widget.options._originalChange;
                    }
                    break;
                    
                case 'angularValidator':
                    if (item.scope.validator._originalValidateElement) {
                        item.scope.validator.validateElement = item.scope.validator._originalValidateElement;
                        delete item.scope.validator._originalValidateElement;
                    }
                    break;
                    
                case 'validationIgnoreList':
                    // Restore removed properties back to ignore list
                    item.removedProperties.forEach(prop => {
                        if (item.scope.ignoreUpdatedPropertiesFromValidationManager.indexOf(prop) < 0) {
                            item.scope.ignoreUpdatedPropertiesFromValidationManager.push(prop);
                            console.log(`MATTATO DEBUG: Restored ${prop} to ignore list`);
                        }
                    });
                    break;
            }
        });
        
        console.log('MATTATO DEBUG: Restored', disabledItems.length, 'validation items');
        
    } catch (error) {
        console.error('MATTATO DEBUG: Error restoring validation:', error);
    }
}

// Message listener moved to top of file - this duplicate removed