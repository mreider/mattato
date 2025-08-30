import Foundation
import AppKit

class OutlookManager: NSObject, ObservableObject {
    static let shared = OutlookManager()
    
    override init() {
        super.init()
    }
    
    // MARK: - Public Interface
    
    func getOutlookAccounts() -> [String] {
        // For web-based approach, we don't need to detect accounts
        // The user will select their account through the web interface
        return ["Web-based (Login Required)"]
    }
    
    func checkWebOutlookAuthentication() -> (isLoggedIn: Bool, needsLogin: Bool, errorMessage: String?) {
        // For web-based approach, we assume user is logged in their browser
        // Authentication will be verified when we open the browser
        return (true, false, nil)
    }
    
    func isWebOutlookAvailable() -> Bool {
        // Web Outlook is always "available" if there's internet connectivity
        return true
    }
    
    func exportSessionsToOutlookWithUI(_ sessions: [Session]) -> (success: Bool, error: String?) {
        print("🔍 Starting web-based Outlook export...")
        print("📊 Total sessions provided: \(sessions.count)")
        
        // Filter completed sessions first
        let completedSessions = sessions.filter { $0.isCompleted }
        print("✅ Completed sessions: \(completedSessions.count)")
        
        if completedSessions.isEmpty {
            let message = "No completed sessions to export. You need to complete at least one Pomodoro session first."
            print("❌ \(message)")
            return (false, message)
        }
        
        // Export directly using browser automation
        return exportSessionsToOutlook(completedSessions)
    }
    
    func exportSessionsToOutlook(_ sessions: [Session]) -> (success: Bool, error: String?) {
        // Filter only completed sessions
        let completedSessions = sessions.filter { $0.isCompleted }
        
        guard !completedSessions.isEmpty else {
            return (false, "No completed sessions to export.")
        }
        
        // First, open Outlook in the default browser
        let browserResult = openOutlookInBrowser()
        if !browserResult {
            return (false, "Failed to open Outlook in browser. Please check your internet connection.")
        }
        
        // Give the browser time to load
        print("⏳ Waiting for Outlook to load in browser...")
        Thread.sleep(forTimeInterval: 3.0)
        
        // Create calendar events for each session using AppleScript automation
        var successCount = 0
        var lastError: String?
        
        for (index, session) in completedSessions.enumerated() {
            print("📅 Creating event \(index + 1) of \(completedSessions.count)...")
            
            let result = createWebOutlookEvent(for: session)
            if result.success {
                successCount += 1
                print("✅ Event created successfully")
            } else {
                lastError = result.error
                print("❌ Failed to create event: \(result.error ?? "Unknown error")")
                // Continue trying other sessions even if one fails
            }
            
            // Wait between events to allow the previous event to fully save
            // and avoid overwhelming the browser
            if index < completedSessions.count - 1 {
                print("⏳ Waiting before creating next event...")
                Thread.sleep(forTimeInterval: 8.0) // Longer wait to ensure save completes
            }
        }
        
        if successCount == 0 {
            return (false, lastError ?? "Failed to create any calendar events.")
        } else if successCount < completedSessions.count {
            return (true, "Created \(successCount) of \(completedSessions.count) calendar events. Some events may have failed.")
        } else {
            return (true, nil)
        }
    }
    
    // MARK: - Private Implementation
    
    private func openOutlookInBrowser() -> Bool {
        print("🦁 Opening Outlook calendar in Safari...")
        
        let appleScript = """
        tell application "Safari"
            activate
            open location "https://outlook.office.com/calendar/view/workweek"
        end tell
        """
        
        let script = NSAppleScript(source: appleScript)
        var errorDict: NSDictionary?
        
        guard script?.executeAndReturnError(&errorDict) != nil else {
            if let error = errorDict {
                let errorMessage = error[NSAppleScript.errorMessage] as? String ?? "Unknown error"
                print("❌ Failed to open Safari: \(errorMessage)")
            }
            return false
        }
        
        print("✅ Successfully opened Outlook in Safari")
        return true
    }
    
