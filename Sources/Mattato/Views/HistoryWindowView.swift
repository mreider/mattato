import SwiftUI

struct HistoryWindowView: View {
    @ObservedObject var historyManager: HistoryManager
    @State private var searchText = ""
    @State private var showingExportAlert = false
    @State private var exportedFileURL: URL?
    @State private var showingBearExportAlert = false
    @State private var showingOutlookExportAlert = false
    @State private var showingErrorAlert = false
    @State private var errorMessage = ""
    
    var body: some View {
        VStack(spacing: 0) {
            // Header with stats and controls
            headerView
            
            Divider()
            
            // Bear Tag Checkbox Section
            bearTagCheckboxSection
            
            Divider()
            
            // Markdown Export Section
            markdownExportSection
            
            Divider()
            
            // Bear Export Section
            bearExportSection
            
            Divider()
            
            // Outlook Export Section - Temporarily disabled
            // outlookExportSection
            
            // Divider()
            
            // Search bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                
                TextField("Search sessions...", text: $searchText)
                    .textFieldStyle(.plain)
            }
            .padding()
            .background(Color(NSColor.controlBackgroundColor))
            
            // Sessions list
            if filteredSessions.isEmpty {
                emptyStateView
            } else {
                sessionsList
            }
        }
        .frame(minWidth: 600, minHeight: 400)
        .alert("History Exported", isPresented: $showingExportAlert) {
            Button("Show in Finder") {
                if let url = exportedFileURL {
                    NSWorkspace.shared.selectFile(url.path, inFileViewerRootedAtPath: "")
                }
            }
            Button("OK") { }
        } message: {
            Text("Your Pomodoro history has been exported to your Documents folder.")
        }
        .alert("Exported to Bear", isPresented: $showingBearExportAlert) {
            Button("OK") { }
        } message: {
            Text("Your Pomodoro history has been exported to Bear.")
        }
        .alert("Exported to Outlook", isPresented: $showingOutlookExportAlert) {
            Button("OK") { }
        } message: {
            Text("Your completed Pomodoro sessions have been added to Outlook Calendar as events.")
        }
        .alert("Export Error", isPresented: $showingErrorAlert) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private var headerView: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Pomodoro History")
                    .font(.title2)
                    .fontWeight(.semibold)
                
