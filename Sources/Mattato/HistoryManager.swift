import Foundation
import AppKit

class HistoryManager: ObservableObject {
    static let shared = HistoryManager()
    
    @Published var sessions: [Session] = []
    @Published var preferences: UserPreferences = UserPreferences.shared
    
    private let sessionsURL: URL
    private let preferencesURL: URL
    private let historyURL: URL
    private var sessionCounter: Int = 1
    
    // Background queue for file operations to prevent main thread blocking
    private let fileQueue = DispatchQueue(label: "com.mattato.fileoperations", qos: .utility)
    private var pendingSave = false
    
    private var isHistoryFileOpen = false
    private var historyUpdateTimer: Timer?
    private var pendingHistoryUpdate = false
    
    private var fileMonitorSource: DispatchSourceFileSystemObject?
    private var lastHistoryFileModification: Date = Date.distantPast
    
    private init() {
        let appSupportPath = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let appSupportDirectory = appSupportPath.appendingPathComponent("Mattato")
        
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let documentsDirectory = documentsPath.appendingPathComponent("Mattato")
        
        try? FileManager.default.createDirectory(at: appSupportDirectory, withIntermediateDirectories: true)
        try? FileManager.default.createDirectory(at: documentsDirectory, withIntermediateDirectories: true)
        
        sessionsURL = appSupportDirectory.appendingPathComponent("sessions.json")
        preferencesURL = appSupportDirectory.appendingPathComponent("preferences.json")
        
        historyURL = documentsDirectory.appendingPathComponent("history.md")
        
        loadData()
        updateSessionCounter()
        setupFileMonitoring()
    }
    
    deinit {
        stopFileMonitoring()
    }
    
    // MARK: - File Monitoring
    
    private func setupFileMonitoring() {
        startFileMonitoring()
    }
    
    private func startFileMonitoring() {
        stopFileMonitoring()
        
        if !FileManager.default.fileExists(atPath: historyURL.path) {
            _ = createOrUpdateHistoryFile()
        }
        
        let fileDescriptor = open(historyURL.path, O_EVTONLY)
        guard fileDescriptor != -1 else {
            print("Failed to open history file for monitoring")
            return
        }
        
        fileMonitorSource = DispatchSource.makeFileSystemObjectSource(
            fileDescriptor: fileDescriptor,
            eventMask: .write,
            queue: fileQueue
        )
        
        fileMonitorSource?.setEventHandler { [weak self] in
            self?.handleHistoryFileChanged()
        }
        
        fileMonitorSource?.setCancelHandler {
            close(fileDescriptor)
        }
        
        fileMonitorSource?.resume()
        print("Started monitoring history file for changes")
    }
    
    private func stopFileMonitoring() {
        fileMonitorSource?.cancel()
        fileMonitorSource = nil
    }
    