    private func createWebOutlookEvent(for session: Session) -> (success: Bool, error: String?) {
        guard let endTime = session.endTime else {
            return (false, "Session has no end time")
        }
        
        // Validate that start time is before end time
        guard session.startTime < endTime else {
            return (false, "Invalid session: start time must be before end time")
        }
        
        let title = session.description.isEmpty ? "Pomodoro Session" : session.description
        let description = "Created by Mattato Pomodoro Timer\nSession ID: \(session.id)"
        
        // Use AppleScript automation to create the event
        return createEventViaAppleScript(
            title: title,
            startTime: session.startTime,
            endTime: endTime,
            description: description
        )
    }
    
    private func createEventViaAppleScript(title: String, startTime: Date, endTime: Date, description: String) -> (success: Bool, error: String?) {
        print("🤖 Creating Outlook event via AppleScript automation...")
        print("📅 Event: \(title)")
        print("⏰ Time: \(formatDateForDisplay(startTime)) to \(formatDateForDisplay(endTime))")
        
        // Format dates for the AppleScript
        let startTimeFormatted = formatTimeForAppleScript(startTime)
        let endTimeFormatted = formatTimeForAppleScript(endTime)
        let dateFormatted = formatDateForAppleScript(startTime)
        
        // Detect which browser is being used and create appropriate AppleScript
        let browserResult = detectBrowserAndCreateEvent(
            title: title,
            date: dateFormatted,
            startTime: startTimeFormatted,
            endTime: endTimeFormatted,
            description: description
        )
        
        return browserResult
    }
    
    private func detectBrowserAndCreateEvent(title: String, date: String, startTime: String, endTime: String, description: String) -> (success: Bool, error: String?) {
        print("🦁 Using Safari for Outlook automation...")
        
        // Use Safari exclusively since it's standard on every Mac
        if let safariResult = tryCreateEventInSafari(title: title, date: date, startTime: startTime, endTime: endTime, description: description) {
            return safariResult
        }
        
        return (false, """
        To use Outlook export, please set up Safari:
        
        1. Open Safari → Settings → Advanced
        2. Check "Show Develop menu in menu bar"
        3. Go to Develop menu → "Allow JavaScript from Apple Events"
        4. Make sure you're logged into outlook.office.com in Safari
        5. Keep the Outlook calendar tab open
        
        Then try the export again.
        """)
    }
    
