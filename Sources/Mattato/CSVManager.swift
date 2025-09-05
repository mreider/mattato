import Foundation

class CSVManager {
    static let shared = CSVManager()
    
    private init() {}
    
    func exportSessionsToCSV(_ sessions: [Session]) -> (success: Bool, urls: [URL], error: String?) {
        guard !sessions.isEmpty else {
            return (false, [], "No sessions to export")
        }
        
        let prefs = HistoryManager.shared.preferences
        let exportDirectory = getExportDirectory()
        var exportedURLs: [URL] = []
        var errors: [String] = []
        
        let groupedSessions: [Date: [Session]]
        if prefs.exportSplitBy == "none" {
            // Single file export
            let now = Date()
            groupedSessions = [now: sessions]
        } else if prefs.exportSplitBy == "month" {
            groupedSessions = groupSessionsByMonth(sessions)
        } else {
            groupedSessions = groupSessionsByWeek(sessions)
        }
        
        for (periodStart, periodSessions) in groupedSessions {
            let result = exportPeriodToCSV(periodSessions, periodStart: periodStart, directory: exportDirectory, splitBy: prefs.exportSplitBy)
            
            if result.success, let url = result.url {
                exportedURLs.append(url)
            } else {
                let periodName = prefs.exportSplitBy == "month" ? formatMonthStart(periodStart) : formatWeekStart(periodStart)
                errors.append(result.error ?? "Unknown error for \(prefs.exportSplitBy) \(periodName)")
            }
        }
        
        if exportedURLs.isEmpty {
            return (false, [], errors.isEmpty ? "Failed to export CSV files" : errors.joined(separator: "\n"))
        }
        
        let success = errors.isEmpty
        let errorMessage = errors.isEmpty ? nil : "Some exports failed:\n\(errors.joined(separator: "\n"))"
        
        return (success, exportedURLs, errorMessage)
    }
    
    private func exportPeriodToCSV(_ sessions: [Session], periodStart: Date, directory: URL, splitBy: String) -> (success: Bool, url: URL?, error: String?) {
        let prefs = HistoryManager.shared.preferences
        let filename: String
        
        if splitBy == "none" {
            filename = "\(prefs.exportTitle.replacingOccurrences(of: " ", with: "-")).csv"
        } else {
            let periodString = splitBy == "month" ? formatMonthStart(periodStart) : formatWeekStart(periodStart)
            filename = "\(prefs.exportTitle.replacingOccurrences(of: " ", with: "-"))-\(periodString).csv"
        }
        let fileURL = directory.appendingPathComponent(filename)
        
        let sortedSessions = sessions.sorted { $0.startTime < $1.startTime }
        
        var csvContent = "Start,End,Description,Project,Customer\n"
        
        for session in sortedSessions {
            let startTime = formatDateTimeForCSV(session.startTime)
            let endTime = session.endTime != nil ? formatDateTimeForCSV(session.endTime!) : ""
            let description = escapeCSVField(session.description)
            let project = escapeCSVField(session.project ?? "")
            let customer = escapeCSVField(session.customer ?? "")
            
            csvContent += "\(startTime),\(endTime),\(description),\(project),\(customer)\n"
        }
        
        do {
            try csvContent.write(to: fileURL, atomically: true, encoding: .utf8)
            return (true, fileURL, nil)
        } catch {
            return (false, nil, "Failed to write CSV file: \(error.localizedDescription)")
        }
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
        formatter.dateFormat = "yyyy-MM"
        return formatter.string(from: date)
    }
    
    private func formatDateTimeForCSV(_ date: Date) -> String {
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return isoFormatter.string(from: date)
    }
    
    private func escapeCSVField(_ field: String) -> String {
        if field.contains("\"") || field.contains(",") || field.contains("\n") {
            let escapedField = field.replacingOccurrences(of: "\"", with: "\"\"")
            return "\"\(escapedField)\""
        }
        return field
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