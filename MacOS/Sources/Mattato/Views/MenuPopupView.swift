import SwiftUI

struct MenuPopupView: View {
    @ObservedObject var timerManager: TimerManager
    @ObservedObject var historyManager: HistoryManager
    
    let onHistoryRequested: () -> Void
    let onCloseRequested: () -> Void
    
    @State private var description: String = ""
    @State private var selectedCustomer: String = ""
    @State private var selectedProject: String = ""
    @State private var sessionMinutes: Int = 25
    @State private var sessionSeconds: Int = 0
    @State private var minutesText: String = "25"
    @State private var secondsText: String = "00"
    @State private var isMinutesValid: Bool = true
    @State private var isSecondsValid: Bool = true
    @State private var timeSliderValue: Double = 1500.0 // 25 minutes in seconds
    @State private var defaultMinutesText: String = "25"
    @State private var defaultSecondsText: String = "00"
    @State private var isDefaultMinutesValid: Bool = true
    @State private var isDefaultSecondsValid: Bool = true
    @State private var desktopTimer: Bool = false
    @State private var desktopTimerSize: Double = 64.0
    @State private var playSoundEnabled: Bool = false
    @State private var selectedSoundName: String = "Glass"
    @State private var selectedAction: ActionType = .none
    
    enum ActionType: String, CaseIterable {
        case none = "Actions"
        case viewHistory = "📖 View History"
        case editHistory = "✏️ Edit History"
        case clearHistory = "🗑️ Clear History"
        case donate = "☕ Donate"
        case github = "🐙 GitHub"
        case quit = "❌ Quit"
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Spacer()
                Text(timerManager.formattedTime)
                    .font(.system(size: 24, weight: .bold, design: .monospaced))
                    .foregroundColor(.primary)
                Spacer()
            }
            