                Text("\(historyManager.completedSessionsCount) sessions • \(historyManager.formattedTotalTime) total")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Button("Clear All") {
                showClearAllAlert()
            }
            .buttonStyle(.bordered)
            .foregroundColor(.red)
        }
        .padding()
    }
    
    private var outlookExportSection: some View {
        HStack {
            Text("📅 Export to Outlook Calendar")
                .font(.headline)
                .fontWeight(.medium)
            
            Spacer()
            
            Button("Go") {
                exportToOutlookDirect()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor).opacity(0.3))
    }
    
    private var markdownExportSection: some View {
        HStack {
            Text("📄 Export to Markdown File")
                .font(.headline)
                .fontWeight(.medium)
            
            Spacer()
            
            Button("Go") {
                exportHistory()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor).opacity(0.3))
    }
    
    private var bearTagCheckboxSection: some View {
        HStack {
            Toggle(isOn: Binding(
                get: { historyManager.preferences.includeBearTag },
                set: { newValue in
                    var updatedPreferences = historyManager.preferences
                    updatedPreferences.includeBearTag = newValue
                    historyManager.updatePreferences(updatedPreferences)
                }
            )) {
                HStack(spacing: 8) {
                    Text("🏷️")
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Include Bear tag in exports")
                            .font(.headline)
                            .fontWeight(.medium)
                        Text("Adds #mattato/\(getStartOfWeekDateForDisplay()) to exported content")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .toggleStyle(.checkbox)
            
            Spacer()
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor).opacity(0.1))
    }
    
    private var bearExportSection: some View {
        HStack {
            Text("🐻 Export to Bear Note")
                .font(.headline)
                .fontWeight(.medium)
            
            Spacer()
            
            Button("Go") {
                exportToBear()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor).opacity(0.3))
    }
    
    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "clock.badge.checkmark")
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            
            Text("No Sessions Yet")
                .font(.title2)
                .fontWeight(.medium)
            
            Text("Complete your first Pomodoro session to see it here.")
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var sessionsList: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(groupedSessions.keys.sorted(by: >), id: \.self) { date in
                    Section {
                        ForEach(groupedSessions[date] ?? []) { session in
                            SessionRowView(session: session)
                        }
                    } header: {
                        DateHeaderView(date: date)
                    }
                }
            }
        }
    }
    
    private var filteredSessions: [Session] {
        // Show all sessions (started, paused, completed)
        let allSessions = historyManager.sessions
        
        if searchText.isEmpty {
            return allSessions
        } else {
            return allSessions.filter { session in
                session.description.localizedCaseInsensitiveContains(searchText) ||
                session.formattedDate.localizedCaseInsensitiveContains(searchText)
            }
        }
    }
    
    private var groupedSessions: [Date: [Session]] {
        Dictionary(grouping: filteredSessions) { session in
            Calendar.current.startOfDay(for: session.startTime)
        }
    }
    
    private func exportHistory() {
        let result = historyManager.exportHistoryToFile()
        if result.success, let url = result.url {
            exportedFileURL = url
            showingExportAlert = true
        } else if let error = result.error {
            errorMessage = error
            showingErrorAlert = true
        }
    }
    
    private func exportToBear() {
        let result = historyManager.exportHistoryToBear()
        if result.success {
            showingBearExportAlert = true
        } else if let error = result.error {
            errorMessage = error
            showingErrorAlert = true
        }
    }
    
    private func exportToOutlook() {
        let result = historyManager.exportHistoryToOutlook()
        if result.success {
            // Check if we have detailed success information to show
            if let successDetails = result.error, successDetails.contains("success:") {
                errorMessage = successDetails // Use error message field to show detailed success info
                showingErrorAlert = true // Use error alert to show the detailed message
            } else {
                showingOutlookExportAlert = true
            }
        } else if let error = result.error {
            errorMessage = error
            showingErrorAlert = true
        }
    }
    
    private func exportToOutlookDirect() {
        let completedSessions = historyManager.sessions.filter { $0.isCompleted }
        
        guard !completedSessions.isEmpty else {
            errorMessage = "No completed sessions to export. You need to complete at least one Pomodoro session first."
            showingErrorAlert = true
            return
        }
        
        // Export directly using web-based automation
        let result = OutlookManager.shared.exportSessionsToOutlookWithUI(completedSessions)
        
        if result.success {
            if let message = result.error {
                // Show success message with details
                errorMessage = message
                showingOutlookExportAlert = true
            } else {
                showingOutlookExportAlert = true
            }
        } else {
            errorMessage = result.error ?? "Failed to export sessions to Outlook."
            showingErrorAlert = true
        }
    }
    
    private func getStartOfWeekDateForDisplay() -> String {
        let calendar = Calendar.current
        let today = Date()
        
        // Get the start of the week (Monday)
        let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: today)?.start ?? today
        
        // Format as YYYY-MM-DD
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: startOfWeek)
    }
    
    private func showClearAllAlert() {
        let alert = NSAlert()
        alert.messageText = "Clear All History"
        alert.informativeText = "Are you sure you want to delete all \(historyManager.completedSessionsCount) completed sessions? This action cannot be undone."
        alert.alertStyle = .critical
        alert.addButton(withTitle: "Delete All")
        alert.addButton(withTitle: "Cancel")
        
        if alert.runModal() == .alertFirstButtonReturn {
            historyManager.clearHistory()
        }
    }
}

struct DateHeaderView: View {
    let date: Date
    
    private var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .full
        return formatter.string(from: date)
    }
    
    var body: some View {
        HStack {
            Text(formattedDate)
                .font(.headline)
                .fontWeight(.semibold)
            
            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(NSColor.controlBackgroundColor))
    }
}

struct SessionRowView: View {
    let session: Session
    
    var body: some View {
        HStack {
            Text(sessionLineText)
                .font(.system(.body, design: .monospaced))
                .foregroundColor(.primary)
                .lineLimit(nil)
            
            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 4)
        .background(Color.clear)
        .contentShape(Rectangle())
    }
    
    private var sessionLineText: String {
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
}
