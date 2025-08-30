import SwiftUI

struct MenuPopupView: View {
    @ObservedObject var timerManager: TimerManager
    @ObservedObject var historyManager: HistoryManager
    
    let onHistoryRequested: () -> Void
    let onCloseRequested: () -> Void
    
    @State private var description: String = ""
    @State private var sessionMinutes: Int = 25
    @State private var sessionSeconds: Int = 0
    @State private var desktopEffects: Bool = false
    @State private var playSoundEnabled: Bool = false
    @State private var selectedSoundName: String = "Glass"
    
    var body: some View {
        VStack(spacing: 16) {
            // Timer display
            Text(timerManager.formattedTime)
                .font(.system(size: 24, weight: .bold, design: .monospaced))
                .foregroundColor(timerManager.state == .completed ? .green : .primary)
            
            // Timer control buttons
            HStack(spacing: 8) {
                // Start/Pause button
                Button(action: toggleTimer) {
                    HStack {
                        Image(systemName: buttonIcon)
                        Text(buttonText)
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(timerManager.state == .completed)
                
                // Reset button (only show when timer is active)
                if timerManager.state != .idle {
                    Button(action: resetTimer) {
                        Text("reset")
                    }
                    .buttonStyle(.bordered)
                    .foregroundColor(.red)
                }
            }
            
            // Description field
            TextField("Description", text: $description)
                .textFieldStyle(.roundedBorder)
                .disabled(timerManager.state == .running)
            
            // Session length
            HStack {
                Text("Session Length:")
                Spacer()
                
                HStack(spacing: 4) {
                    TextField("MM", value: $sessionMinutes, format: .number.precision(.integerLength(2)))
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 40)
                        .disabled(timerManager.state == .running)
                    
                    Text(":")
                    
                    TextField("SS", value: $sessionSeconds, format: .number.precision(.integerLength(2)))
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 40)
                        .disabled(timerManager.state == .running)
                }
            }
            
            Divider()
            
            // Desktop effects option
            HStack {
                Toggle("🍅 Desktop Effects", isOn: $desktopEffects)
                    .onChange(of: desktopEffects) { _ in updateDesktopEffects() }
                Spacer()
            }
            
            // Sound settings - reorganized with controls on same line
            HStack {
                Toggle("Play Sound", isOn: $playSoundEnabled)
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
                
                Spacer()
            }
            
            
            // Action buttons - organized in three rows with labels
            VStack(spacing: 8) {
                // First row: History actions
                HStack(spacing: 8) {
                    Text("History:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Button("view") {
                        onHistoryRequested()
                    }
                    .buttonStyle(.bordered)
                    
                    Button("clear") {
                        showClearHistoryAlert()
                    }
                    .buttonStyle(.bordered)
                    .foregroundColor(.red)
                    
                    Spacer()
                }
                
                // Second row: Project actions
                HStack(spacing: 8) {
                    Text("Project:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Button("github") {
                        openGitHubLink()
                    }
                    .buttonStyle(.bordered)
                    
                    Button("donate") {
                        openDonateLink()
                    }
                    .buttonStyle(.bordered)
                    
                    Spacer()
                }
                
                // Third row: Quit button (right-justified, mustard yellow)
                HStack {
                    Spacer()
                    Button("quit") {
                        quitApp()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color(red: 0.8, green: 0.7, blue: 0.2)) // Mustard yellow
                }
            }
        }
        .padding()
        .frame(width: 280)
        .onAppear {
            loadInitialValues()
        }
        .onChange(of: sessionMinutes) { _ in updateSessionLength() }
        .onChange(of: sessionSeconds) { _ in updateSessionLength() }
        .onChange(of: timerManager.shouldClearFields) { shouldClear in
            if shouldClear {
                clearFields()
                timerManager.shouldClearFields = false // Reset the trigger
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
            return "checkmark.circle.fill"
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
            return "Completed"
        }
    }
    
    private func toggleTimer() {
        switch timerManager.state {
        case .idle, .paused:
            timerManager.startTimer(description: description)
            // Save description to preferences
            var prefs = historyManager.preferences
            prefs.lastUsedDescription = description
            historyManager.updatePreferences(prefs)
        case .running:
            timerManager.pauseTimer()
        case .completed:
            break // Disabled state
        }
    }
    
    private func loadInitialValues() {
        let prefs = historyManager.preferences
        description = prefs.lastUsedDescription
        let totalSeconds = Int(prefs.defaultSessionLength)
        sessionMinutes = totalSeconds / 60
        sessionSeconds = totalSeconds % 60
        desktopEffects = prefs.desktopEffects
        playSoundEnabled = prefs.playSoundEnabled
        selectedSoundName = prefs.selectedSoundName
    }
    
    private func updateSessionLength() {
        let totalSeconds = max(1, sessionMinutes * 60 + sessionSeconds)
        timerManager.sessionLength = TimeInterval(totalSeconds)
        
        // Save to preferences
        var prefs = historyManager.preferences
        prefs.defaultSessionLength = TimeInterval(totalSeconds)
        historyManager.updatePreferences(prefs)
    }
    
    private func updateDesktopEffects() {
        var prefs = historyManager.preferences
        prefs.desktopEffects = desktopEffects
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
    
    private func resetTimer() {
        timerManager.resetTimer()
    }
    
    private func clearFields() {
        // Clear description
        description = ""
        
        // Reset to default 25:00
        sessionMinutes = 25
        sessionSeconds = 0
        
        // Update preferences to clear last used description
        var prefs = historyManager.preferences
        prefs.lastUsedDescription = ""
        prefs.defaultSessionLength = 25 * 60 // Reset to default 25 minutes
        historyManager.updatePreferences(prefs)
    }
    
    private func showClearHistoryAlert() {
        let alert = NSAlert()
        alert.messageText = "Clear History"
        alert.informativeText = "Are you sure you want to clear all session history? This action cannot be undone."
        alert.alertStyle = .warning
        alert.addButton(withTitle: "Clear")
        alert.addButton(withTitle: "Cancel")
        
        if alert.runModal() == .alertFirstButtonReturn {
            historyManager.clearHistory()
        }
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
}