            HStack(spacing: 8) {
                Button(action: toggleTimer) {
                    HStack {
                        Image(systemName: buttonIcon)
                        Text(buttonText)
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                
                if timerManager.state != .idle {
                    Button(action: {
                        timerManager.resetTimer()
                    }) {
                        Text("reset")
                    }
                    .buttonStyle(.bordered)
                    .foregroundColor(.red)
                }
            }
            
            TextField("Description", text: $description)
                .textFieldStyle(.roundedBorder)
                .disabled(timerManager.state == .running || timerManager.state == .paused)
                .opacity(timerManager.state == .running || timerManager.state == .paused ? 0.6 : 1.0)
            
            HStack {
                Text("Customer:")
                
                Picker("", selection: $selectedCustomer) {
                    Text("(none)").tag("")
                    ForEach(historyManager.preferences.customers.sorted(by: <), id: \.self) { customer in
                        Text(customer).tag(customer)
                    }
                }
                .pickerStyle(.menu)
                .frame(width: 133)
                .disabled(timerManager.state == .running || timerManager.state == .paused)
                .opacity(timerManager.state == .running || timerManager.state == .paused ? 0.6 : 1.0)
                .onChange(of: selectedCustomer) { _ in updateSelectedCustomer() }
                
                Button("Manage...") {
                    showCustomerManager()
                }
                .buttonStyle(.bordered)
                .font(.caption)
                .disabled(timerManager.state == .running || timerManager.state == .paused)
                .opacity(timerManager.state == .running || timerManager.state == .paused ? 0.6 : 1.0)
                
                Spacer()
            }
            
            HStack {
                Text("Project:")
                
                Picker("", selection: $selectedProject) {
                    Text("(none)").tag("")
                    ForEach(historyManager.preferences.projects.sorted(by: <), id: \.self) { project in
                        Text(formatProjectDisplayText(project: project)).tag(project)
                    }
                }
                .pickerStyle(.menu)
                .frame(width: 133)
                .disabled(timerManager.state == .running || timerManager.state == .paused)
                .opacity(timerManager.state == .running || timerManager.state == .paused ? 0.6 : 1.0)
                .onChange(of: selectedProject) { _ in updateSelectedProject() }
                
                Button("Manage...") {
                    showProjectManager()
                }
                .buttonStyle(.bordered)
                .font(.caption)
                .disabled(timerManager.state == .running || timerManager.state == .paused)
                .opacity(timerManager.state == .running || timerManager.state == .paused ? 0.6 : 1.0)
                
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Session Length:")
                    
                    HStack(spacing: 4) {
                        TextField("MM", text: $minutesText)
                            .textFieldStyle(.roundedBorder)
                            .frame(width: 50)
                            .disabled(timerManager.state == .running || timerManager.state == .paused)
                            .overlay(
                                RoundedRectangle(cornerRadius: 6)
                                    .stroke(isMinutesValid ? Color.clear : Color.red, lineWidth: 2)
                            )
                            .onChange(of: minutesText) { newValue in
                                validateAndUpdateMinutes(newValue)
                            }
                            .onTapGesture {
                                clearTimeFields()
                            }
                            .onSubmit {
                                restoreDefaultIfEmpty()
                            }
                        
                        Text(":")
                        
                        TextField("SS", text: $secondsText)
                            .textFieldStyle(.roundedBorder)
                            .frame(width: 40)
                            .disabled(timerManager.state == .running || timerManager.state == .paused)
                            .overlay(
                                RoundedRectangle(cornerRadius: 6)
                                    .stroke(isSecondsValid ? Color.clear : Color.red, lineWidth: 2)
                            )
                            .onChange(of: secondsText) { newValue in
                                validateAndUpdateSeconds(newValue)
                            }
                            .onTapGesture {
                                clearTimeFields()
                            }
                            .onSubmit {
                                restoreDefaultIfEmpty()
                            }
                    }
                    
                    Spacer()
                }
                
                HStack {
                    Text("00:05")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Slider(value: $timeSliderValue, in: 300...14400, step: 60) // 5 minutes to 240 minutes
                        .onChange(of: timeSliderValue) { newValue in
                            updateTimeFromSlider(newValue)
                        }
                        .disabled(timerManager.state == .running || timerManager.state == .paused)
                    
                    Text("240:00")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Divider()
            
            VStack(alignment: .leading, spacing: 8) {
                Toggle("🤖 Desktop Timer", isOn: $desktopTimer)
                    .onChange(of: desktopTimer) { _ in updateDesktopTimer() }
                
                if desktopTimer {
                    HStack {
                        Text("Size:")
                        Text("SM")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Slider(value: $desktopTimerSize, in: 32...400, step: 8)
                            .onChange(of: desktopTimerSize) { _ in updateDesktopTimerSize() }
                        Text("LG")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("\(Int(desktopTimerSize))px")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Default time:")
                    
                    HStack(spacing: 4) {
                        TextField("MM", text: $defaultMinutesText)
                            .textFieldStyle(.roundedBorder)
                            .frame(width: 50)
                            .overlay(
                                RoundedRectangle(cornerRadius: 6)
                                    .stroke(isDefaultMinutesValid ? Color.clear : Color.red, lineWidth: 2)
                            )
                            .onChange(of: defaultMinutesText) { newValue in
                                validateAndUpdateDefaultMinutes(newValue)
                            }
                        
                        Text(":")
                        
                        TextField("SS", text: $defaultSecondsText)
                            .textFieldStyle(.roundedBorder)
                            .frame(width: 40)
                            .overlay(
                                RoundedRectangle(cornerRadius: 6)
                                    .stroke(isDefaultSecondsValid ? Color.clear : Color.red, lineWidth: 2)
                            )
                            .onChange(of: defaultSecondsText) { newValue in
                                validateAndUpdateDefaultSeconds(newValue)
                            }
                    }
                    
                    Spacer()
                }
            }
            
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Toggle("Play sound at 00:00", isOn: $playSoundEnabled)
                        .onChange(of: playSoundEnabled) { _ in updateSoundSettings() }
                    
                    if playSoundEnabled {
                        Picker("", selection: $selectedSoundName) {
                            ForEach(SoundManager.availableSounds, id: \.self) { sound in
                                Text(sound).tag(sound)
                            }
                        }
                        .pickerStyle(.menu)
                        .frame(width: 100)
                        .onChange(of: selectedSoundName) { _ in updateSoundSettings() }
                        
                        Button(action: testSound) {
                            Image(systemName: "play.circle")
                        }
                        .buttonStyle(.borderless)
                        .help("Test sound")
                    }
                }
                
            }
            
            
            Divider()
            
            HStack {
                Button("© matthew reider 2025") {
                    openMattatoLink()
                }
                .buttonStyle(.plain)
                .font(.caption)
                .foregroundColor(.secondary)
                
                Spacer()
                
                Picker("", selection: $selectedAction) {
                    ForEach(ActionType.allCases, id: \.self) { action in
                        Text(action.rawValue)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .tag(action)
                    }
                }
                .pickerStyle(.menu)
                .onChange(of: selectedAction) { action in
                    handleActionSelection(action)
                }
            }
        }
        .padding()
        .frame(width: 333, height: 460)
        .onAppear {
            loadInitialValues()
        }
        .onChange(of: sessionMinutes) { _ in updateSessionLength() }
        .onChange(of: sessionSeconds) { _ in updateSessionLength() }
        .onChange(of: timerManager.shouldClearFields) { shouldClear in
            if shouldClear {
                DispatchQueue.main.async {
                    clearFields()
                    timerManager.shouldClearFields = false
                }
            }
        }
    }
    
