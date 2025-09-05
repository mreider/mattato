import Foundation
import AppKit
import Quartz

class PDFManager {
    static let shared = PDFManager()
    
    private init() {}
    
    func exportSessionsToPDF(_ sessions: [Session]) -> (success: Bool, urls: [URL], error: String?) {
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
            if prefs.pdfSplitByCustomer {
                let sessionsByCustomer = groupSessionsByCustomer(periodSessions)
                
                for (customer, customerSessions) in sessionsByCustomer {
                    let result = exportPeriodToPDF(customerSessions, periodStart: periodStart, directory: exportDirectory, splitBy: prefs.exportSplitBy, customer: customer)
                    
                    if result.success, let url = result.url {
                        exportedURLs.append(url)
                    } else {
                        let periodName = prefs.exportSplitBy == "month" ? formatMonthStart(periodStart) : formatWeekStart(periodStart)
                        let customerName = customer.isEmpty ? "no-customer" : customer
                        errors.append(result.error ?? "Unknown error for \(customerName) - \(prefs.exportSplitBy) \(periodName)")
                    }
                }
            } else {
                let result = exportPeriodToPDF(periodSessions, periodStart: periodStart, directory: exportDirectory, splitBy: prefs.exportSplitBy, customer: nil)
                
                if result.success, let url = result.url {
                    exportedURLs.append(url)
                } else {
                    let periodName = prefs.exportSplitBy == "month" ? formatMonthStart(periodStart) : formatWeekStart(periodStart)
                    errors.append(result.error ?? "Unknown error for \(prefs.exportSplitBy) \(periodName)")
                }
            }
        }
        
        if exportedURLs.isEmpty {
            return (false, [], errors.isEmpty ? "Failed to export PDF files" : errors.joined(separator: "\n"))
        }
        
        let success = errors.isEmpty
        let errorMessage = errors.isEmpty ? nil : "Some exports failed:\n\(errors.joined(separator: "\n"))"
        
