import Foundation

class ICSManager {
    static let shared = ICSManager()
    
    private init() {}
    
    func exportSessionsToICS(_ sessions: [Session]) -> (success: Bool, urls: [URL], error: String?) {
        let completedSessions = sessions.filter { session in
            session.isCompleted && session.endTime != nil
        }
        
        guard !completedSessions.isEmpty else {
            return (false, [], "No completed sessions to export. Complete at least one Pomodoro session first.")
        }
        
        let prefs = HistoryManager.shared.preferences
        let exportDirectory = getExportDirectory()
        var exportedURLs: [URL] = []
        var errors: [String] = []
        
        let groupedSessions: [Date: [Session]]
        if prefs.exportSplitBy == "none" {
            // Single file export
            let now = Date()
            groupedSessions = [now: completedSessions]
        } else if prefs.exportSplitBy == "month" {
            groupedSessions = groupSessionsByMonth(completedSessions)
        } else {
            groupedSessions = groupSessionsByWeek(completedSessions)
        }
        
        for (periodStart, periodSessions) in groupedSessions {
            let result = exportPeriodToICS(periodSessions, periodStart: periodStart, directory: exportDirectory, splitBy: prefs.exportSplitBy)
            
            if result.success, let url = result.url {
                exportedURLs.append(url)
            } else {
                let periodName = prefs.exportSplitBy == "month" ? formatMonthStart(periodStart) : formatWeekStart(periodStart)
                errors.append(result.error ?? "Unknown error for \(prefs.exportSplitBy) \(periodName)")
            }
        }
        
        if exportedURLs.isEmpty {
            return (false, [], errors.isEmpty ? "Failed to export ICS files" : errors.joined(separator: "\n"))
        }
        
        let success = errors.isEmpty
        let errorMessage = errors.isEmpty ? nil : "Some exports failed:\n\(errors.joined(separator: "\n"))"
        
        return (success, exportedURLs, errorMessage)
    }
    
    private func exportPeriodToICS(_ sessions: [Session], periodStart: Date, directory: URL, splitBy: String) -> (success: Bool, url: URL?, error: String?) {
        let prefs = HistoryManager.shared.preferences
        let filename: String
        
        if splitBy == "none" {
            filename = "\(prefs.exportTitle.replacingOccurrences(of: " ", with: "-")).ics"
        } else {
            let periodString = splitBy == "month" ? formatMonthStart(periodStart) : formatWeekStart(periodStart)
            filename = "\(prefs.exportTitle.replacingOccurrences(of: " ", with: "-"))-\(periodString).ics"
        }
        let exportURL = directory.appendingPathComponent(filename)
        
        let icsContent = generateICSContent(for: sessions)
        
        do {
            try icsContent.write(to: exportURL, atomically: true, encoding: .utf8)
            return (true, exportURL, nil)
        } catch {
            return (false, nil, "Error saving ICS file: \(error.localizedDescription)")
        }
    }
    
    private func generateICSContent(for sessions: [Session]) -> String {
        var ics = """
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Mattato//Pomodoro Timer//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH

"""
        
        for session in sessions {
            guard let endTime = session.endTime else { continue }
            
            let eventTitle = sanitizeForICS(session.formattedDescription.isEmpty ? "Pomodoro Session" : session.formattedDescription)
            let eventDescription = sanitizeForICS("Created by Mattato Pomodoro Timer\\nSession ID: \(session.id)")
            let uid = "mattato-\(session.id)@mattato.com"
            
            let startTimeUTC = formatDateForICS(session.startTime)
            let endTimeUTC = formatDateForICS(endTime)
            let createdTimeUTC = formatDateForICS(Date())
            
            ics += """
BEGIN:VEVENT
UID:\(uid)
DTSTAMP:\(createdTimeUTC)
DTSTART:\(startTimeUTC)
DTEND:\(endTimeUTC)
SUMMARY:\(eventTitle)
DESCRIPTION:\(eventDescription)
CATEGORIES:Productivity,Pomodoro
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT

"""
        }
        
        ics += "END:VCALENDAR\n"
        return ics
    }
    
    private func formatDateForICS(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyyMMdd'T'HHmmss'Z'"
        formatter.timeZone = TimeZone(abbreviation: "UTC")
        return formatter.string(from: date)
    }
    
    private func sanitizeForICS(_ text: String) -> String {
        return text
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: ";", with: "\\;")
            .replacingOccurrences(of: ",", with: "\\,")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "\\r")
    }
    
    private func groupSessionsByWeek(_ sessions: [Session]) -> [Date: [Session]] {
        let calendar = Calendar.current
        var sessionsByWeek: [Date: [Session]] = [:]
        
        for session in sessions {
            let weekStart = calendar.dateInterval(of: .weekOfYear, for: session.startTime)?.start ?? session.startTime
            
            if sessionsByWeek[weekStart] == nil {
                sessionsByWeek[weekStart] = []
            }
            sessionsByWeek[weekStart]?.append(session)
        }
        
        return sessionsByWeek
    }
    
    private func groupSessionsByMonth(_ sessions: [Session]) -> [Date: [Session]] {
        let calendar = Calendar.current
        var sessionsByMonth: [Date: [Session]] = [:]
        
        for session in sessions {
            let monthStart = calendar.dateInterval(of: .month, for: session.startTime)?.start ?? session.startTime
            
            if sessionsByMonth[monthStart] == nil {
                sessionsByMonth[monthStart] = []
            }
            sessionsByMonth[monthStart]?.append(session)
        }
        
        return sessionsByMonth
    }
    
    private func formatWeekStart(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
    
    private func formatMonthStart(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM-yyyy"
        let monthYear = formatter.string(from: date)
        return monthYear.lowercased()
    }
    
    private func getExportDirectory() -> URL {
        let prefs = HistoryManager.shared.preferences
        
        if !prefs.exportFolderPath.isEmpty {
            let customURL = URL(fileURLWithPath: prefs.exportFolderPath)
            
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