    private var buttonIcon: String {
        switch timerManager.state {
        case .idle:
            return "play.fill"
        case .running:
            return "pause.fill"
        case .paused:
            return "play.fill"
        case .completed:
            return "play.fill" // This should never be reached now
        }
    }
    
    private var buttonText: String {
        switch timerManager.state {
        case .idle:
            return "Start"
        case .running:
            return "Pause"
        case .paused:
            return "Resume"
        case .completed:
            return "Start" // This should never be reached now
        }
    }
    
    
    private func toggleTimer() {
        switch timerManager.state {
        case .idle, .paused:
            let customerName = selectedCustomer.isEmpty ? nil : selectedCustomer
            let projectName = selectedProject.isEmpty ? nil : selectedProject
            timerManager.startTimer(description: description, customer: customerName, project: projectName)
            var prefs = historyManager.preferences
            prefs.lastUsedDescription = description
            prefs.lastUsedCustomer = selectedCustomer
            prefs.lastUsedProject = selectedProject
            historyManager.updatePreferences(prefs)
        case .running:
            timerManager.pauseTimer()
        case .completed:
            break
        }
    }
    
    private func loadInitialValues() {
        let prefs = historyManager.preferences
        description = prefs.lastUsedDescription
        selectedCustomer = prefs.lastUsedCustomer
        selectedProject = prefs.lastUsedProject
        let totalSeconds = Int(prefs.defaultSessionLength)
        sessionMinutes = totalSeconds / 60
        sessionSeconds = totalSeconds % 60
        
        minutesText = String(sessionMinutes)
        secondsText = String(format: "%02d", sessionSeconds)
        timeSliderValue = prefs.defaultSessionLength
        
        defaultMinutesText = String(sessionMinutes)
        defaultSecondsText = String(format: "%02d", sessionSeconds)
        
        desktopTimer = prefs.desktopTimer
        desktopTimerSize = prefs.desktopTimerSize
        playSoundEnabled = prefs.playSoundEnabled
        selectedSoundName = prefs.selectedSoundName
    }
    
    private func updateSessionLength() {
        let totalSeconds = max(1, sessionMinutes * 60 + sessionSeconds)
        timerManager.sessionLength = TimeInterval(totalSeconds)
        
        var prefs = historyManager.preferences
        prefs.defaultSessionLength = TimeInterval(totalSeconds)
        historyManager.updatePreferences(prefs)
    }
    
    private func updateDesktopTimer() {
        var prefs = historyManager.preferences
        prefs.desktopTimer = desktopTimer
        historyManager.updatePreferences(prefs)
    }
    
    private func updateDesktopTimerSize() {
        var prefs = historyManager.preferences
        prefs.desktopTimerSize = desktopTimerSize
        historyManager.updatePreferences(prefs)
    }
    
    private func updateSoundSettings() {
        var prefs = historyManager.preferences
        prefs.playSoundEnabled = playSoundEnabled
        prefs.selectedSoundName = selectedSoundName
        historyManager.updatePreferences(prefs)
    }
    
    
    
    private func testSound() {
        SoundManager.shared.testSound(named: selectedSoundName)
    }
    
    private func clearFields() {
        description = ""
        selectedCustomer = ""
        selectedProject = ""
        
        let prefs = historyManager.preferences
        let totalSeconds = Int(prefs.defaultSessionLength)
        sessionMinutes = totalSeconds / 60
        sessionSeconds = totalSeconds % 60
        minutesText = String(sessionMinutes)
        secondsText = String(format: "%02d", sessionSeconds)
        timeSliderValue = prefs.defaultSessionLength
        
        var updatedPrefs = prefs
        updatedPrefs.lastUsedDescription = ""
        updatedPrefs.lastUsedCustomer = ""
        updatedPrefs.lastUsedProject = ""
        historyManager.updatePreferences(updatedPrefs)
    }
    
