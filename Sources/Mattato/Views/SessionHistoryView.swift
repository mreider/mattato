import SwiftUI

struct SessionHistoryView: View {
    @ObservedObject var historyManager: HistoryManager
    @State private var searchText: String = ""
    @State private var selectedCustomerFilter: String = ""
    @State private var selectedProjectFilter: String = ""
    @State private var showingEditSession: Bool = false
    @State private var editingSession: Session? = nil
    @State private var sortOrder: SortOrder = .dateDescending
    @State private var selectedSessions: Set<String> = []
    @State private var selectAll: Bool = false
    @State private var showExportSettings: Bool = false
    @State private var showRoundingSettings: Bool = false
    
    // Export settings state
    @State private var selectedExportFormat: String = "Markdown"
    @State private var selectedDateRange: String = "current_week"
    @State private var selectedSplitBy: String = "none"
    @State private var selectedGroupBy: String = "none"
    @State private var customFromDate: Date = Date()
    @State private var customToDate: Date = Date()
    @State private var exportTitle: String = "Mattato Sessions"
    
    // Rounding settings state
    @State private var roundingTarget: String = "All" // "All" or "Selected"
    @State private var roundingInterval: String = "quarter" // "quarter", "half", "exact"
    
    enum SortOrder: String, CaseIterable {
        case dateDescending = "Date (Recent First)"
        case dateAscending = "Date (Oldest First)"
        case duration = "Duration"
        case customer = "Customer"
        case project = "Project"
    }
    
    private var filteredSessions: [Session] {
        var sessions = historyManager.sessions
        
        if !searchText.isEmpty {
            sessions = sessions.filter { session in
                session.description.lowercased().contains(searchText.lowercased()) ||
                (session.customer?.lowercased().contains(searchText.lowercased()) ?? false) ||
                (session.project?.lowercased().contains(searchText.lowercased()) ?? false)
            }
        }
        
        if !selectedCustomerFilter.isEmpty {
            sessions = sessions.filter { $0.customer == selectedCustomerFilter }
        }
        
        if !selectedProjectFilter.isEmpty {
            sessions = sessions.filter { $0.project == selectedProjectFilter }
        }
        
        switch sortOrder {
        case .dateDescending:
            return sessions.sorted { $0.startTime > $1.startTime }
        case .dateAscending:
            return sessions.sorted { $0.startTime < $1.startTime }
        case .duration:
            return sessions.sorted { ($0.actualDuration ?? 0) > ($1.actualDuration ?? 0) }
        case .customer:
            return sessions.sorted { ($0.customer ?? "") < ($1.customer ?? "") }
        case .project:
            return sessions.sorted { ($0.project ?? "") < ($1.project ?? "") }
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 16) {
                HStack {
                    Text("Search:")
                        .font(.caption)
                    TextField("Description, customer, or project", text: $searchText)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 200, height: 22)
                }
                
                HStack {
                    Text("Customer:")
                        .font(.caption)
                    Picker("", selection: $selectedCustomerFilter) {
                        Text("All").tag("")
                        ForEach(historyManager.preferences.customers.sorted(by: <), id: \.self) { customer in
                            Text(customer).tag(customer)
                        }
                    }
                    .pickerStyle(.menu)
                    .frame(width: 120, height: 22)
                }
                
                HStack {
                    Text("Project:")
                        .font(.caption)
                    Picker("", selection: $selectedProjectFilter) {
                        Text("All").tag("")
                        ForEach(historyManager.preferences.projects.sorted(by: <), id: \.self) { project in
                            Text(formatProjectDisplayText(project: project)).tag(project)
                        }
                    }
                    .pickerStyle(.menu)
                    .frame(width: 140, height: 22)
                }
                
                Spacer()
                
                Button("Add Session") {
                    editingSession = nil
                    showingEditSession = true
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.small)
            }
            .frame(height: 28)
            .padding(.vertical, 0)
            