    private func tryCreateEventInSafari(title: String, date: String, startTime: String, endTime: String, description: String) -> (success: Bool, error: String?)? {
        print("🦁 Trying Safari automation...")
        
        // Escape the title and description for JavaScript
        let escapedTitle = title.replacingOccurrences(of: "'", with: "\\'").replacingOccurrences(of: "\"", with: "\\\"")
        let escapedDescription = description.replacingOccurrences(of: "'", with: "\\'").replacingOccurrences(of: "\"", with: "\\\"").replacingOccurrences(of: "\n", with: "<br>")
        
        let appleScript = """
        tell application "Safari"
            if not (exists window 1) then
                return "No Safari windows open"
            end if
            
            set outlookTab to missing value
            repeat with w in windows
                repeat with t in tabs of w
                    if URL of t contains "outlook.office.com" then
                        set outlookTab to t
                        exit repeat
                    end if
                end repeat
                if outlookTab is not missing value then exit repeat
            end repeat
            
            if outlookTab is missing value then
                return "No Outlook tab found in Safari"
            end if
            
            set current tab of window 1 to outlookTab
            
            -- Click New Event button
            do JavaScript "
                // Find and click New Event button
                const newEventSelectors = [
                    '[data-testid=\\"new-event-button\\"]',
                    '.ms-Button[aria-label*=\\"New event\\"]',
                    'button[title*=\\"New event\\"]',
                    'button[aria-label*=\\"New event\\"]'
                ];
                
                let newEventButton = null;
                for (const selector of newEventSelectors) {
                    newEventButton = document.querySelector(selector);
                    if (newEventButton) break;
                }
                
                if (newEventButton) {
                    newEventButton.click();
                    'clicked_new_event';
                } else {
                    'new_event_button_not_found';
                }
            " in outlookTab
            
            delay 3
            
            -- Fill in event details and save
            do JavaScript "
                // Fill title
                const titleSelectors = [
                    'input[placeholder*=\\"Add a title\\"]',
                    'input[aria-label*=\\"title\\"]',
                    '.ms-TextField-field[placeholder*=\\"title\\"]'
                ];
                
                let titleField = null;
                for (const selector of titleSelectors) {
                    titleField = document.querySelector(selector);
                    if (titleField) break;
                }
                
                if (titleField) {
                    titleField.focus();
                    titleField.value = '\(escapedTitle)';
                    titleField.dispatchEvent(new Event('input', { bubbles: true }));
                    titleField.dispatchEvent(new Event('change', { bubbles: true }));
                }
                
                // Fill description
                setTimeout(() => {
                    const descriptionSelectors = [
                        'div[role=\\"textbox\\"]',
                        'textarea[placeholder*=\\"insert\\"]',
                        '.ms-TextField-field[aria-label*=\\"description\\"]'
                    ];
                    
                    let descriptionField = null;
                    for (const selector of descriptionSelectors) {
                        descriptionField = document.querySelector(selector);
                        if (descriptionField && descriptionField.offsetHeight > 50) break;
                    }
                    
                    if (descriptionField) {
                        descriptionField.focus();
                        descriptionField.innerHTML = '\(escapedDescription)';
                        descriptionField.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }, 1000);
                
                // Save the event with more comprehensive selectors
                setTimeout(() => {
                    const saveSelectors = [
                        'button[aria-label*=\\"Save\\"]',
                        'button[title*=\\"Save\\"]',
                        '.ms-Button[title*=\\"Save\\"]',
                        'button[data-testid=\\"save-event\\"]',
                        'button:contains(\\"Save\\")',
                        '.ms-Button--primary',
                        'button[type=\\"submit\\"]',
                        'button.ms-Button--primary'
                    ];
                    
                    let saveButton = null;
                    for (const selector of saveSelectors) {
                        try {
                            if (selector.includes('contains')) {
                                // Handle :contains selector differently
                                const buttons = document.querySelectorAll('button');
                                for (const btn of buttons) {
                                    if (btn.textContent && btn.textContent.toLowerCase().includes('save')) {
                                        saveButton = btn;
                                        break;
                                    }
                                }
                            } else {
                                saveButton = document.querySelector(selector);
                            }
                            if (saveButton) break;
                        } catch (e) {
                            continue;
                        }
                    }
                    
                    if (saveButton) {
                        console.log('Found save button:', saveButton);
                        saveButton.click();
                        
                        // Wait for save to complete by checking if dialog closes
                        setTimeout(() => {
                            const eventDialog = document.querySelector('[role=\\"dialog\\"], .ms-Dialog, .ms-Panel');
                            if (!eventDialog || eventDialog.style.display === 'none') {
                                console.log('Event saved successfully');
                                return 'event_saved';
                            } else {
                                console.log('Event dialog still open, save may have failed');
                                return 'save_uncertain';
                            }
                        }, 2000);
                        
                        return 'save_clicked';
                    } else {
                        console.log('Save button not found');
                        return 'save_button_not_found';
                    }
                }, 3000);
                
                return 'event_automation_started';
            " in outlookTab
            
            return "success"
        end tell
        """
        
        return executeAppleScript(appleScript)
    }
    
    
    private func executeAppleScript(_ script: String) -> (success: Bool, error: String?)? {
        let appleScript = NSAppleScript(source: script)
        var errorDict: NSDictionary?
        
        guard let result = appleScript?.executeAndReturnError(&errorDict) else {
            if let error = errorDict {
                let errorMessage = error[NSAppleScript.errorMessage] as? String ?? "Unknown AppleScript error"
                print("❌ AppleScript error: \(errorMessage)")
                
                // If the error indicates the browser isn't available, return nil to try next browser
                if errorMessage.contains("not running") || errorMessage.contains("No") {
                    return nil
                }
                
                return (false, errorMessage)
            }
            return nil
        }
        
        let resultString = result.stringValue ?? ""
        print("📝 AppleScript result: \(resultString)")
        
        if resultString.contains("success") {
            return (true, nil)
        } else if resultString.contains("not_found") || resultString.contains("No") {
            return nil // Try next browser
        } else {
            return (false, resultString)
        }
    }
    
    // MARK: - Date Formatting
    
    private func formatDateForDisplay(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
    
    private func formatTimeForAppleScript(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }
    
    private func formatDateForAppleScript(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MM/dd/yyyy"
        return formatter.string(from: date)
    }
}
