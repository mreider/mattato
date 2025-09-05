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
    @State private var showBulkEditSettings: Bool = false
    
    // Export settings state
    @State private var selectedExportFormat: String = "Markdown"
    @State private var selectedDateRange: String = "current_week"
    @State private var selectedSplitBy: String = "none"
    @State private var selectedGroupBy: String = "none"
    @State private var customFromDate: Date = Date()
    @State private var customToDate: Date = Date()
    @State private var exportTitle: String = "Mattato Sessions"
    
    // Bulk edit settings state
    @State private var roundingTarget: String = "All" // "All" or "Selected"
    @State private var roundingInterval: String = "quarter" // "quarter", "half", "exact"
    
    // Inject sessions settings state
    @State private var injectFromTime: Date = {
        let calendar = Calendar.current
        var components = DateComponents()
        components.hour = 8
        components.minute = 0
        return calendar.date(from: components) ?? Date()
    }()
    @State private var injectToTime: Date = {
        let calendar = Calendar.current
        var components = DateComponents()
        components.hour = 17
        components.minute = 0
        return calendar.date(from: components) ?? Date()
    }()
    @State private var injectProject: String = "(none)"
    @State private var injectCustomer: String = "(none)"
    @State private var injectFromDate: Date = {
        let calendar = Calendar.current
        return calendar.dateInterval(of: .weekOfYear, for: Date())?.start ?? Date()
    }()
    @State private var injectToDate: Date = {
        let calendar = Calendar.current
        let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: Date())?.start ?? Date()
        return calendar.date(byAdding: .day, value: 6, to: startOfWeek) ?? Date()
    }()
    
    // Destroy sessions settings state
    @State private var destroyFromTime: Date = {
        let calendar = Calendar.current
        var components = DateComponents()
        components.hour = 8
        components.minute = 0
        return calendar.date(from: components) ?? Date()
    }()
    @State private var destroyToTime: Date = {
        let calendar = Calendar.current
        var components = DateComponents()
        components.hour = 17
        components.minute = 0
        return calendar.date(from: components) ?? Date()
    }()
    @State private var destroyFromDate: Date = {
        let calendar = Calendar.current
        return calendar.dateInterval(of: .weekOfYear, for: Date())?.start ?? Date()
    }()
    @State private var destroyToDate: Date = {
        let calendar = Calendar.current
        let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: Date())?.start ?? Date()
        return calendar.date(byAdding: .day, value: 6, to: startOfWeek) ?? Date()
    }()
    
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
    
    private var bulkEditSettingsViewCollapsed: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button(action: {
                showBulkEditSettings.toggle()
            }) {
                HStack {
                    Image(systemName: showBulkEditSettings ? "chevron.down" : "chevron.right")
                    Text("Bulk Edit")
                        .font(.headline)
                        .fontWeight(.medium)
                    Spacer()
                }
            }
            .buttonStyle(.plain)
            .foregroundColor(.primary)
            
            if showBulkEditSettings {
                VStack(alignment: .leading, spacing: 16) {
                    // Round and Flatten section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Round and Flatten")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                        
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
                    
                    Divider()
                    
                    // Inject Sessions section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Inject Sessions")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                        
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(alignment: .center, spacing: 8) {
                                Text("Inject sessions from")
                                
                                DatePicker("", selection: $injectFromTime, displayedComponents: .hourAndMinute)
                                    .frame(width: 80)
                                
                                Text("to")
                                
                                DatePicker("", selection: $injectToTime, displayedComponents: .hourAndMinute)
                                    .frame(width: 80)
                                
                                Text("with")
                                
                                Picker("", selection: $injectProject) {
                                    Text("(none)").tag("(none)")
                                    ForEach(historyManager.preferences.projects.sorted(by: <), id: \.self) { project in
                                        Text(formatProjectDisplayText(project: project)).tag(project)
                                    }
                                }
                                .pickerStyle(.menu)
                                .frame(width: 140)
                                
                                Text("and")
                                
                                Picker("", selection: $injectCustomer) {
                                    Text("(none)").tag("(none)")
                                    ForEach(historyManager.preferences.customers.sorted(by: <), id: \.self) { customer in
                                        Text(customer).tag(customer)
                                    }
                                }
                                .pickerStyle(.menu)
                                .frame(width: 120)
                            }
                            
                            HStack(alignment: .center, spacing: 8) {
                                Text("for days between")
                                
                                DatePicker("", selection: $injectFromDate, displayedComponents: .date)
                                    .frame(width: 120)
                                
                                Text("and")
                                
                                DatePicker("", selection: $injectToDate, displayedComponents: .date)
                                    .frame(width: 120)
                                
                                Spacer()
                                
                                Button("Go") {
                                    executeInjectSessions()
                                }
                                .buttonStyle(.borderedProminent)
                                .disabled(!isInjectSessionsReady)
                            }
                            
                            Text("Note: No existing sessions will be removed, only open times will be filled.")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    Divider()
                    
                    // Destroy Sessions section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Destroy Sessions")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                        
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(alignment: .center, spacing: 8) {
                                Text("Destroy sessions between")
                                
                                DatePicker("", selection: $destroyFromTime, displayedComponents: .hourAndMinute)
                                    .frame(width: 80)
                                
                                Text("and")
                                
                                DatePicker("", selection: $destroyToTime, displayedComponents: .hourAndMinute)
                                    .frame(width: 80)
                                
                                Spacer()
                            }
                            
                            HStack(alignment: .center, spacing: 8) {
                                Text("for days between")
                                
                                DatePicker("", selection: $destroyFromDate, displayedComponents: .date)
                                    .frame(width: 120)
                                
                                Text("and")
                                
                                DatePicker("", selection: $destroyToDate, displayedComponents: .date)
                                    .frame(width: 120)
                                
                                Spacer()
                                
                                Button("Go") {
                                    executeDestroySessions()
                                }
                                .buttonStyle(.borderedProminent)
                                .disabled(!isDestroySessionsReady)
                            }
                        }
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
            
            bulkEditSettingsViewCollapsed
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
    
    private var isInjectSessionsReady: Bool {
        let validTimeRange = injectFromTime < injectToTime
        let validSelections = !injectProject.isEmpty && !injectCustomer.isEmpty
        let validDateRange = injectFromDate < injectToDate
        
        return validTimeRange && validSelections && validDateRange
    }
    
    private var isDestroySessionsReady: Bool {
        let validTimeRange = destroyFromTime < destroyToTime
        let validDateRange = destroyFromDate < destroyToDate
        
        return validTimeRange && validDateRange
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
        alert.informativeText = "Warning: this will round \(targetText) \(sessionCount) session\(sessionCount == 1 ? "" : "s") to \(minutes)-minute time chunks based on when they started. Sessions will expand or contract to fill entire time chunks. If multiple sessions fall into the same time chunk, the SECOND session will be kept and earlier ones will be deleted. Are you sure you want to do this?"
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
        completionAlert.informativeText = "Sessions have been rounded to \(minutes)-minute time chunks. \(deletedCount) sessions were removed due to conflicts."
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
        completionAlert.informativeText = "\(sessionsToRound.count) sessions were processed. \(deletedCount) sessions were removed due to conflicts."
        completionAlert.alertStyle = .informational
        completionAlert.addButton(withTitle: "OK")
        completionAlert.runModal()
        
        selectedSessions.removeAll()
        selectAll = false
    }
    
    private func roundAndFlattenSessions(_ sessions: [Session], roundingInterval: TimeInterval) -> ([Session], Int) {
        var roundedSessions: [Session] = []
        var conflictGroups: [String: [(Session, Date)]] = [:]
        
        // Round each session to expand/contract into time chunks
        for session in sessions {
            var updatedSession = session
            
            // Store original start time for sorting later
            let originalStartTime = session.startTime
            
            // Determine which time chunk the session STARTED in
            let startTimeInterval = session.startTime.timeIntervalSince1970
            let chunkStart = floor(startTimeInterval / roundingInterval) * roundingInterval
            let chunkEnd = chunkStart + roundingInterval
            
            // Expand session to fill the entire time chunk
            updatedSession.startTime = Date(timeIntervalSince1970: chunkStart)
            updatedSession.endTime = Date(timeIntervalSince1970: chunkEnd)
            updatedSession.plannedDuration = roundingInterval
            
            updatedSession.markAsEdited()
            
            // Group by time chunk, storing both session and original start time
            let timeKey = "\(Int(chunkStart))"
            
            if conflictGroups[timeKey] == nil {
                conflictGroups[timeKey] = []
            }
            conflictGroups[timeKey]!.append((updatedSession, originalStartTime))
        }
        
        var deletedCount = 0
        
        // For each time chunk, resolve conflicts by keeping the SECOND session
        for (_, conflictingSessionData) in conflictGroups {
            if conflictingSessionData.count == 1 {
                roundedSessions.append(conflictingSessionData[0].0)
            } else {
                // Sort by original start time to determine order
                let sortedSessionData = conflictingSessionData.sorted { $0.1 < $1.1 }
                
                // Keep the SECOND session (index 1), clobbering the first
                let sessionDataToKeep = sortedSessionData.count > 1 ? sortedSessionData[1] : sortedSessionData[0]
                
                // Merge descriptions from all sessions
                let descriptions = sortedSessionData.map { $0.0.description }.joined(separator: " + ")
                var mergedSession = sessionDataToKeep.0
                mergedSession.description = descriptions
                
                roundedSessions.append(mergedSession)
                deletedCount += conflictingSessionData.count - 1
            }
        }
        
        return (roundedSessions, deletedCount)
    }
    
    private func executeInjectSessions() {
        showInjectSessionsWarning()
    }
    
    private func showInjectSessionsWarning() {
        let alert = NSAlert()
        let calendar = Calendar.current
        let fromDate = calendar.startOfDay(for: injectFromDate)
        let toDate = calendar.startOfDay(for: injectToDate)
        
        let filteredSessions = historyManager.sessions.filter { session in
            let sessionDay = calendar.startOfDay(for: session.startTime)
            return sessionDay >= fromDate && sessionDay <= toDate
        }
        let uniqueDays = Set(filteredSessions.map { calendar.startOfDay(for: $0.startTime) }).count
        
        alert.messageText = "Inject Sessions"
        let projectText = injectProject == "(none)" ? "no project" : "project '\(injectProject)'"
        let customerText = injectCustomer == "(none)" ? "no customer" : "customer '\(injectCustomer)'"
        alert.informativeText = "This will analyze \(uniqueDays) day\(uniqueDays == 1 ? "" : "s") of sessions in the selected date range and inject new sessions to fill any gaps between \(formatTime(injectFromTime)) and \(formatTime(injectToTime)) each day. New sessions will use \(projectText) and \(customerText). Are you sure you want to do this?"
        alert.alertStyle = .warning
        alert.addButton(withTitle: "Cancel")
        alert.addButton(withTitle: "Inject Sessions")
        
        let response = alert.runModal()
        if response == .alertSecondButtonReturn {
            performInjectSessions()
        }
    }
    
    private func performInjectSessions() {
        let calendar = Calendar.current
        let fromDate = calendar.startOfDay(for: injectFromDate)
        let toDate = calendar.startOfDay(for: injectToDate)
        
        // Filter sessions to only those in the selected date range
        let sessions = historyManager.sessions.filter { session in
            let sessionDay = calendar.startOfDay(for: session.startTime)
            return sessionDay >= fromDate && sessionDay <= toDate
        }
        
        // Group sessions by day
        var sessionsByDay: [Date: [Session]] = [:]
        for session in sessions {
            let dayStart = calendar.startOfDay(for: session.startTime)
            if sessionsByDay[dayStart] == nil {
                sessionsByDay[dayStart] = []
            }
            sessionsByDay[dayStart]!.append(session)
        }
        
        // Also create empty entries for days in range that have no sessions
        var currentDay = fromDate
        while currentDay <= toDate {
            if sessionsByDay[currentDay] == nil {
                sessionsByDay[currentDay] = []
            }
            currentDay = calendar.date(byAdding: .day, value: 1, to: currentDay) ?? currentDay
        }
        
        var injectedCount = 0
        
        // Process each day
        for (dayStart, daySessions) in sessionsByDay {
            // Create time range for this day
            let fromTime = calendar.date(bySettingHour: calendar.component(.hour, from: injectFromTime),
                                       minute: calendar.component(.minute, from: injectFromTime),
                                       second: 0,
                                       of: dayStart) ?? dayStart
            let toTime = calendar.date(bySettingHour: calendar.component(.hour, from: injectToTime),
                                     minute: calendar.component(.minute, from: injectToTime),
                                     second: 0,
                                     of: dayStart) ?? dayStart
            
            // Sort sessions by start time
            let sortedSessions = daySessions.sorted { $0.startTime < $1.startTime }
            
            // Find gaps and inject sessions
            var currentTime = fromTime
            
            for session in sortedSessions {
                // If there's a gap before this session, fill it
                if session.startTime > currentTime && currentTime < toTime {
                    let gapEnd = min(session.startTime, toTime)
                    let gapSession = createGapSession(from: currentTime, to: gapEnd)
                    historyManager.addSession(gapSession)
                    injectedCount += 1
                }
                
                // Update current time to end of this session (or its start time if no end time)
                if let endTime = session.endTime {
                    currentTime = max(currentTime, endTime)
                } else {
                    currentTime = max(currentTime, session.startTime.addingTimeInterval(session.plannedDuration))
                }
            }
            
            // Fill any remaining gap at the end of the day
            if currentTime < toTime {
                let gapSession = createGapSession(from: currentTime, to: toTime)
                historyManager.addSession(gapSession)
                injectedCount += 1
            }
        }
        
        // Show completion message
        let completionAlert = NSAlert()
        completionAlert.messageText = "Inject Sessions Complete"
        completionAlert.informativeText = "\(injectedCount) Sessions were injected across \(sessionsByDay.count) day\(sessionsByDay.count == 1 ? "" : "s")."
        completionAlert.alertStyle = .informational
        completionAlert.addButton(withTitle: "OK")
        completionAlert.runModal()
    }
    
    private func createGapSession(from startTime: Date, to endTime: Date) -> Session {
        let description = "Work session (\(formatTime(startTime)) - \(formatTime(endTime)))"
        let customer = injectCustomer == "(none)" ? nil : injectCustomer
        let project = injectProject == "(none)" ? nil : injectProject
        
        return Session(
            id: UUID().uuidString,
            startTime: startTime,
            endTime: endTime,
            description: description,
            customer: customer,
            project: project
        )
    }
    
    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
    
    private func executeDestroySessions() {
        showDestroySessionsWarning()
    }
    
    private func showDestroySessionsWarning() {
        let alert = NSAlert()
        let calendar = Calendar.current
        let fromDate = calendar.startOfDay(for: destroyFromDate)
        let toDate = calendar.startOfDay(for: destroyToDate)
        
        let sessionsToDelete = historyManager.sessions.filter { session in
            let sessionDay = calendar.startOfDay(for: session.startTime)
            guard sessionDay >= fromDate && sessionDay <= toDate else { return false }
            
            // Check if session overlaps with the time range
            let sessionStartTime = calendar.dateComponents([.hour, .minute], from: session.startTime)
            let sessionEndTime: DateComponents
            if let endTime = session.endTime {
                sessionEndTime = calendar.dateComponents([.hour, .minute], from: endTime)
            } else {
                let calculatedEndTime = session.startTime.addingTimeInterval(session.plannedDuration)
                sessionEndTime = calendar.dateComponents([.hour, .minute], from: calculatedEndTime)
            }
            
            let destroyStartTime = calendar.dateComponents([.hour, .minute], from: destroyFromTime)
            let destroyEndTime = calendar.dateComponents([.hour, .minute], from: destroyToTime)
            
            // Convert to minutes for easier comparison
            let sessionStartMinutes = (sessionStartTime.hour ?? 0) * 60 + (sessionStartTime.minute ?? 0)
            let sessionEndMinutes = (sessionEndTime.hour ?? 0) * 60 + (sessionEndTime.minute ?? 0)
            let destroyStartMinutes = (destroyStartTime.hour ?? 0) * 60 + (destroyStartTime.minute ?? 0)
            let destroyEndMinutes = (destroyEndTime.hour ?? 0) * 60 + (destroyEndTime.minute ?? 0)
            
            // Check for overlap
            return sessionStartMinutes < destroyEndMinutes && sessionEndMinutes > destroyStartMinutes
        }
        
        alert.messageText = "Destroy Sessions"
        alert.informativeText = "This will permanently delete \(sessionsToDelete.count) session\(sessionsToDelete.count == 1 ? "" : "s") that overlap with the time range \(formatTime(destroyFromTime)) to \(formatTime(destroyToTime)) between \(formatDate(destroyFromDate)) and \(formatDate(destroyToDate)). This action cannot be undone. Are you sure you want to do this?"
        alert.alertStyle = .critical
        alert.addButton(withTitle: "Cancel")
        alert.addButton(withTitle: "Delete Sessions")
        
        let response = alert.runModal()
        if response == .alertSecondButtonReturn {
            performDestroySessions(sessionsToDelete)
        }
    }
    
    private func performDestroySessions(_ sessionsToDelete: [Session]) {
        for session in sessionsToDelete {
            historyManager.deleteSession(session.id)
        }
        
        // Show completion message
        let completionAlert = NSAlert()
        completionAlert.messageText = "Destroy Sessions Complete"
        completionAlert.informativeText = "\(sessionsToDelete.count) session\(sessionsToDelete.count == 1 ? "" : "s") \(sessionsToDelete.count == 1 ? "was" : "were") deleted."
        completionAlert.alertStyle = .informational
        completionAlert.addButton(withTitle: "OK")
        completionAlert.runModal()
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        return formatter.string(from: date)
    }
    
}