            HStack {
                Toggle("Select All", isOn: Binding(
                    get: { selectAll },
                    set: { newValue in
                        selectAll = newValue
                        if newValue {
                            selectedSessions = Set(filteredSessions.map { $0.id })
                        } else {
                            selectedSessions.removeAll()
                        }
                    }
                ))
                .frame(width: 100)
                
                Text("Sort by:")
                Picker("", selection: $sortOrder) {
                    ForEach(SortOrder.allCases, id: \.self) { order in
                        Text(order.rawValue).tag(order)
                    }
                }
                .pickerStyle(.menu)
                .frame(width: 150)
                
                if !selectedSessions.isEmpty {
                    Button("Delete Selected (\(selectedSessions.count))") {
                        deleteSelectedSessions()
                    }
                    .buttonStyle(.bordered)
                }
                
                Spacer()
                
                Text("\(filteredSessions.count) sessions")
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
            .padding(.top, 4)
            
            sessionsTableView
                .padding(.top, 8)
            
            footerView
                .padding(.top, 8)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
        .frame(width: 900)
        .ignoresSafeArea()
        .onAppear {
            loadExportPreferences()
        }
        .sheet(isPresented: $showingEditSession) {
            SessionEditView(
                historyManager: historyManager,
                session: editingSession,
                onSave: { session in
                    saveSession(session)
                    showingEditSession = false
                    editingSession = nil
                },
                onCancel: {
                    showingEditSession = false
                    editingSession = nil
                }
            )
        }
    }
    
    private var exportSettingsViewCollapsed: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button(action: {
                showExportSettings.toggle()
            }) {
                HStack {
                    Image(systemName: showExportSettings ? "chevron.down" : "chevron.right")
                    Text("Export")
                        .font(.headline)
                        .fontWeight(.medium)
                    Spacer()
                }
            }
            .buttonStyle(.plain)
            .foregroundColor(.primary)
            
