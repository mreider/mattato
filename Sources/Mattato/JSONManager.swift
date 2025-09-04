import Foundation

class JSONManager {
    static let shared = JSONManager()
    
    private init() {}
    
    func exportSessionsToJSON(_ sessions: [Session]) -> (success: Bool, urls: [URL], error: String?) {
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
            let result = exportPeriodToJSON(periodSessions, periodStart: periodStart, directory: exportDirectory, splitBy: prefs.exportSplitBy)
            
            if result.success, let url = result.url {
                exportedURLs.append(url)
            } else {
                let periodName = prefs.exportSplitBy == "month" ? formatMonthStart(periodStart) : formatWeekStart(periodStart)
                errors.append(result.error ?? "Unknown error for \(prefs.exportSplitBy) \(periodName)")
            }
        }
        
        if exportedURLs.isEmpty {
            return (false, [], errors.isEmpty ? "Failed to export JSON files" : errors.joined(separator: "\n"))
        }
        
        let success = errors.isEmpty
        let errorMessage = errors.isEmpty ? nil : "Some exports failed:\n\(errors.joined(separator: "\n"))"
        
        return (success, exportedURLs, errorMessage)
    }
    
    private func exportPeriodToJSON(_ sessions: [Session], periodStart: Date, directory: URL, splitBy: String) -> (success: Bool, url: URL?, error: String?) {
        let prefs = HistoryManager.shared.preferences
        
        // Generate filename
        let filename: String
        if splitBy == "none" {
            filename = "\(prefs.exportTitle.isEmpty ? "Sessions" : prefs.exportTitle).json"
        } else if splitBy == "month" {
            let monthName = formatMonthStart(periodStart)
            filename = "\(prefs.exportTitle.isEmpty ? "Sessions" : prefs.exportTitle)_\(monthName).json"
        } else {
            let weekName = formatWeekStart(periodStart)
            filename = "\(prefs.exportTitle.isEmpty ? "Sessions" : prefs.exportTitle)_\(weekName).json"
        }
        
        let fileURL = directory.appendingPathComponent(filename)
        
        do {
            let jsonData = try generateJSONContent(sessions, groupBy: prefs.lastExportGroupBy)
            try jsonData.write(to: fileURL)
            return (true, fileURL, nil)
        } catch {
            return (false, nil, "Failed to write JSON file: \(error.localizedDescription)")
        }
    }
    
    private func generateJSONContent(_ sessions: [Session], groupBy: String) throws -> Data {
        var jsonObject: [String: Any] = [:]
        
        // Add metadata
        jsonObject["exported_at"] = ISO8601DateFormatter().string(from: Date())
        jsonObject["export_title"] = HistoryManager.shared.preferences.exportTitle
        jsonObject["total_sessions"] = sessions.count
        
        // Calculate total duration
        let totalDuration = sessions.compactMap { $0.actualDuration }.reduce(0, +)
        jsonObject["total_duration_seconds"] = totalDuration
        jsonObject["total_duration_hours"] = totalDuration / 3600
        
        // Group sessions if requested
        if groupBy == "none" {
            jsonObject["sessions"] = try serializeSessions(sessions)
        } else {
            var groupedData: [String: Any] = [:]
            
            if groupBy == "customer" || groupBy == "both" {
                let groupedByCustomer = Dictionary(grouping: sessions) { $0.customer ?? "No Customer" }
                var customerData: [String: Any] = [:]
                
                for (customer, customerSessions) in groupedByCustomer {
                    if groupBy == "both" {
                        // Further group by project
                        let groupedByProject = Dictionary(grouping: customerSessions) { $0.project ?? "No Project" }
                        var projectData: [String: Any] = [:]
                        
                        for (project, projectSessions) in groupedByProject {
                            projectData[project] = try serializeSessions(projectSessions)
                        }
                        customerData[customer] = projectData
                    } else {
                        customerData[customer] = try serializeSessions(customerSessions)
                    }
                }
                groupedData = customerData
            } else if groupBy == "project" {
                let groupedByProject = Dictionary(grouping: sessions) { $0.project ?? "No Project" }
                var projectData: [String: Any] = [:]
                
                for (project, projectSessions) in groupedByProject {
                    projectData[project] = try serializeSessions(projectSessions)
                }
                groupedData = projectData
            }
            
            jsonObject["grouped_sessions"] = groupedData
        }
        
        return try JSONSerialization.data(withJSONObject: jsonObject, options: [.prettyPrinted, .sortedKeys])
    }
    
    private func serializeSessions(_ sessions: [Session]) throws -> [[String: Any]] {
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        return sessions.map { session in
            var sessionData: [String: Any] = [:]
            
            sessionData["id"] = session.id
            sessionData["description"] = session.description
            sessionData["start_time"] = isoFormatter.string(from: session.startTime)
            sessionData["start_date"] = isoFormatter.string(from: session.startTime)
            
            if let endTime = session.endTime {
                sessionData["end_time"] = isoFormatter.string(from: endTime)
            }
            
            if let customer = session.customer {
                sessionData["customer"] = customer
            }
            
            if let project = session.project {
                sessionData["project"] = project
            }
            
            sessionData["planned_duration_seconds"] = session.plannedDuration
            sessionData["planned_duration_minutes"] = session.plannedDuration / 60
            
            if let actualDuration = session.actualDuration {
                sessionData["actual_duration_seconds"] = actualDuration
                sessionData["actual_duration_minutes"] = actualDuration / 60
                sessionData["actual_duration_hours"] = actualDuration / 3600
            }
            
            sessionData["session_state"] = session.sessionState.rawValue
            sessionData["is_completed"] = session.isCompleted
            sessionData["is_manually_created"] = session.isManuallyCreated
            sessionData["is_edited"] = session.isEdited
            
            return sessionData
        }
    }
    
    // MARK: - Helper Methods (copied from CSVManager pattern)
    
    private func getExportDirectory() -> URL {
        let prefs = HistoryManager.shared.preferences
        if prefs.exportFolderPath.isEmpty {
            let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
            return documentsPath.appendingPathComponent("Mattato")
        } else {
            return URL(fileURLWithPath: prefs.exportFolderPath)
        }
    }
    
    private func groupSessionsByWeek(_ sessions: [Session]) -> [Date: [Session]] {
        let calendar = Calendar.current
        return Dictionary(grouping: sessions) { session in
            let weekInterval = calendar.dateInterval(of: .weekOfYear, for: session.startTime)
            return weekInterval?.start ?? session.startTime
        }
    }
    
    private func groupSessionsByMonth(_ sessions: [Session]) -> [Date: [Session]] {
        let calendar = Calendar.current
        return Dictionary(grouping: sessions) { session in
            let monthInterval = calendar.dateInterval(of: .month, for: session.startTime)
            return monthInterval?.start ?? session.startTime
        }
    }
    
    private func formatWeekStart(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return "Week_\(formatter.string(from: date))"
    }
    
    private func formatMonthStart(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM"
        return formatter.string(from: date)
    }
}