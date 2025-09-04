// Mattato TimeCockpit Bridge - Content Script
console.log('Mattato TimeCockpit Bridge loaded');

let floatingWindow = null;
let currentWeek = null;
let isWindowDragging = false;
let dragOffset = { x: 0, y: 0 };
let loadedJSON = null;

// Initialize when page loads - use a delay to avoid interfering with page load
setTimeout(() => {
    try {
        if (window.location.href.includes('timecockpit.com')) {
            initializeExtension();
        }
    } catch (error) {
        console.warn('Mattato extension initialization failed:', error);
    }
}, 3000); // Wait 3 seconds after page load

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
                    updateWeekDisplay();
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
        z-index: 999999;
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
            ">↻ Reload</span>
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
                Detecting current week...
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
    const importBtn = floatingWindow.querySelector('#mattato-import-btn');
    const fileInput = floatingWindow.querySelector('#mattato-file-input');
    
    // Reload button
    reloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        updateWeekDisplay();
        showStatus('Week information reloaded', 'success');
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
    if (!floatingWindow) return;
    
    const weekDisplay = floatingWindow.querySelector('#mattato-week-display');
    const detectedWeek = findCurrentWeekDate();
    
    if (detectedWeek) {
        // Show window if week is found
        floatingWindow.style.display = 'block';
        currentWeek = detectedWeek;
        
        const weekInfo = parseWeekFromDate(detectedWeek);
        weekDisplay.textContent = `Current Week: ${weekInfo}`;
        weekDisplay.style.background = '#d4edda';
        weekDisplay.style.color = '#155724';
    } else {
        // Hide window if no week found (not on calendar page)
        floatingWindow.style.display = 'none';
        currentWeek = null;
    }
}

function findCurrentWeekDate() {
    // Look for the date span with class tc-calendar-selected-day
    const dateSpan = document.querySelector('.tc-calendar-selected-day');
    if (dateSpan) {
        return dateSpan.textContent.trim();
    }
    
    // Fallback: look in the header
    const header = document.querySelector('.tc-calendar-selected-day-header');
    if (header) {
        // Extract date pattern from header text
        const datePattern = /([A-Z][a-z]+day,\s+[A-Z][a-z]+\s+\d{1,2},\s+\d{4})/;
        const match = header.textContent.match(datePattern);
        if (match) {
            return match[1];
        }
    }
    
    return null;
}

function parseWeekFromDate(dateString) {
    try {
        // Parse "Wednesday, September 3, 2025" format
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString; // Fallback to original string
        }
        
        // Calculate week start (assuming Monday is first day of week)
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        const monday = new Date(date.setDate(diff));
        
        // Calculate week end (Sunday)
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        const formatOptions = { month: 'short', day: 'numeric' };
        const startStr = monday.toLocaleDateString('en-US', formatOptions);
        const endStr = sunday.toLocaleDateString('en-US', formatOptions);
        
        return `${startStr} - ${endStr}`;
    } catch (error) {
        console.warn('Error parsing date:', error);
        return dateString;
    }
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
    
    // Check if sessions match current week
    const weekSessions = filterSessionsForCurrentWeek(sessions);
    
    if (weekSessions.length === 0) {
        const currentWeekStr = parseWeekFromDate(currentWeek);
        showStatus(`No sessions found for current week (${currentWeekStr})`, 'error');
        return;
    }
    
    // Store loaded JSON and show confirmation
    loadedJSON = {
        originalData: jsonData,
        sessions: sessions,
        weekSessions: weekSessions
    };
    
    showImportConfirmation(weekSessions.length);
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

function filterSessionsForCurrentWeek(sessions) {
    if (!currentWeek) return [];
    
    try {
        // Parse current week date
        const currentDate = new Date(currentWeek);
        if (isNaN(currentDate.getTime())) return [];
        
        // Calculate current week range
        const day = currentDate.getDay();
        const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(currentDate.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        weekEnd.setHours(0, 0, 0, 0);
        
        return sessions.filter(session => {
            if (!session.start_time && !session.start_date) return false;
            
            // Try to parse session date (could be in various formats)
            const sessionDate = new Date(session.start_time || session.start_date);
            if (isNaN(sessionDate.getTime())) return false;
            
            return sessionDate >= weekStart && sessionDate < weekEnd;
        });
    } catch (error) {
        console.warn('Error filtering sessions for current week:', error);
        return [];
    }
}

function showImportConfirmation(sessionCount) {
    const content = floatingWindow.querySelector('#mattato-window-content');
    const currentWeekStr = parseWeekFromDate(currentWeek);
    
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
                <strong>${sessionCount}</strong> session(s) found for<br>
                <strong>${currentWeekStr}</strong>
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
    content.querySelector('#mattato-confirm-import').addEventListener('click', () => {
        // TODO: Implement actual import
        showStatus('Import functionality coming soon!', 'info');
        resetToInitialState();
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
            Detecting current week...
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

function showStatus(message, type = 'info') {
    const status = floatingWindow.querySelector('#mattato-status');
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
            if (status.style.display !== 'none') {
                status.style.display = 'none';
            }
        }, 5000);
    }
}

// Listen for messages from popup (keeping original functionality)
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Received message:', request);
    
    if (request.action === 'showWindow') {
        try {
            // Initialize extension if not already done
            if (!floatingWindow) {
                initializeExtension();
            }
            
            // Show the floating window
            if (floatingWindow) {
                floatingWindow.style.display = 'block';
                updateWeekDisplay();
                sendResponse({
                    success: true,
                    message: 'Import window shown'
                });
            } else {
                sendResponse({
                    success: false,
                    error: 'Failed to create floating window'
                });
            }
        } catch (error) {
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }
    
    if (request.action === 'getPageInfo') {
        sendResponse({
            title: document.title,
            url: window.location.href,
            isTimeCockpit: window.location.href.includes('timecockpit.com')
        });
    }
    
    return true;
});