    private func validateAndUpdateMinutes(_ newValue: String) {
        let filtered = newValue.filter { $0.isNumber }
        
        let limited = String(filtered.prefix(3))
        
        if let minutes = Int(limited), minutes <= 999 {
            isMinutesValid = true
            sessionMinutes = minutes
            minutesText = limited
            
            let totalSeconds = max(300, min(14400, sessionMinutes * 60 + sessionSeconds))
            timeSliderValue = Double(totalSeconds)
            
            updateSessionLength()
        } else if limited.isEmpty {
            isMinutesValid = true
            sessionMinutes = 0
            minutesText = limited
        } else {
            isMinutesValid = false
            minutesText = limited
        }
    }
    
    private func validateAndUpdateSeconds(_ newValue: String) {
        let filtered = newValue.filter { $0.isNumber }
        
        let limited = String(filtered.prefix(2))
        
        if let seconds = Int(limited), seconds <= 59 {
            isSecondsValid = true
            sessionSeconds = seconds
            secondsText = limited  // Don't auto-format during typing
            
            let totalSeconds = max(300, min(14400, sessionMinutes * 60 + sessionSeconds))
            timeSliderValue = Double(totalSeconds)
            
            updateSessionLength()
        } else if limited.isEmpty {
            isSecondsValid = true
            sessionSeconds = 0
            secondsText = limited
        } else {
            isSecondsValid = false
            secondsText = limited
        }
    }
    
    private func updateTimeFromSlider(_ newValue: Double) {
        let totalSeconds = Int(newValue)
        let minutes = totalSeconds / 60
        let seconds = totalSeconds % 60
        
        sessionMinutes = minutes
        sessionSeconds = seconds
        minutesText = String(minutes)
        secondsText = String(format: "%02d", seconds)
        isMinutesValid = true
        isSecondsValid = true
        
        updateSessionLength()
    }
    
    private func formatSecondsField() {
        if !secondsText.isEmpty {
            secondsText = String(format: "%02d", sessionSeconds)
        }
    }
    
    private func clearTimeFields() {
        minutesText = ""
        secondsText = ""
    }
    
    private func restoreDefaultIfEmpty() {
        if minutesText.isEmpty || secondsText.isEmpty {
            let prefs = historyManager.preferences
            let totalSeconds = Int(prefs.defaultSessionLength)
            let minutes = totalSeconds / 60
            let seconds = totalSeconds % 60
            
            minutesText = String(minutes)
            secondsText = String(format: "%02d", seconds)
            sessionMinutes = minutes
            sessionSeconds = seconds
            timeSliderValue = prefs.defaultSessionLength
            isMinutesValid = true
            isSecondsValid = true
            
            updateSessionLength()
        } else {
            formatSecondsField()
        }
    }
    
    private func validateAndUpdateDefaultMinutes(_ newValue: String) {
        let filtered = newValue.filter { $0.isNumber }
        
        let limited = String(filtered.prefix(3))
        
        if let minutes = Int(limited), minutes <= 999 {
            isDefaultMinutesValid = true
            defaultMinutesText = limited
            updateDefaultTime()
        } else if limited.isEmpty {
            isDefaultMinutesValid = true
            defaultMinutesText = limited
        } else {
            isDefaultMinutesValid = false
            defaultMinutesText = limited
        }
    }
    
    private func validateAndUpdateDefaultSeconds(_ newValue: String) {
        let filtered = newValue.filter { $0.isNumber }
        
        let limited = String(filtered.prefix(2))
        
        if let seconds = Int(limited), seconds <= 59 {
            isDefaultSecondsValid = true
            defaultSecondsText = String(format: "%02d", seconds)
            updateDefaultTime()
        } else if limited.isEmpty {
            isDefaultSecondsValid = true
            defaultSecondsText = limited
        } else {
            isDefaultSecondsValid = false
            defaultSecondsText = limited
        }
    }
    