        return (success, exportedURLs, errorMessage)
    }
    
    private func exportPeriodToPDF(_ sessions: [Session], periodStart: Date, directory: URL, splitBy: String, customer: String?) -> (success: Bool, url: URL?, error: String?) {
        let prefs = HistoryManager.shared.preferences
        let customerPrefix = (customer != nil && !customer!.isEmpty) ? "\(customer!.lowercased())-" : ""
        let filename: String
        
        if splitBy == "none" {
            filename = "\(customerPrefix)\(prefs.exportTitle.replacingOccurrences(of: " ", with: "-")).pdf"
        } else {
            let periodString = splitBy == "month" ? formatMonthStart(periodStart) : formatWeekStart(periodStart)
            filename = "\(customerPrefix)\(prefs.exportTitle.replacingOccurrences(of: " ", with: "-"))-\(periodString).pdf"
        }
        let fileURL = directory.appendingPathComponent(filename)
        
        let sortedSessions = sessions.sorted { $0.startTime < $1.startTime }
        
        let pdfContent = generatePDFContent(for: sortedSessions, periodStart: periodStart, splitBy: splitBy, customer: customer)
        
        guard let pdfDocument = createPDFDocument(content: pdfContent, filename: filename) else {
            return (false, nil, "Failed to create PDF document")
        }
        
        do {
            try pdfDocument.write(to: fileURL)
            return (true, fileURL, nil)
        } catch {
            return (false, nil, "Failed to write PDF file: \(error.localizedDescription)")
        }
    }
    
    private func generatePDFContent(for sessions: [Session], periodStart: Date, splitBy: String, customer: String?) -> String {
        let prefs = HistoryManager.shared.preferences
        var content = ""
        
        let periodRange: String
        if splitBy == "none" {
            if let firstSession = sessions.first, let lastSession = sessions.last {
                periodRange = "\(HistoryManager.shared.formatDateForDisplay(firstSession.startTime)) - \(HistoryManager.shared.formatDateForDisplay(lastSession.startTime))"
            } else {
                periodRange = ""
            }
        } else if splitBy == "month" {
            let monthEndDate = Calendar.current.date(byAdding: .month, value: 1, to: periodStart)?.addingTimeInterval(-1) ?? periodStart
            periodRange = "\(HistoryManager.shared.formatDateForDisplay(periodStart)) - \(HistoryManager.shared.formatDateForDisplay(monthEndDate))"
        } else {
            let weekEndDate = Calendar.current.date(byAdding: .day, value: 6, to: periodStart) ?? periodStart
            periodRange = "\(HistoryManager.shared.formatDateForDisplay(periodStart)) - \(HistoryManager.shared.formatDateForDisplay(weekEndDate))"
        }
        
        content += "# \(prefs.exportTitle)\n"
        if let customer = customer, !customer.isEmpty {
            content += "## \(customer.uppercased())"
            if !periodRange.isEmpty {
                content += " - \(splitBy == "none" ? "All Sessions" : (splitBy == "month" ? "Month" : "Week")) of \(periodRange)"
            }
        } else if !periodRange.isEmpty {
            content += "## \(splitBy == "none" ? "All Sessions" : (splitBy == "month" ? "Month" : "Week")) of \(periodRange)"
        }
        content += "\n\n"
        
        let sessionsByDate = Dictionary(grouping: sessions) { session in
            Calendar.current.startOfDay(for: session.startTime)
        }
        
        let sortedDates = sessionsByDate.keys.sorted()
        
        for date in sortedDates {
            guard let dateSessions = sessionsByDate[date] else { continue }
            let sortedDateSessions = dateSessions.sorted { $0.startTime < $1.startTime }
            
            content += "### \(HistoryManager.shared.formatDateForDisplay(date))\n\n"
            
            var totalDuration: TimeInterval = 0
            
            for session in sortedDateSessions {
                let startTime = formatTime(session.startTime)
                let endTime = session.endTime != nil ? formatTime(session.endTime!) : "(running)"
                let description = session.formattedDescription.isEmpty ? "Untitled Session" : session.formattedDescription
                
                content += "- \(startTime) - \(endTime): \(description)\n"
                
                if let actualDuration = session.actualDuration {
                    totalDuration += actualDuration
                }
            }
            
            if totalDuration > 0 {
                let hours = Int(totalDuration) / 3600
                let minutes = Int(totalDuration) % 3600 / 60
                content += "\n**Total for \(HistoryManager.shared.formatDateForDisplay(date)): \(hours)h \(minutes)m**\n\n"
            } else {
                content += "\n"
            }
        }
        
        let totalWeekDuration = sessions.compactMap { $0.actualDuration }.reduce(0, +)
        let totalHours = Int(totalWeekDuration) / 3600
        let totalMinutes = Int(totalWeekDuration) % 3600 / 60
        
        content += "---\n"
        let periodLabel = splitBy == "none" ? "all sessions" : (splitBy == "month" ? "month" : "week")
        content += "**Total for \(periodLabel): \(totalHours)h \(totalMinutes)m**\n"
        content += "**Sessions completed: \(sessions.count)**\n\n"
        content += "*Generated by Mattato Pomodoro Timer on \(HistoryManager.shared.formatDateForDisplay(Date()))*\n"
        
        return content
    }
    
    private func createPDFDocument(content: String, filename: String) -> Data? {
        let attributedString = createAttributedString(from: content)
        
        let pdfData = NSMutableData()
        guard let consumer = CGDataConsumer(data: pdfData),
              let pdfContext = CGContext(consumer: consumer, mediaBox: nil, nil) else {
            return nil
        }
        
        let pageRect = CGRect(x: 0, y: 0, width: 612, height: 792)
        let margin: CGFloat = 72
        let contentRect = CGRect(x: margin, y: margin, width: pageRect.width - 2 * margin, height: pageRect.height - 2 * margin)
        
        pdfContext.beginPDFPage(nil)
        
        let framesetter = CTFramesetterCreateWithAttributedString(attributedString)
        let path = CGPath(rect: contentRect, transform: nil)
        let frame = CTFramesetterCreateFrame(framesetter, CFRangeMake(0, 0), path, nil)
        
        pdfContext.textMatrix = CGAffineTransform.identity
        CTFrameDraw(frame, pdfContext)
        
        pdfContext.endPDFPage()
        pdfContext.closePDF()
        
        return pdfData as Data
    }
    
    private func createAttributedString(from markdownContent: String) -> NSAttributedString {
        let attributedString = NSMutableAttributedString()
        
        let lines = markdownContent.components(separatedBy: .newlines)
        
        for line in lines {
            let trimmedLine = line.trimmingCharacters(in: .whitespaces)
            
            if trimmedLine.hasPrefix("# ") {
                let text = String(trimmedLine.dropFirst(2))
                let attrs: [NSAttributedString.Key: Any] = [
                    .font: NSFont.boldSystemFont(ofSize: 20),
                    .foregroundColor: NSColor.black
                ]
                attributedString.append(NSAttributedString(string: text + "\n\n", attributes: attrs))
                
            } else if trimmedLine.hasPrefix("## ") {
                let text = String(trimmedLine.dropFirst(3))
                let attrs: [NSAttributedString.Key: Any] = [
                    .font: NSFont.boldSystemFont(ofSize: 16),
                    .foregroundColor: NSColor.black
                ]
                attributedString.append(NSAttributedString(string: text + "\n\n", attributes: attrs))
                
            } else if trimmedLine.hasPrefix("### ") {
                let text = String(trimmedLine.dropFirst(4))
                let attrs: [NSAttributedString.Key: Any] = [
                    .font: NSFont.boldSystemFont(ofSize: 14),
                    .foregroundColor: NSColor.black
                ]
                attributedString.append(NSAttributedString(string: text + "\n", attributes: attrs))
                
            } else if trimmedLine.hasPrefix("**") && trimmedLine.hasSuffix("**") {
                let text = String(trimmedLine.dropFirst(2).dropLast(2))
                let attrs: [NSAttributedString.Key: Any] = [
                    .font: NSFont.boldSystemFont(ofSize: 12),
                    .foregroundColor: NSColor.black
                ]
                attributedString.append(NSAttributedString(string: text + "\n", attributes: attrs))
                
            } else if trimmedLine.hasPrefix("- ") {
                let text = "• " + String(trimmedLine.dropFirst(2))
                let attrs: [NSAttributedString.Key: Any] = [
                    .font: NSFont.systemFont(ofSize: 11),
                    .foregroundColor: NSColor.black
                ]
                attributedString.append(NSAttributedString(string: text + "\n", attributes: attrs))
                
            } else if trimmedLine.hasPrefix("---") {
                attributedString.append(NSAttributedString(string: "\n"))
                
            } else if trimmedLine.hasPrefix("*") && trimmedLine.hasSuffix("*") {
                let text = String(trimmedLine.dropFirst(1).dropLast(1))
                let italicFont = NSFontManager.shared.convert(NSFont.systemFont(ofSize: 10), toHaveTrait: .italicFontMask)
                let attrs: [NSAttributedString.Key: Any] = [
                    .font: italicFont,
                    .foregroundColor: NSColor.gray
                ]
                attributedString.append(NSAttributedString(string: text + "\n", attributes: attrs))
                
            } else if !trimmedLine.isEmpty {
                let attrs: [NSAttributedString.Key: Any] = [
                    .font: NSFont.systemFont(ofSize: 11),
                    .foregroundColor: NSColor.black
                ]
                attributedString.append(NSAttributedString(string: trimmedLine + "\n", attributes: attrs))
            } else {
                attributedString.append(NSAttributedString(string: "\n"))
            }
        }
        
        return attributedString
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
    
    private func groupSessionsByCustomer(_ sessions: [Session]) -> [String: [Session]] {
        var sessionsByCustomer: [String: [Session]] = [:]
        
        for session in sessions {
            let customerKey = session.customer?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            
            if sessionsByCustomer[customerKey] == nil {
                sessionsByCustomer[customerKey] = []
            }
            sessionsByCustomer[customerKey]?.append(session)
        }
        
        return sessionsByCustomer
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
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }
    
    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        formatter.dateStyle = .none
        return formatter.string(from: date)
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