            if showExportSettings {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(alignment: .center, spacing: 8) {
                        Text("To")
                        
                        Picker("", selection: $selectedExportFormat) {
                            Text("Bear").tag("Bear")
                            Text("CSV").tag("CSV")
                            Text("ICS").tag("ICS")
                            Text("Markdown").tag("Markdown")
                            Text("PDF").tag("PDF")
                            Text("JSON").tag("JSON")
                        }
                        .pickerStyle(.menu)
                        .frame(width: 100)
                        
                        Text("for")
                        
                        Picker("", selection: $selectedDateRange) {
                            Text("current week").tag("current_week")
                            Text("last week").tag("last_week")
                            Text("current month").tag("current_month")
                            Text("last month").tag("last_month")
                            Text("custom").tag("custom")
                        }
                        .pickerStyle(.menu)
                        .frame(width: 120)
                        
                        Text("split by")
                        
                        Picker("", selection: $selectedSplitBy) {
                            Text("none").tag("none")
                            Text("week").tag("week")
                            Text("month").tag("month")
                        }
                        .pickerStyle(.menu)
                        .frame(width: 80)
                        .disabled(selectedExportFormat == "Bear")
                        
                        Text("and")
                        
                        Picker("", selection: $selectedGroupBy) {
                            Text("none").tag("none")
                            Text("customer").tag("customer")
                            Text("project").tag("project")
                            Text("both").tag("both")
                        }
                        .pickerStyle(.menu)
                        .frame(width: 80)
                        .disabled(selectedExportFormat == "Bear")
                        
                        Text("with title")
                        
                        TextField("Title", text: $exportTitle)
                            .textFieldStyle(.roundedBorder)
                            .frame(width: 150)
                            .disabled(selectedExportFormat == "Bear")
                        
                        Button("Go") {
                            executeExport()
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(!isExportReady)
                    }
                    
                    if selectedDateRange == "custom" {
                        HStack(spacing: 12) {
                            Text("From:")
                            DatePicker("", selection: $customFromDate, displayedComponents: .date)
                                .environment(\.locale, Locale.current)
                                .frame(width: 120)
                            
                            Text("To:")
                            DatePicker("", selection: $customToDate, displayedComponents: .date)
                                .environment(\.locale, Locale.current)
                                .frame(width: 120)
                        }
                        .padding(.leading, 20)
                    }
                    
                    if selectedExportFormat != "Bear" {
                        HStack(spacing: 12) {
                            Button("Browse...") {
                                selectExportDirectory()
                            }
                            .buttonStyle(.bordered)
                            
                            Text(exportDirectoryDisplay)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(.leading, 20)
                    }
                }
                .padding(.leading, 20)
                .padding(.bottom, 8)
            }
        }
        .background(Color(.controlBackgroundColor).opacity(0.5))
        .cornerRadius(8)
        .padding(.bottom, 4)
    }
    
    private var roundingSettingsViewCollapsed: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button(action: {
                showRoundingSettings.toggle()
            }) {
                HStack {
                    Image(systemName: showRoundingSettings ? "chevron.down" : "chevron.right")
                    Text("Round and Flatten")
                        .font(.headline)
                        .fontWeight(.medium)
                    Spacer()
                }
            }
            .buttonStyle(.plain)
            .foregroundColor(.primary)
            
            if showRoundingSettings {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(alignment: .center, spacing: 8) {
                        Text("Round")
                        
                        Picker("", selection: $roundingTarget) {
                            Text("All").tag("All")
                            Text("Selected").tag("Selected")
                        }
                        .pickerStyle(.menu)
                        .frame(width: 80)
                        .disabled(roundingTarget == "Selected" && selectedSessions.isEmpty)
                        
                        Text("Sessions to nearest")
                        
                        Picker("", selection: $roundingInterval) {
                            Text("quarter").tag("quarter")
                            Text("half").tag("half")
                            Text("exact").tag("exact")
                        }
                        .pickerStyle(.menu)
                        .frame(width: 80)
                        
                        Text("hour")
                        
                        Button("Go") {
                            executeRounding()
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(!isRoundingReady)
                    }
                }
                .padding(.leading, 20)
                .padding(.bottom, 8)
            }
        }
        .background(Color(.controlBackgroundColor).opacity(0.5))
        .cornerRadius(8)
        .padding(.bottom, 4)
    }
    
    private var sessionsTableView: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 1) {
                sessionHeaderRow
                    .background(Color(NSColor.controlBackgroundColor))
                
                ForEach(filteredSessions, id: \.id) { session in
                    sessionRow(session)
                        .background(Color(NSColor.alternatingContentBackgroundColors.first!))
                }
            }
        }
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(6)
    }
    
    private var sessionHeaderRow: some View {
        HStack(spacing: 8) {
            Text("Select")
                .font(.caption)
                .fontWeight(.semibold)
                .frame(width: 50, alignment: .center)
            
            Text("Date")
                .font(.caption)
                .fontWeight(.semibold)
                .frame(width: 80, alignment: .leading)
            
            Text("Start")
                .font(.caption)
                .fontWeight(.semibold)
                .frame(width: 50, alignment: .leading)
            
            Text("End")
                .font(.caption)
                .fontWeight(.semibold)
                .frame(width: 50, alignment: .leading)
            
            Text("Duration")
                .font(.caption)
                .fontWeight(.semibold)
                .frame(width: 60, alignment: .leading)
            
            Text("Customer")
                .font(.caption)
                .fontWeight(.semibold)
                .frame(width: 100, alignment: .leading)
            
            Text("Project")
                .font(.caption)
                .fontWeight(.semibold)
                .frame(width: 100, alignment: .leading)
            
            Text("Description")
                .font(.caption)
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            Text("Edit")
                .font(.caption)
                .fontWeight(.semibold)
                .frame(width: 40, alignment: .center)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
    }
    
    private func formatProjectDisplayText(project: String) -> String {
        let detail = historyManager.preferences.projectDetails[project] ?? ""
        if detail.isEmpty {
            return project
        }
        
        let maxDetailLength = 35
        let truncatedDetail = detail.count > maxDetailLength ? String(detail.prefix(maxDetailLength)) + ".." : detail
        
        return "\(project) — \(truncatedDetail)"
    }
    
    private func sessionRow(_ session: Session) -> some View {
        HStack(spacing: 8) {
            Toggle("", isOn: Binding(
                get: { selectedSessions.contains(session.id) },
                set: { isSelected in
                    if isSelected {
                        selectedSessions.insert(session.id)
                    } else {
                        selectedSessions.remove(session.id)
                        selectAll = false
                    }
                }
            ))
            .frame(width: 50, alignment: .center)
            
            Text(session.formattedDate)
                .font(.caption)
                .frame(width: 80, alignment: .leading)
            
            Text(session.formattedStartTime)
                .font(.caption)
                .frame(width: 50, alignment: .leading)
            
            Text(session.formattedEndTime)
                .font(.caption)
                .frame(width: 50, alignment: .leading)
            
            Text(formattedDuration(session.actualDuration ?? 0))
                .font(.caption)
                .frame(width: 60, alignment: .leading)
            
            Text(session.customer ?? "")
                .font(.caption)
                .frame(width: 100, alignment: .leading)
                .foregroundColor(session.customer != nil ? .primary : .secondary)
            
            Text(session.project ?? "")
                .font(.caption)
                .frame(width: 100, alignment: .leading)
                .foregroundColor(session.project != nil ? .primary : .secondary)
            
            HStack(spacing: 4) {
                Text(session.description)
                    .font(.caption)
                    .lineLimit(1)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                if session.isManuallyCreated {
                    Image(systemName: "plus.circle.fill")
                        .foregroundColor(.green)
                        .font(.system(size: 8))
                        .help("Manually created")
                }
                
                if session.isEdited {
                    Image(systemName: "pencil.circle.fill")
                        .foregroundColor(.orange)
                        .font(.system(size: 8))
                        .help("Edited")
                }
            }
            
            Button(action: {
                editingSession = session
                showingEditSession = true
            }) {
                Image(systemName: "pencil")
                    .foregroundColor(.blue)
            }
            .buttonStyle(.borderless)
            .help("Edit session")
            .frame(width: 40, alignment: .center)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
    }
    
    private var footerView: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                let totalDuration = filteredSessions.compactMap { $0.actualDuration }.reduce(0, +)
                let totalHours = totalDuration / 3600
                
                Text("Total time: \(String(format: "%.1f", totalHours)) hours")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                if !searchText.isEmpty || !selectedCustomerFilter.isEmpty || !selectedProjectFilter.isEmpty {
                    Button("Clear Filters") {
                        searchText = ""
                        selectedCustomerFilter = ""
                        selectedProjectFilter = ""
                    }
                    .font(.caption)
                }
            }
            
            exportSettingsViewCollapsed
            
            roundingSettingsViewCollapsed
        }
    }
    
    private func formattedDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = Int(duration) % 3600 / 60
        
        if hours > 0 {
            return "\(hours)h\(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
    
    private func saveSession(_ session: Session) {
        // Check if this is a new session or editing existing one
        if editingSession != nil {
            // Editing existing session
            historyManager.updateSession(session)
        } else {
            // Adding new session
            historyManager.addSession(session)
        }
    }
    
    private func deleteSelectedSessions() {
        let alert = NSAlert()
        let count = selectedSessions.count
        alert.messageText = "Delete \(count) Session\(count > 1 ? "s" : "")?"
        alert.informativeText = "Are you sure you want to delete the selected session\(count > 1 ? "s" : "")? This action cannot be undone."
        alert.addButton(withTitle: "Delete")
        alert.addButton(withTitle: "Cancel")
        alert.alertStyle = .warning
        
        let response = alert.runModal()
        if response == .alertFirstButtonReturn {
            for sessionId in selectedSessions {
                historyManager.deleteSession(sessionId)
            }
            selectedSessions.removeAll()
            selectAll = false
        }
    }
    
    private var isExportReady: Bool {
        return !exportTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    private var isRoundingReady: Bool {
        if roundingTarget == "Selected" {
            return !selectedSessions.isEmpty
        }
        return !historyManager.sessions.isEmpty
    }
    
    private var exportDirectoryDisplay: String {
        let folderPath = historyManager.preferences.exportFolderPath
        if folderPath.isEmpty {
            return "Default (~/Documents/Mattato/)"
        } else {
            let url = URL(fileURLWithPath: folderPath)
            return url.lastPathComponent
        }
    }
    
    private func selectExportDirectory() {
        let panel = NSOpenPanel()
        panel.canChooseFiles = false
        panel.canChooseDirectories = true
        panel.allowsMultipleSelection = false
        panel.prompt = "Choose Export Directory"
        
        let currentPath = historyManager.preferences.exportFolderPath
        if !currentPath.isEmpty {
            panel.directoryURL = URL(fileURLWithPath: currentPath)
        }
        
        if panel.runModal() == .OK {
            if let url = panel.url {
                var prefs = historyManager.preferences
                prefs.exportFolderPath = url.path
                historyManager.updatePreferences(prefs)
            }
        }
    }
    
    private func executeExport() {
        saveExportPreferences()
        
        switch selectedExportFormat {
        case "Bear":
            exportToBear()
        case "CSV":
            exportToCSV()
        case "ICS":
            exportToICS()
        case "Markdown":
            exportToMarkdown()
        case "PDF":
            exportToPDF()
        case "JSON":
            exportToJSON()
        default:
            break
        }
    }
    
    private func saveExportPreferences() {
        var prefs = historyManager.preferences
        prefs.lastExportFormat = selectedExportFormat
        prefs.lastExportDateRange = selectedDateRange
        prefs.lastExportSplitBy = selectedSplitBy
        prefs.lastExportGroupBy = selectedGroupBy
        prefs.exportTitle = exportTitle
        prefs.exportDateRange = selectedDateRange
        prefs.exportSplitBy = selectedSplitBy
        
        if selectedDateRange == "custom" {
            prefs.exportCustomFromDate = customFromDate
            prefs.exportCustomToDate = customToDate
        }
        
        historyManager.updatePreferences(prefs)
    }
    
    private func loadExportPreferences() {
        let prefs = historyManager.preferences
        selectedExportFormat = prefs.lastExportFormat
        selectedDateRange = prefs.lastExportDateRange
        selectedSplitBy = prefs.lastExportSplitBy
        selectedGroupBy = prefs.lastExportGroupBy
        exportTitle = prefs.exportTitle
        customFromDate = prefs.exportCustomFromDate
        customToDate = prefs.exportCustomToDate
    }
    
    private func getFilteredSessions() -> [Session] {
        return historyManager.getSessionsForExport()
    }
    
    private func exportToBear() {
        let result = historyManager.exportHistoryToBear()
        showExportResult(success: result.success, message: result.success ? "Bear export successful" : "Bear export failed: \(result.error ?? "Unknown error")", urls: [])
    }
    
    private func exportToMarkdown() {
        let result = historyManager.exportHistoryToFile()
        if result.success, let url = result.url {
            showExportResult(success: true, message: "Markdown exported successfully", urls: [url])
        } else {
            showExportResult(success: false, message: "Markdown export failed: \(result.error ?? "Unknown error")", urls: [])
        }
    }
    
    private func exportToCSV() {
        let sessions = getFilteredSessions()
        let result = CSVManager.shared.exportSessionsToCSV(sessions)
        showExportResult(success: result.success, message: result.success ? "CSV export successful" : "CSV export failed: \(result.error ?? "Unknown error")", urls: result.urls)
    }
    
    private func exportToICS() {
        let sessions = getFilteredSessions()
        let result = ICSManager.shared.exportSessionsToICS(sessions)
        showExportResult(success: result.success, message: result.success ? "ICS export successful" : "ICS export failed: \(result.error ?? "Unknown error")", urls: result.urls)
    }
    
    private func exportToPDF() {
        let sessions = getFilteredSessions()
        let result = PDFManager.shared.exportSessionsToPDF(sessions)
        showExportResult(success: result.success, message: result.success ? "PDF export successful" : "PDF export failed: \(result.error ?? "Unknown error")", urls: result.urls)
    }
    
    private func exportToJSON() {
        let sessions = getFilteredSessions()
        let result = JSONManager.shared.exportSessionsToJSON(sessions)
        showExportResult(success: result.success, message: result.success ? "JSON export successful" : "JSON export failed: \(result.error ?? "Unknown error")", urls: result.urls)
    }
    
    private func showExportResult(success: Bool, message: String, urls: [URL]) {
        let alert = NSAlert()
        alert.messageText = success ? "Export Successful" : "Export Failed"
        alert.informativeText = message
        alert.alertStyle = success ? .informational : .critical
        alert.addButton(withTitle: "OK")
        alert.runModal()
        
        if success && !urls.isEmpty {
            NSWorkspace.shared.activateFileViewerSelecting(urls)
        }
    }
    
    private func executeRounding() {
        let intervalMinutes: Int
        switch roundingInterval {
        case "quarter":
            intervalMinutes = 15
        case "half":
            intervalMinutes = 30
        case "exact":
            intervalMinutes = 60
        default:
            intervalMinutes = 15
        }
        
        showRoundingWarning(minutes: intervalMinutes, target: roundingTarget)
    }
    
    private func showClearHistoryConfirmation() {
        let alert = NSAlert()
        alert.messageText = "Clear All Sessions"
        alert.informativeText = "Are you sure you want to delete all sessions? This action cannot be undone."
        alert.alertStyle = .warning
        alert.addButton(withTitle: "Cancel")
        alert.addButton(withTitle: "Clear Sessions")
        
        let response = alert.runModal()
        if response == .alertSecondButtonReturn {
            historyManager.clearHistory()
        }
    }
    
    private func showRoundingWarning(minutes: Int, target: String) {
        let alert = NSAlert()
        let sessionCount = target == "All" ? historyManager.sessions.count : selectedSessions.count
        let targetText = target.lowercased()
        
        alert.messageText = "Round and Flatten Sessions"
        alert.informativeText = "Warning: this will round \(targetText) \(sessionCount) session\(sessionCount == 1 ? "" : "s") to the nearest \(minutes) minutes so that your sessions fit nicely into a schedule. If multiple sessions round to the same time period, the LONGER session will be kept and shorter ones will be deleted. Are you sure you want to do this?"
        alert.alertStyle = .warning
        alert.addButton(withTitle: "Cancel")
        alert.addButton(withTitle: "Round and Flatten")
        
        let response = alert.runModal()
        if response == .alertSecondButtonReturn {
            if target == "All" {
                roundAllSessions(to: minutes)
            } else {
                roundSelectedSessions(to: minutes)
            }
        }
    }
    
    private func roundAllSessions(to minutes: Int) {
        let roundingInterval = TimeInterval(minutes * 60)
        let sessions = historyManager.sessions
        let (finalSessions, deletedCount) = roundAndFlattenSessions(sessions, roundingInterval: roundingInterval)
        
        // Delete all original sessions
        for session in sessions {
            historyManager.deleteSession(session.id)
        }
        
        // Add the flattened sessions
        for session in finalSessions {
            historyManager.addSession(session)
        }
        
        let completionAlert = NSAlert()
        completionAlert.messageText = "Round and Flatten Complete"
        completionAlert.informativeText = "Sessions have been rounded to the nearest \(minutes) minutes. \(deletedCount) shorter sessions were removed due to conflicts."
        completionAlert.alertStyle = .informational
        completionAlert.addButton(withTitle: "OK")
        completionAlert.runModal()
    }
    
    private func roundSelectedSessions(to minutes: Int) {
        let roundingInterval = TimeInterval(minutes * 60)
        let sessionsToRound = historyManager.sessions.filter { selectedSessions.contains($0.id) }
        let (finalSessions, deletedCount) = roundAndFlattenSessions(sessionsToRound, roundingInterval: roundingInterval)
        
        // Delete the original selected sessions
        for session in sessionsToRound {
            historyManager.deleteSession(session.id)
        }
        
        // Add the flattened sessions
        for session in finalSessions {
            historyManager.addSession(session)
        }
        
        let completionAlert = NSAlert()
        completionAlert.messageText = "Round and Flatten Complete"
        completionAlert.informativeText = "\(sessionsToRound.count) sessions were processed. \(deletedCount) shorter sessions were removed due to conflicts."
        completionAlert.alertStyle = .informational
        completionAlert.addButton(withTitle: "OK")
        completionAlert.runModal()
        
        selectedSessions.removeAll()
        selectAll = false
    }
    
    private func roundAndFlattenSessions(_ sessions: [Session], roundingInterval: TimeInterval) -> ([Session], Int) {
        var roundedSessions: [Session] = []
        var conflictGroups: [String: [Session]] = [:]
        
        // Round each session and group by time period
        for session in sessions {
            var updatedSession = session
            
            let startTimeInterval = session.startTime.timeIntervalSince1970
            let roundedStartInterval = round(startTimeInterval / roundingInterval) * roundingInterval
            updatedSession.startTime = Date(timeIntervalSince1970: roundedStartInterval)
            
            if let endTime = session.endTime {
                let endTimeInterval = endTime.timeIntervalSince1970
                let roundedEndInterval = round(endTimeInterval / roundingInterval) * roundingInterval
                updatedSession.endTime = Date(timeIntervalSince1970: roundedEndInterval)
                updatedSession.plannedDuration = updatedSession.endTime!.timeIntervalSince(updatedSession.startTime)
            }
            
            updatedSession.markAsEdited()
            
            // Create a key based on rounded start and end times
            let startKey = Int(roundedStartInterval)
            let endKey = updatedSession.endTime != nil ? Int(updatedSession.endTime!.timeIntervalSince1970) : startKey
            let timeKey = "\(startKey)-\(endKey)"
            
            if conflictGroups[timeKey] == nil {
                conflictGroups[timeKey] = []
            }
            conflictGroups[timeKey]!.append(updatedSession)
        }
        
        var deletedCount = 0
        
        // For each time period, keep only the longest session
        for (_, conflictingSessions) in conflictGroups {
            if conflictingSessions.count == 1 {
                roundedSessions.append(conflictingSessions[0])
            } else {
                // Find the session with the longest actual duration
                let longestSession = conflictingSessions.max { session1, session2 in
                    let duration1 = session1.actualDuration ?? session1.plannedDuration
                    let duration2 = session2.actualDuration ?? session2.plannedDuration
                    return duration1 < duration2
                }
                
                if let longest = longestSession {
                    // Merge descriptions from all sessions
                    let descriptions = conflictingSessions.map { $0.description }.joined(separator: " + ")
                    var mergedSession = longest
                    mergedSession.description = descriptions
                    roundedSessions.append(mergedSession)
                }
                
                deletedCount += conflictingSessions.count - 1
            }
        }
        
        return (roundedSessions, deletedCount)
    }
    
}