    private func handleHistoryFileChanged() {
        guard let attributes = try? FileManager.default.attributesOfItem(atPath: historyURL.path),
              let modificationDate = attributes[.modificationDate] as? Date else {
            return
        }
        
        if modificationDate > lastHistoryFileModification.addingTimeInterval(1.0) {
            lastHistoryFileModification = modificationDate
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
                self?.reloadSessionsFromHistoryFile()
            }
        }
    }
    
    private func reloadSessionsFromHistoryFile() {
        print("History file was externally modified - reloading sessions")
        
        guard FileManager.default.fileExists(atPath: historyURL.path),
              let content = try? String(contentsOf: historyURL) else {
            print("Failed to read history file for reload")
            return
        }
        
        let updatedSessions = parseHistoryFileContent(content)
        
        if !sessionsEqual(sessions, updatedSessions) {
            DispatchQueue.main.async {
                self.sessions = updatedSessions
                self.saveSessions() // Keep JSON in sync
                print("Sessions updated from history file changes")
            }
        }
    }
    
    private func sessionsEqual(_ sessions1: [Session], _ sessions2: [Session]) -> Bool {
        guard sessions1.count == sessions2.count else { return false }
        return zip(sessions1, sessions2).allSatisfy { session1, session2 in
            session1.id == session2.id &&
            session1.description == session2.description &&
            session1.startTime == session2.startTime &&
            session1.endTime == session2.endTime &&
            session1.isCompleted == session2.isCompleted
        }
    }
    
    private func parseHistoryFileContent(_ content: String) -> [Session] {
        var parsedSessions: [Session] = []
        let lines = content.components(separatedBy: .newlines)
        
        
        for line in lines {
            if line.hasPrefix("- **") {
                if let session = parseSessionLine(line) {
                    parsedSessions.append(session)
                }
            }
        }
        
        return parsedSessions.sorted { $0.startTime > $1.startTime }
    }
    
    
    func generateSessionId() -> String {
        defer { sessionCounter += 1 }
        return String(format: "%05d", sessionCounter)
    }
    
    private func updateSessionCounter() {
        let maxId = sessions.compactMap { Int($0.id) }.max() ?? 0
        sessionCounter = maxId + 1
    }
    
    func updateSession(_ updatedSession: Session) {
        fileQueue.async { [weak self] in
            guard let self = self else { return }
            
            self.createSessionsBackup()
            
            DispatchQueue.main.async {
                if let index = self.sessions.firstIndex(where: { $0.id == updatedSession.id }) {
                    self.sessions[index] = updatedSession
                }
            }
            
                self.saveSessionsAtomically()
            
            // Update history file if it's being viewed
            DispatchQueue.main.async {
                if self.isHistoryFileOpen {
                    self.updateHistoryFileIfNeeded()
                }
            }
        }
    }
    
    func completeSessionById(_ sessionId: String) {
        if let index = sessions.firstIndex(where: { $0.id == sessionId }) {
            sessions[index].endTime = Date()
            sessions[index].sessionState = .completed
            
            saveSessionsAsync()
            
            updateHistoryFileAlways()
        }
    }
    
    func pauseSessionById(_ sessionId: String) {
        if let index = sessions.firstIndex(where: { $0.id == sessionId }) {
            sessions[index].endTime = Date()
            sessions[index].sessionState = .paused
            
            saveSessionsAsync()
            
            // Update history file if it's being viewed
            if isHistoryFileOpen {
                updateHistoryFileIfNeeded()
            }
        }
    }

    func resumeSessionById(_ sessionId: String) {
        if let pausedIndex = sessions.firstIndex(where: { $0.id == sessionId && $0.sessionState == .paused }) {
            let pausedSession = sessions[pausedIndex]
            
            let newSession = Session(id: generateSessionId(), description: pausedSession.description, plannedDuration: pausedSession.plannedDuration)
            
            sessions.append(newSession)
            
            saveSessionsAsync()
            
            // Update history file if it's being viewed
            if isHistoryFileOpen {
                updateHistoryFileIfNeeded()
            }
        }
    }
    
    // New method to ensure only one running session exists
    func endAllRunningSessions() {
        let now = Date()
        var hasChanges = false
        
        for index in sessions.indices {
            if sessions[index].sessionState == .started && sessions[index].endTime == nil {
                sessions[index].endTime = now
                sessions[index].sessionState = .completed
                hasChanges = true
            }
        }
        
        if hasChanges {
            saveSessionsAsync()
            
            // Update history file if it's being viewed
            if isHistoryFileOpen {
                updateHistoryFileIfNeeded()
            }
        }
    }
    
    // Synchronous version for reset operations to prevent race conditions
    func endAllRunningSessionsSync() {
        let now = Date()
        var hasChanges = false
        
        for index in sessions.indices {
            if sessions[index].sessionState == .started && sessions[index].endTime == nil {
                sessions[index].endTime = now
                sessions[index].sessionState = .completed
                hasChanges = true
            }
        }
        
        if hasChanges {
                saveSessions()
            
            // Update history file if it's being viewed
            if isHistoryFileOpen {
                updateHistoryFileIfNeeded()
            }
        }
    }
    
    func removeSession(id: String) {
        sessions.removeAll { $0.id == id }
        saveSessions()
    }
    
    func addSession(_ session: Session) {
        sessions.append(session)
        saveSessionsAsync()
    }
    
    func clearHistory() {
        sessions.removeAll()
        saveSessions()
    }
    
    func updatePreferences(_ newPreferences: UserPreferences) {
        preferences = newPreferences
        savePreferences()
    }
    
    private func loadData() {
        loadSessions()
        loadPreferences()
    }
    
    private func loadSessions() {
        guard let data = try? Data(contentsOf: sessionsURL) else { return }
        
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .custom { decoder in
                let container = try decoder.singleValueContainer()
                let dateString = try container.decode(String.self)
                
                if let date = self.parseDateFromString(dateString) {
                    return date
                }
                
                throw DecodingError.dataCorruptedError(in: container, debugDescription: "Could not parse ISO 8601 date: \(dateString)")
            }
            sessions = try decoder.decode([Session].self, from: data)
        } catch {
            print("Error loading sessions: \(error)")
        }
    }
    
    private func saveSessions() {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .custom { date, encoder in
                let isoFormatter = ISO8601DateFormatter()
                isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                let dateString = isoFormatter.string(from: date)
                var container = encoder.singleValueContainer()
                try container.encode(dateString)
            }
            let data = try encoder.encode(sessions)
            try data.write(to: sessionsURL)
        } catch {
            print("Error saving sessions: \(error)")
        }
    }
    
