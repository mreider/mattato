import Foundation
import AppKit

class HistoryManager: ObservableObject {
    static let shared = HistoryManager()
    
    @Published var sessions: [Session] = []
    @Published var preferences: UserPreferences = UserPreferences.shared
    
    private let sessionsURL: URL
    private let preferencesURL: URL
    private var sessionCounter: Int = 1
    
    private init() {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let appDirectory = documentsPath.appendingPathComponent("Mattato")
        
        try? FileManager.default.createDirectory(at: appDirectory, withIntermediateDirectories: true)
        
        sessionsURL = appDirectory.appendingPathComponent("sessions.json")
        preferencesURL = appDirectory.appendingPathComponent("preferences.json")
        
        loadData()
        updateSessionCounter()
    }
    
    private func generateSessionId() -> String {
        defer { sessionCounter += 1 }
        return String(format: "%05d", sessionCounter)
    }
    
    private func updateSessionCounter() {
        let maxId = sessions.compactMap { Int($0.id) }.max() ?? 0
        sessionCounter = maxId + 1
    }
    
    func startSession(description: String, plannedDuration: TimeInterval) -> Session {
        let session = Session(id: generateSessionId(), description: description, plannedDuration: plannedDuration)
        sessions.append(session)
        saveSessions()
        
        return session
    }
    
    func updateSession(_ updatedSession: Session) {
        if let index = sessions.firstIndex(where: { $0.id == updatedSession.id }) {
            sessions[index] = updatedSession
            saveSessions()
        }
    }
    
    func removeSession(id: String) {
        sessions.removeAll { $0.id == id }
        saveSessions()
    }
    
    func addSession(_ session: Session) {
        sessions.append(session)
        saveSessions()
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
            sessions = try JSONDecoder().decode([Session].self, from: data)
        } catch {
            print("Error loading sessions: \(error)")
        }
    }
    
    private func saveSessions() {
        do {
            let data = try JSONEncoder().encode(sessions)
            try data.write(to: sessionsURL)
        } catch {
            print("Error saving sessions: \(error)")
        }
    }
    
    private func loadPreferences() {
        guard let data = try? Data(contentsOf: preferencesURL) else { return }
        
        do {
            preferences = try JSONDecoder().decode(UserPreferences.self, from: data)
        } catch {
            print("Error loading preferences: \(error)")
        }
    }
    
    private func savePreferences() {
        do {
            let data = try JSONEncoder().encode(preferences)
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
            markdown = "# Mattato History - \(currentDate)\n\n"
            
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
        
        var markdown = "# Mattato History - Week of \(weekTitle)\n\n"
        
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
        let description = session.description.isEmpty ? "Untitled Session" : session.description
        let sessionId = "[#\(session.id)]"
        
        switch session.sessionState {
        case .started:
            return "- \(session.formattedStartTime) - (running): \(description) \(sessionId)"
        case .paused:
            return "- \(session.formattedStartTime) - (paused): \(description) \(sessionId)"
        case .completed:
            return "- \(session.formattedStartTime) - \(session.formattedEndTime): \(description) \(sessionId)"
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
        
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        var exportedFiles: [URL] = []
        var errors: [String] = []
        
        // Create a file for each week
        for (weekStart, weekSessions) in groupedByWeek {
            let weekDateFormatter = DateFormatter()
            weekDateFormatter.dateFormat = "yyyy-MM-dd"
            let weekDateString = weekDateFormatter.string(from: weekStart)
            
            let filename = "mattato-\(weekDateString).md"
            let exportURL = documentsPath.appendingPathComponent(filename)
            
            // Generate markdown for this week only
            let markdown = generateWeeklyMarkdown(for: weekSessions, weekStart: weekStart, includeBearTag: preferences.includeBearTag)
            
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
            return (true, exportedFiles.first, "Exported \(exportedFiles.count) files with some errors: \(errors.joined(separator: ", "))")
        } else {
            return (true, exportedFiles.first, "Successfully exported \(exportedFiles.count) weekly files to Documents folder.")
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
        
        // Create a Bear note for each week
        for (weekStart, weekSessions) in groupedByWeek {
            let weekDateFormatter = DateFormatter()
            weekDateFormatter.dateFormat = "yyyy-MM-dd"
            let weekDateString = weekDateFormatter.string(from: weekStart)
            
            let weekTitleFormatter = DateFormatter()
            weekTitleFormatter.dateStyle = .medium
            let weekTitle = weekTitleFormatter.string(from: weekStart)
            
            // Generate markdown for this week (without title since Bear will use the title parameter)
            var markdown = generateWeeklyMarkdown(for: weekSessions, weekStart: weekStart, includeBearTag: false)
            
            // Remove the H1 title since Bear will use the title parameter
            if markdown.hasPrefix("# ") {
                if let firstNewlineIndex = markdown.firstIndex(of: "\n") {
                    markdown = String(markdown[markdown.index(after: firstNewlineIndex)...])
                }
            }
            
            // Add Bear tag at the beginning if requested
            if preferences.includeBearTag {
                markdown = "#mattato/\(weekDateString)\n\n" + markdown
            }
            
            let title = "Mattato History - Week of \(weekTitle)"
            var tags = "mattato,pomodoro,history"
            
            // Add the weekly tag to Bear's tag system if checkbox is checked
            if preferences.includeBearTag {
                tags += ",mattato/\(weekDateString)"
            }
            
            // URL encode the parameters
            guard let encodedTitle = title.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
                  let encodedText = markdown.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
                  let encodedTags = tags.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else {
                errors.append("Failed to encode data for week \(weekDateString)")
                continue
            }
            
            // Create Bear URL with x-callback-url scheme
            let urlString = "bear://x-callback-url/create?title=\(encodedTitle)&text=\(encodedText)&tags=\(encodedTags)&show_window=no"
            
            guard let url = URL(string: urlString) else {
                errors.append("Failed to create Bear URL for week \(weekDateString)")
                continue
            }
            
            // Open Bear with the URL scheme
            NSWorkspace.shared.open(url)
            successCount += 1
            
            // Small delay between Bear note creations to avoid overwhelming the app
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
    
    func exportHistoryToOutlook() -> (success: Bool, error: String?) {
        guard !sessions.isEmpty else {
            return (false, "No sessions to export. Complete at least one Pomodoro session first.")
        }
        
        return OutlookManager.shared.exportSessionsToOutlookWithUI(sessions)
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
}