    private func updateDefaultTime() {
        guard let minutes = Int(defaultMinutesText), let seconds = Int(defaultSecondsText) else { return }
        
        let totalSeconds = max(1, minutes * 60 + seconds)
        
        var prefs = historyManager.preferences
        prefs.defaultSessionLength = TimeInterval(totalSeconds)
        historyManager.updatePreferences(prefs)
    }
    
    
    private func showHistoryError(_ error: String) {
        let alert = NSAlert()
        alert.messageText = "History Error"
        alert.informativeText = error
        alert.alertStyle = .warning
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }
    
    private func quitApp() {
        DispatchQueue.main.async {
            NSApp.terminate(nil)
        }
    }
    
    private func openDonateLink() {
        DispatchQueue.main.async {
            if let url = URL(string: "https://buymeacoffee.com/mreider") {
                NSWorkspace.shared.open(url)
            }
        }
    }
    
    private func openGitHubLink() {
        DispatchQueue.main.async {
            if let url = URL(string: "https://github.com/mreider/mattato") {
                NSWorkspace.shared.open(url)
            }
        }
    }
    
    private func openMattatoLink() {
        DispatchQueue.main.async {
            if let url = URL(string: "https://mattato.com") {
                NSWorkspace.shared.open(url)
            }
        }
    }
    
    private func handleActionSelection(_ action: ActionType) {
        switch action {
        case .none:
            break
        case .viewHistory:
            let result = historyManager.openHistoryWithPreferredEditor()
            if !result.success, let error = result.error {
                showHistoryError(error)
            }
        case .editHistory:
            showSessionHistoryWindow()
        case .clearHistory:
            showClearHistoryConfirmation()
        case .donate:
            openDonateLink()
        case .github:
            openGitHubLink()
        case .quit:
            quitApp()
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            selectedAction = .none
        }
    }
    
    private func showClearHistoryConfirmation() {
        let alert = NSAlert()
        alert.messageText = "Clear All History?"
        alert.informativeText = "This will permanently delete all saved Pomodoro sessions. This action cannot be undone."
        alert.alertStyle = .warning
        alert.addButton(withTitle: "Clear History")
        alert.addButton(withTitle: "Cancel")
        
        let response = alert.runModal()
        if response == .alertFirstButtonReturn {
            historyManager.clearHistory()
        }
    }
    
    
    
    private func updateSelectedCustomer() {
        var prefs = historyManager.preferences
        prefs.lastUsedCustomer = selectedCustomer
        historyManager.updatePreferences(prefs)
    }
    
    private func updateSelectedProject() {
        var prefs = historyManager.preferences
        prefs.lastUsedProject = selectedProject
        historyManager.updatePreferences(prefs)
    }
    
    private func showCustomerManager() {
        let customerWindow = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 400, height: 350),
            styleMask: [.titled, .closable],
            backing: .buffered,
            defer: false
        )
        
        customerWindow.title = "Manage Customers"
        customerWindow.backgroundColor = NSColor.controlBackgroundColor
        customerWindow.contentView = NSHostingView(
            rootView: CustomerManagerView(historyManager: historyManager)
                .background(Color.black.opacity(0.3))
        )
        customerWindow.center()
        customerWindow.level = .modalPanel
        customerWindow.makeKeyAndOrderFront(nil)
    }
    
    private func showProjectManager() {
        let projectWindow = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 600, height: 400),
            styleMask: [.titled, .closable],
            backing: .buffered,
            defer: false
        )
        
        projectWindow.title = "Manage Projects"
        projectWindow.backgroundColor = NSColor.controlBackgroundColor
        projectWindow.contentView = NSHostingView(
            rootView: ProjectManagerView(historyManager: historyManager)
                .background(Color.black.opacity(0.3))
        )
        projectWindow.center()
        projectWindow.level = .modalPanel
        projectWindow.makeKeyAndOrderFront(nil)
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
    
    private func showSessionHistoryWindow() {
        let historyWindow = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 900, height: 600),
            styleMask: [.titled, .closable, .resizable],
            backing: .buffered,
            defer: false
        )
        
        historyWindow.title = "Session History"
        historyWindow.backgroundColor = NSColor.controlBackgroundColor
        historyWindow.contentView = NSHostingView(
            rootView: SessionHistoryView(historyManager: historyManager)
                .background(Color.black.opacity(0.3))
        )
        historyWindow.center()
        historyWindow.level = .modalPanel
        historyWindow.makeKeyAndOrderFront(nil)
    }
}