private func saveSessionsAsync() {
    // Prevent multiple concurrent saves
    guard !pendingSave else { return }
    pendingSave = true
    
    // Capture current sessions state for background saving
    let currentSessions = sessions
    
    fileQueue.async { [sessionsURL] in
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .custom { date, encoder in
                let isoFormatter = ISO8601DateFormatter()
                isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                let dateString = isoFormatter.string(from: date)
                var container = encoder.singleValueContainer()
                try container.encode(dateString)
            }
            let data = try encoder.encode(currentSessions)
            try data.write(to: sessionsURL)
        } catch {
            print("Error saving sessions asynchronously: \(error)")
        }
        
        // Reset pending save flag on main queue
        DispatchQueue.main.async { [weak self] in
            self?.pendingSave = false
        }
    }
}
    
    private func loadPreferences() {
        guard let data = try? Data(contentsOf: preferencesURL) else { return }
        
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .custom { decoder in
                let container = try decoder.singleValueContainer()
                let dateString = try container.decode(String.self)
                
                if let date = self.parseDateFromString(dateString) {
                    return date
                }
                
                throw DecodingError.dataCorruptedError(in: container, debugDescription: "Could not parse ISO 8601 date: \(dateString)")
            }
            preferences = try decoder.decode(UserPreferences.self, from: data)
        } catch {
            print("Error loading preferences: \(error)")
        }
    }
    
    private func savePreferences() {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .custom { date, encoder in
                let isoFormatter = ISO8601DateFormatter()
                isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                let dateString = isoFormatter.string(from: date)
                var container = encoder.singleValueContainer()
                try container.encode(dateString)
            }
            let data = try encoder.encode(preferences)
            try data.write(to: preferencesURL)
        } catch {
            print("Error saving preferences: \(error)")
        }
    }
    
    private func getStartOfWeekDate() -> String {
        let calendar = Calendar.current
        let today = Date()
        let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: today)?.start ?? today
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: startOfWeek)
    }
    
    func generateMarkdownHistory(includeTitle: Bool = true, includeBearTag: Bool = false) -> String {
        let groupedSessions = Dictionary(grouping: sessions) { session in
            Calendar.current.startOfDay(for: session.startTime)
        }
        
        let sortedDates = groupedSessions.keys.sorted(by: >)
        
        var markdown = ""
        
        if includeTitle {
            let dateFormatter = DateFormatter()
            dateFormatter.dateStyle = .medium
            let currentDate = dateFormatter.string(from: Date())
            markdown = "# Mattato Sessions - \(currentDate)\n\n"
            
            // Add Bear tag if requested
            if includeBearTag {
                let weekDate = getStartOfWeekDate()
                markdown += "#mattato/\(weekDate)\n\n"
            }
        }
        
        for date in sortedDates {
            let dateFormatter = DateFormatter()
            dateFormatter.dateStyle = .full
            
            markdown += "### \(dateFormatter.string(from: date))\n\n"
            
            if let sessionsForDate = groupedSessions[date] {
                let sortedSessions = sessionsForDate.sorted { $0.startTime < $1.startTime }
                
                for session in sortedSessions {
                    markdown += "\(generateSessionLine(for: session))\n"
                }
            }
            
            markdown += "\n"
        }
        
        return markdown
    }
    
    private func generateWeeklyMarkdown(for weekSessions: [Session], weekStart: Date, includeBearTag: Bool) -> String {
        let weekDateFormatter = DateFormatter()
        weekDateFormatter.dateFormat = "yyyy-MM-dd"
        let weekDateString = weekDateFormatter.string(from: weekStart)
        
        let weekTitleFormatter = DateFormatter()
        weekTitleFormatter.dateStyle = .medium
        let weekTitle = weekTitleFormatter.string(from: weekStart)
        
        var markdown = "# Mattato Sessions - Week of \(weekTitle)\n\n"
        
        // Add Bear tag if requested
        if includeBearTag {
            markdown += "#mattato/\(weekDateString)\n\n"
        }
        
        // Group sessions by day within the week
        let groupedByDay = Dictionary(grouping: weekSessions) { session in
            Calendar.current.startOfDay(for: session.startTime)
        }
        
        let sortedDates = groupedByDay.keys.sorted()
        
        for date in sortedDates {
            let dateFormatter = DateFormatter()
            dateFormatter.dateStyle = .full
            
            markdown += "### \(dateFormatter.string(from: date))\n\n"
            
            if let sessionsForDate = groupedByDay[date] {
                let sortedSessions = sessionsForDate.sorted { $0.startTime < $1.startTime }
                
                for session in sortedSessions {
                    markdown += "\(generateSessionLine(for: session))\n"
                }
            }
            
            markdown += "\n"
        }
        
        return markdown
    }
    
    private func generateSessionLine(for session: Session) -> String {
        let description = session.formattedDescription.isEmpty ? "Untitled Session" : session.formattedDescription
        
        if let _ = session.endTime {
            return "- \(session.formattedStartTime) - \(session.formattedEndTime): \(description)"
        } else {
            return "- \(session.formattedStartTime) - (running): \(description)"
        }
    }
    
    func exportHistoryToFile() -> (success: Bool, url: URL?, error: String?) {
        // Check if there are any sessions to export
        guard !sessions.isEmpty else {
            return (false, nil, "No sessions to export. Complete at least one Pomodoro session first.")
        }
        
        // Group sessions by week
        let groupedByWeek = Dictionary(grouping: sessions) { session in
            let calendar = Calendar.current
            return calendar.dateInterval(of: .weekOfYear, for: session.startTime)?.start ?? session.startTime
        }
        
        let exportPath = getExportDirectory()
        var exportedFiles: [URL] = []
        var errors: [String] = []
        
        for (weekStart, weekSessions) in groupedByWeek {
            let weekDateFormatter = DateFormatter()
            weekDateFormatter.dateFormat = "yyyy-MM-dd"
            let weekDateString = weekDateFormatter.string(from: weekStart)
            
            let filename = "mattato-\(weekDateString).md"
            let exportURL = exportPath.appendingPathComponent(filename)
            
            let markdown = generateWeeklyMarkdown(for: weekSessions, weekStart: weekStart, includeBearTag: preferences.bearWeeklyTag)
            
            do {
                try markdown.write(to: exportURL, atomically: true, encoding: .utf8)
                exportedFiles.append(exportURL)
            } catch {
                errors.append("Error exporting \(filename): \(error.localizedDescription)")
            }
        }
        
        if exportedFiles.isEmpty {
            return (false, nil, "Failed to export any files. Errors: \(errors.joined(separator: ", "))")
        } else if !errors.isEmpty {
            // Return the export folder URL
            return (true, exportPath, "Exported \(exportedFiles.count) files with some errors: \(errors.joined(separator: ", "))")
        } else {
            // Return the export folder URL
            return (true, exportPath, "Successfully exported \(exportedFiles.count) weekly files.")
        }
    }
    
    func exportHistoryToBear() -> (success: Bool, error: String?) {
        // Check if there are any sessions to export
        guard !sessions.isEmpty else {
            return (false, "No sessions to export. Complete at least one Pomodoro sessions first.")
        }
        
        // Group sessions by week
        let groupedByWeek = Dictionary(grouping: sessions) { session in
            let calendar = Calendar.current
            return calendar.dateInterval(of: .weekOfYear, for: session.startTime)?.start ?? session.startTime
        }
        
        var successCount = 0
        var errors: [String] = []
        
        for (weekStart, weekSessions) in groupedByWeek {
            let weekDateFormatter = DateFormatter()
            weekDateFormatter.dateFormat = "yyyy-MM-dd"
            let weekDateString = weekDateFormatter.string(from: weekStart)
            
            let weekTitleFormatter = DateFormatter()
            weekTitleFormatter.dateStyle = .medium
            let weekTitle = weekTitleFormatter.string(from: weekStart)
            
            var markdown = generateWeeklyMarkdown(for: weekSessions, weekStart: weekStart, includeBearTag: false)
            
            if markdown.hasPrefix("# ") {
                if let firstNewlineIndex = markdown.firstIndex(of: "\n") {
                    markdown = String(markdown[markdown.index(after: firstNewlineIndex)...])
                }
            }
            
            if preferences.bearWeeklyTag {
                markdown = "#mattato/\(weekDateString)\n" + markdown
            }
            
            let title = "Mattato Sessions - Week of \(weekTitle)"
            
            // Create a character set for Bear URL encoding that preserves markdown formatting
            var allowedCharacters = CharacterSet.urlQueryAllowed
            // Remove & and = which are URL parameter separators
            allowedCharacters.remove(charactersIn: "&=")
            
            guard let encodedTitle = title.addingPercentEncoding(withAllowedCharacters: allowedCharacters),
                  let encodedText = markdown.addingPercentEncoding(withAllowedCharacters: allowedCharacters) else {
                errors.append("Failed to encode data for week \(weekDateString)")
                continue
            }
            
            let urlString: String
            if preferences.bearWeeklyTag {
                let tags = "mattato/\(weekDateString)"
                guard let encodedTags = tags.addingPercentEncoding(withAllowedCharacters: allowedCharacters) else {
                    errors.append("Failed to encode tags for week \(weekDateString)")
                    continue
                }
                urlString = "bear://x-callback-url/create?title=\(encodedTitle)&text=\(encodedText)&tags=\(encodedTags)&show_window=no"
            } else {
                urlString = "bear://x-callback-url/create?title=\(encodedTitle)&text=\(encodedText)&show_window=no"
            }
            
            // Check URL length - very long URLs can cause issues
            if urlString.count > 8000 {
                errors.append("Bear URL too long for week \(weekDateString) (\(urlString.count) characters). Try splitting the content.")
                continue
            }
            
            guard let url = URL(string: urlString) else {
                errors.append("Failed to create Bear URL for week \(weekDateString). URL may contain invalid characters.")
                continue
            }
            
            // Debug info for troubleshooting if needed
            // print("DEBUG: Attempting Bear export with URL length: \(urlString.count)")
            // print("DEBUG: URL preview: \(String(urlString.prefix(200)))...")
            
            // Check if Bear can handle the URL scheme
            if NSWorkspace.shared.urlForApplication(toOpen: url) == nil {
                errors.append("Bear app not found or URL scheme not registered")
                continue
            }
            
            // Check if the markdown content is not empty (Bear requirement)
            if markdown.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                errors.append("Empty content for week \(weekDateString) - Bear doesn't allow empty notes")
                continue
            }
            
            let success = NSWorkspace.shared.open(url)
            if !success {
                errors.append("Failed to open Bear URL for week \(weekDateString). Bear may not be installed or URL scheme not supported.")
                print("DEBUG: Failed to open URL: \(url)")
                continue
            }
            
            print("DEBUG: Successfully opened Bear URL for week \(weekDateString)")
            successCount += 1
            Thread.sleep(forTimeInterval: 0.1)
        }
        
        if successCount == 0 {
            return (false, "Failed to create any Bear notes. Errors: \(errors.joined(separator: ", "))")
        } else if !errors.isEmpty {
            return (true, "Created \(successCount) Bear notes with some errors: \(errors.joined(separator: ", "))")
        } else {
            return (true, "Successfully created \(successCount) weekly Bear notes.")
        }
    }
    
    
    var completedSessionsCount: Int {
        sessions.filter { $0.isCompleted }.count
    }
    
    var totalTimeSpent: TimeInterval {
        sessions.filter { $0.isCompleted }.compactMap { $0.actualDuration }.reduce(0, +)
    }
    
    var formattedTotalTime: String {
        let hours = Int(totalTimeSpent) / 3600
        let minutes = (Int(totalTimeSpent) % 3600) / 60
        
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
    
    // MARK: - Markdown History File Management
    
    func createOrUpdateHistoryFile() -> (success: Bool, error: String?) {
        guard !sessions.isEmpty else {
            return (false, "No sessions to display. Complete at least one Pomodoro sessions first.")
        }
        
        let markdown = generateMarkdownHistory(includeTitle: true, includeBearTag: false)
        
        do {
            try markdown.write(to: historyURL, atomically: true, encoding: .utf8)
            if let attributes = try? FileManager.default.attributesOfItem(atPath: historyURL.path),
               let modificationDate = attributes[.modificationDate] as? Date {
                lastHistoryFileModification = modificationDate
            }
            
            if isHistoryFileOpen {
                forceEditorRefresh()
            }
            
            return (true, nil)
        } catch {
            return (false, "Error creating history file: \(error.localizedDescription)")
        }
    }
    
    func markHistoryFileAsOpen() {
        isHistoryFileOpen = true
        print("History file marked as open - will force refreshes on updates")
    }
    
    func markHistoryFileAsClosed() {
        isHistoryFileOpen = false
        print("History file marked as closed")
    }
    
    private func forceEditorRefresh() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.performEditorRefresh()
        }
    }
    
    private func performEditorRefresh() {
        guard FileManager.default.fileExists(atPath: historyURL.path) else { return }
        
        do {
            let content = try String(contentsOf: historyURL)
            
            let refreshedContent = content + "\u{200B}" // Zero-width space
            try refreshedContent.write(to: historyURL, atomically: true, encoding: .utf8)
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
                do {
                    try content.write(to: self?.historyURL ?? URL(fileURLWithPath: ""), atomically: true, encoding: .utf8)
                    
                    if let self = self,
                       let attributes = try? FileManager.default.attributesOfItem(atPath: self.historyURL.path),
                       let modificationDate = attributes[.modificationDate] as? Date {
                        self.lastHistoryFileModification = modificationDate
                    }
                } catch {
                    print("Error during editor refresh: \(error)")
                }
            }
        } catch {
            print("Error forcing editor refresh: \(error)")
        }
    }
    
    func loadHistoryFromMarkdown() -> (success: Bool, error: String?) {
        guard FileManager.default.fileExists(atPath: historyURL.path) else {
            return (true, nil) // No file exists yet, that's okay
        }
        
        do {
            let content = try String(contentsOf: historyURL, encoding: .utf8)
            let parsedSessions = parseMarkdownToSessions(content)
            
            if parsedSessions.isEmpty && !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                return (false, "History file appears to be corrupted or in an unrecognized format.")
            }
            
                sessions = parsedSessions
            updateSessionCounter()
            
            return (true, nil)
        } catch {
            return (false, "Error reading history file: \(error.localizedDescription)")
        }
    }
    
    private func parseMarkdownToSessions(_ markdown: String) -> [Session] {
        var parsedSessions: [Session] = []
        let lines = markdown.components(separatedBy: .newlines)
        
        for line in lines {
            if let session = parseSessionLine(line) {
                parsedSessions.append(session)
            }
        }
        
        return parsedSessions.sorted { $0.startTime < $1.startTime }
    }
    
    private func parseSessionLine(_ line: String) -> Session? {
        
        let trimmedLine = line.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmedLine.hasPrefix("- ") else { return nil }
        
        let idPattern = #"\[#(\d+)\]"#
        guard let idMatch = trimmedLine.range(of: idPattern, options: .regularExpression) else {
            return nil
        }
        
        let idString = String(trimmedLine[idMatch])
        let idNumber = idString.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
        let sessionId = String(format: "%05d", Int(idNumber) ?? 0)
        
        let withoutId = trimmedLine.replacingOccurrences(of: idPattern, with: "", options: .regularExpression).trimmingCharacters(in: .whitespacesAndNewlines)
        
        let components = withoutId.dropFirst(2).components(separatedBy: ": ")
        guard components.count >= 2 else { return nil }
        
        let timeAndStatus = components[0].trimmingCharacters(in: .whitespacesAndNewlines)
        let description = components.dropFirst().joined(separator: ": ").trimmingCharacters(in: .whitespacesAndNewlines)
        
        let timeComponents = timeAndStatus.components(separatedBy: " - ")
        guard timeComponents.count >= 2 else { return nil }
        
        let startTimeString = timeComponents[0].trimmingCharacters(in: .whitespacesAndNewlines)
        let statusOrEndTime = timeComponents[1].trimmingCharacters(in: .whitespacesAndNewlines)
        
        guard let startTime = parseTimeString(startTimeString) else { return nil }
        
        var sessionState: SessionState = .completed
        var endTime: Date? = nil
        
        if statusOrEndTime == "(running)" {
            sessionState = .started
        } else if statusOrEndTime == "(paused)" {
            sessionState = .paused
        } else {
            endTime = parseTimeString(statusOrEndTime)
        }
        
        let session = Session(id: sessionId, description: description, plannedDuration: 25 * 60)
        
        let mirror = Mirror(reflecting: session)
        for child in mirror.children {
            if child.label == "startTime" {
                break
            }
        }
        
        let newSession = createSessionFromParsedData(
            id: sessionId,
            description: description,
            startTime: startTime,
            endTime: endTime,
            sessionState: sessionState
        )
        
        return newSession
    }
    
    private func createSessionFromParsedData(id: String, description: String, startTime: Date, endTime: Date?, sessionState: SessionState) -> Session {
        var session = Session(id: id, description: description, plannedDuration: 25 * 60)
        
        session.sessionState = sessionState
        
        if let endTime = endTime {
            session.endTime = endTime
        }
        
        return session
    }
    
    private func parseTimeString(_ timeString: String) -> Date? {
        // First try the comprehensive date parser
        if let fullDate = parseDateFromString(timeString) {
            return fullDate
        }
        
        // Fallback for time-only strings (legacy format)
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        formatter.dateStyle = .none
        
        if let time = formatter.date(from: timeString) {
            let calendar = Calendar.current
            let now = Date()
            let timeComponents = calendar.dateComponents([.hour, .minute], from: time)
            return calendar.date(bySettingHour: timeComponents.hour ?? 0, minute: timeComponents.minute ?? 0, second: 0, of: now)
        }
        
        return nil
    }
    
    // MARK: - Editor Detection and Management
    
    func getAvailableMarkdownEditors() -> [String] {
        var editors = ["System Default"]
        
        let commonEditors = [
            ("Visual Studio Code", "com.microsoft.VSCode"),
            ("Sublime Text", "com.sublimetext.4"),
            ("TextEdit", "com.apple.TextEdit"),
            ("Typora", "abnerworks.Typora"),
            ("MacDown", "com.uranusjr.macdown"),
            ("Atom", "com.github.atom"),
            ("Nova", "com.panic.Nova"),
            ("BBEdit", "com.barebones.bbedit"),
            ("TextMate", "com.macromates.textmate"),
            ("Zed", "dev.zed.Zed"),
            ("CotEditor", "com.coteditor.CotEditor")
        ]
        
        for (name, bundleId) in commonEditors {
            if NSWorkspace.shared.urlForApplication(withBundleIdentifier: bundleId) != nil {
                editors.append(name)
            }
        }
        
        return editors
    }
    
    func openHistoryWithPreferredEditor() -> (success: Bool, error: String?) {
        let result = createOrUpdateHistoryFile()
        guard result.success else {
            return result
        }
        
        startHistoryFileMonitoring()
        
        let editorName = preferences.preferredMarkdownEditor
        
        if editorName == "System Default" {
            NSWorkspace.shared.open(historyURL)
            return (true, nil)
        }
        
        let editorBundleIds: [String: String] = [
            "Visual Studio Code": "com.microsoft.VSCode",
            "Sublime Text": "com.sublimetext.4",
            "TextEdit": "com.apple.TextEdit",
            "Typora": "abnerworks.Typora",
            "MacDown": "com.uranusjr.macdown",
            "Atom": "com.github.atom",
            "Nova": "com.panic.Nova",
            "BBEdit": "com.barebones.bbedit",
            "TextMate": "com.macromates.textmate",
            "Zed": "dev.zed.Zed",
            "CotEditor": "com.coteditor.CotEditor"
        ]
        
        guard let bundleId = editorBundleIds[editorName] else {
            NSWorkspace.shared.open(historyURL)
            return (true, nil)
        }
        
        guard let appURL = NSWorkspace.shared.urlForApplication(withBundleIdentifier: bundleId) else {
            // Fallback to system default if app not found
            NSWorkspace.shared.open(historyURL)
            return (true, nil)
        }
        
        NSWorkspace.shared.open([historyURL], withApplicationAt: appURL, configuration: NSWorkspace.OpenConfiguration())
        return (true, nil)
    }
    
    // MARK: - Real-time History Updates
    
    private func startHistoryFileMonitoring() {
        isHistoryFileOpen = true
        
        historyUpdateTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { [weak self] _ in
            self?.updateHistoryFileIfNeeded()
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 30.0) { [weak self] in
            self?.checkIfHistoryFileStillOpen()
        }
    }
    
    private func stopHistoryFileMonitoring() {
        isHistoryFileOpen = false
        historyUpdateTimer?.invalidate()
        historyUpdateTimer = nil
    }
    
    private func updateHistoryFileIfNeeded() {
        guard isHistoryFileOpen else { return }
        
        fileQueue.async { [weak self] in
            guard let self = self else { return }
            
            let markdown = self.generateMarkdownHistory(includeTitle: true, includeBearTag: false)
            
            do {
                try markdown.write(to: self.historyURL, atomically: true, encoding: .utf8)
            } catch {
                print("Error updating history file: \(error)")
            }
        }
    }
    
    private func updateHistoryFileAlways() {
        fileQueue.async { [weak self] in
            guard let self = self else { return }
            
            let markdown = self.generateMarkdownHistory(includeTitle: true, includeBearTag: false)
            
            do {
                try markdown.write(to: self.historyURL, atomically: true, encoding: .utf8)
                
                if self.isHistoryFileOpen {
                    self.performEditorRefresh()
                }
            } catch {
                print("Error updating history file: \(error)")
            }
        }
    }
    
    private func checkIfHistoryFileStillOpen() {
        guard isHistoryFileOpen else { return }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 300.0) { [weak self] in
            self?.stopHistoryFileMonitoring()
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 30.0) { [weak self] in
            self?.checkIfHistoryFileStillOpen()
        }
    }
    
    func stopHistoryMonitoring() {
        stopHistoryFileMonitoring()
    }
    
    func getHistoryFileURL() -> URL {
        return historyURL
    }
    
    
    // MARK: - Export Directory Management
    
    private func getExportDirectory() -> URL {
        if !preferences.exportFolderPath.isEmpty {
            let customPath = URL(fileURLWithPath: preferences.exportFolderPath)
            
            do {
                try FileManager.default.createDirectory(at: customPath, withIntermediateDirectories: true, attributes: nil)
                return customPath
            } catch {
                print("Error creating export directory: \(error)")
            }
        }
        
        return FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
    
    // MARK: - Session Editing Methods
    
    func deleteSession(_ sessionId: String) {
        fileQueue.async { [weak self] in
            guard let self = self else { return }
            
            self.createSessionsBackup()
            
            DispatchQueue.main.async {
                self.sessions.removeAll { $0.id == sessionId }
            }
            
            self.saveSessionsAtomically()
        }
    }
    
    private func createSessionsBackup() {
        let backupURL = sessionsURL.appendingPathExtension("backup.\(Date().timeIntervalSince1970)")
        
        do {
            if FileManager.default.fileExists(atPath: sessionsURL.path) {
                try FileManager.default.copyItem(at: sessionsURL, to: backupURL)
                
                cleanupOldBackups()
            }
        } catch {
            print("Failed to create backup: \(error)")
        }
    }
    
    private func cleanupOldBackups() {
        let parentDirectory = sessionsURL.deletingLastPathComponent()
        
        do {
            let files = try FileManager.default.contentsOfDirectory(at: parentDirectory, includingPropertiesForKeys: [.creationDateKey])
            let backupFiles = files.filter { $0.lastPathComponent.contains("sessions.json.backup") }
            
            if backupFiles.count > 5 {
                let sortedBackups = backupFiles.sorted { file1, file2 in
                    let date1 = (try? file1.resourceValues(forKeys: [.creationDateKey]).creationDate) ?? Date.distantPast
                    let date2 = (try? file2.resourceValues(forKeys: [.creationDateKey]).creationDate) ?? Date.distantPast
                    return date1 > date2 // Newest first
                }
                
                for backup in sortedBackups.dropFirst(5) {
                    try FileManager.default.removeItem(at: backup)
                }
            }
        } catch {
            print("Failed to cleanup old backups: \(error)")
        }
    }
    
    private func saveSessionsAtomically() {
        let tempURL = sessionsURL.appendingPathExtension("tmp")
        
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .custom { date, encoder in
                let isoFormatter = ISO8601DateFormatter()
                isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                let dateString = isoFormatter.string(from: date)
                var container = encoder.singleValueContainer()
                try container.encode(dateString)
            }
            let data = try encoder.encode(sessions)
            try data.write(to: tempURL)
            
            _ = tempURL.startAccessingSecurityScopedResource()
            defer { tempURL.stopAccessingSecurityScopedResource() }
            
            try FileManager.default.replaceItem(at: sessionsURL, withItemAt: tempURL, backupItemName: nil, options: [], resultingItemURL: nil)
            
        } catch {
            print("Failed to save sessions atomically: \(error)")
            
            if FileManager.default.fileExists(atPath: tempURL.path) {
                try? FileManager.default.removeItem(at: tempURL)
            }
        }
    }
    
    func generateManualSessionId() -> String {
        return "manual-\(Date().timeIntervalSince1970)-\(UUID().uuidString.prefix(8))"
    }
    
    // MARK: - Date Parsing Helpers
    
    func parseDateFromString(_ dateString: String) -> Date? {
        // Try ISO 8601 format first (new standard)
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let isoDate = isoFormatter.date(from: dateString) {
            return isoDate
        }
        
        // Fallback to ISO without fractional seconds
        isoFormatter.formatOptions = [.withInternetDateTime]
        if let isoDate = isoFormatter.date(from: dateString) {
            return isoDate
        }
        
        // Legacy format support for existing data
        let legacyFormats = [
            "dd.MM.yyyy HH:mm:ss",  // European with time
            "MM/dd/yyyy HH:mm:ss",  // US with time  
            "dd.MM.yyyy",           // European date only
            "MM/dd/yyyy",           // US date only
            "yyyy-MM-dd HH:mm:ss",  // ISO-like format
            "yyyy-MM-dd",           // ISO date only
        ]
        
        for formatString in legacyFormats {
            let formatter = DateFormatter()
            formatter.dateFormat = formatString
            formatter.locale = Locale(identifier: "en_US_POSIX")
            if let date = formatter.date(from: dateString) {
                return date
            }
        }
        
        return nil
    }
    
    // MARK: - Date Formatting Helpers
    
    func formatDateForExport(_ date: Date) -> String {
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return isoFormatter.string(from: date)
    }
    
    func formatDateForFilename(_ date: Date, isMonth: Bool = false) -> String {
        let formatter = DateFormatter()
        if isMonth {
            formatter.dateFormat = "yyyy-MM"
            return formatter.string(from: date)
        } else {
            formatter.dateFormat = "yyyy-MM-dd"
            return formatter.string(from: date)
        }
    }
    
    func formatDateForDisplay(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
    
    // MARK: - Date Range Filtering
    
    func getSessionsForExport() -> [Session] {
        let calendar = Calendar.current
        let now = Date()
        
        let dateRange = preferences.exportDateRange
        
        let (startDate, endDate): (Date, Date)
        
        switch dateRange {
        case "current_week":
            let weekInterval = calendar.dateInterval(of: .weekOfYear, for: now)
            startDate = weekInterval?.start ?? calendar.startOfDay(for: now)
            endDate = weekInterval?.end ?? calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: now)) ?? now
            
        case "last_week":
            let lastWeek = calendar.date(byAdding: .weekOfYear, value: -1, to: now) ?? now
            let lastWeekInterval = calendar.dateInterval(of: .weekOfYear, for: lastWeek)
            startDate = lastWeekInterval?.start ?? calendar.startOfDay(for: lastWeek)
            endDate = lastWeekInterval?.end ?? calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: lastWeek)) ?? now
            
        case "current_month":
            let monthInterval = calendar.dateInterval(of: .month, for: now)
            startDate = monthInterval?.start ?? calendar.startOfDay(for: now)
            endDate = monthInterval?.end ?? calendar.date(byAdding: .month, value: 1, to: calendar.startOfDay(for: now)) ?? now
            
        case "current_quarter":
            let quarter = calendar.component(.quarter, from: now)
            let year = calendar.component(.year, from: now)
            let quarterStartMonth = (quarter - 1) * 3 + 1
            
            startDate = calendar.date(from: DateComponents(year: year, month: quarterStartMonth, day: 1)) ?? calendar.startOfDay(for: now)
            endDate = calendar.date(from: DateComponents(year: year, month: quarterStartMonth + 3, day: 1)) ?? now
            
        case "custom":
            startDate = calendar.startOfDay(for: preferences.exportCustomFromDate)
            endDate = calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: preferences.exportCustomToDate)) ?? calendar.startOfDay(for: preferences.exportCustomToDate)
            
        default:
            startDate = calendar.startOfDay(for: now)
            endDate = calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: now)) ?? now
        }
        
        return sessions.filter { session in
            session.startTime >= startDate && session.startTime < endDate
        }
    }
    
    // MARK: - Database Export/Import
    
    func exportDatabase() -> (success: Bool, url: URL?, error: String?) {
        let exportDirectory = getDBExportDirectory()
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd-HHmm"
        let timestamp = formatter.string(from: Date())
        let filename = "mattato-database-\(timestamp).json"
        let exportURL = exportDirectory.appendingPathComponent(filename)
        
        let exportData = DatabaseExport(
            sessions: sessions,
            preferences: preferences,
            exportDate: Date()
        )
        
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .custom { date, encoder in
                let isoFormatter = ISO8601DateFormatter()
                isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                let dateString = isoFormatter.string(from: date)
                var container = encoder.singleValueContainer()
                try container.encode(dateString)
            }
            let data = try encoder.encode(exportData)
            try data.write(to: exportURL)
            return (true, exportURL, nil)
        } catch {
            return (false, nil, "Failed to export database: \(error.localizedDescription)")
        }
    }
    
    func importDatabase(from url: URL) -> (success: Bool, error: String?) {
        do {
            let data = try Data(contentsOf: url)
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .custom { decoder in
                let container = try decoder.singleValueContainer()
                let dateString = try container.decode(String.self)
                
                if let date = self.parseDateFromString(dateString) {
                    return date
                }
                
                throw DecodingError.dataCorruptedError(in: container, debugDescription: "Could not parse ISO 8601 date: \(dateString)")
            }
            let importData = try decoder.decode(DatabaseExport.self, from: data)
            
            // Replace all data
            sessions = importData.sessions
            preferences = importData.preferences
            
            // Save immediately
            saveSessions()
            updatePreferences(preferences)
            
            return (true, nil)
        } catch {
            return (false, "Failed to import database: \(error.localizedDescription)")
        }
    }
    
    private func getDBExportDirectory() -> URL {
        if !preferences.dbExportFolderPath.isEmpty {
            let customURL = URL(fileURLWithPath: preferences.dbExportFolderPath)
            
            var isDirectory: ObjCBool = false
            if FileManager.default.fileExists(atPath: customURL.path, isDirectory: &isDirectory),
               isDirectory.boolValue {
                return customURL
            }
        }
        
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let mattatoPath = documentsPath.appendingPathComponent("Mattato")
        
        try? FileManager.default.createDirectory(at: mattatoPath, withIntermediateDirectories: true)
        
        return mattatoPath
    }
}

// MARK: - Database Export Structure
struct DatabaseExport: Codable {
    let sessions: [Session]
    let preferences: UserPreferences
    let exportDate: Date
}
