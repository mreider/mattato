import SwiftUI
import AppKit


class SettingsWindow: NSWindow {
    private var timerManager: TimerManager
    private var historyManager: HistoryManager
    private var onWindowClosed: (() -> Void)?
    
    init(timerManager: TimerManager, preferences: UserPreferences) {
        self.timerManager = timerManager
        self.historyManager = HistoryManager.shared
        self.onWindowClosed = nil
        
        let windowWidth: CGFloat = 550
        let windowHeight: CGFloat = 360
        
        let screenFrame = NSScreen.main?.frame ?? NSRect(x: 0, y: 0, width: 1920, height: 1080)
        let xPosition = (screenFrame.width - windowWidth) / 2
        let yPosition = (screenFrame.height - windowHeight) / 2
        
        super.init(
            contentRect: NSRect(x: xPosition, y: yPosition, width: windowWidth, height: windowHeight),
            styleMask: [.titled, .closable],
            backing: .buffered,
            defer: false
        )
        
        setupWindow()
        setupContent()
    }
    
    private func setupWindow() {
        self.title = "Settings"
        self.backgroundColor = NSColor.white
        self.isOpaque = true
        self.hasShadow = true
        self.level = NSWindow.Level.floating
        self.isMovableByWindowBackground = false
        self.delegate = nil
    }
    
    private func setupContent() {
        let hostingView = NSHostingView(rootView: SettingsView(
            timerManager: timerManager,
            historyManager: historyManager
        ))
        hostingView.frame = self.contentView?.bounds ?? NSRect.zero
        self.contentView = hostingView
    }
    
    deinit {
        self.delegate = nil
        self.contentView = nil
    }
}


struct SettingsView: View {
    @ObservedObject var timerManager: TimerManager
    @ObservedObject var historyManager: HistoryManager
    
    // Custom formatter for session length (1-999 minutes)
    private var sessionLengthFormatter: NumberFormatter {
        let formatter = NumberFormatter()
        formatter.minimum = 1
        formatter.maximum = 999
        formatter.allowsFloats = false
        return formatter
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            GroupBox {
                VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("Default Session Length:")
                                TextField("Minutes", value: Binding(
                                    get: { Int(historyManager.preferences.defaultSessionLength / 60) },
                                    set: { newValue in 
                                        let clampedValue = max(1, min(999, newValue))
                                        historyManager.preferences.defaultSessionLength = TimeInterval(clampedValue * 60)
                                        historyManager.objectWillChange.send()
                                        historyManager.updatePreferences(historyManager.preferences)
                                    }
                                ), formatter: sessionLengthFormatter)
                                .onSubmit {
                                    let currentMinutes = Int(historyManager.preferences.defaultSessionLength / 60)
                                    let clampedValue = max(1, min(999, currentMinutes))
                                    historyManager.preferences.defaultSessionLength = TimeInterval(clampedValue * 60)
                                    historyManager.updatePreferences(historyManager.preferences)
                                }
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .frame(width: 45)
                                Text("minutes")
                                Spacer()
                            }
                            
                            VStack(alignment: .leading) {
                                HStack {
                                    Text("Size:")
                                    Spacer()
                                    Text("\(Int(historyManager.preferences.desktopTimerSize))px")
                                }
                                Slider(value: Binding(
                                    get: { historyManager.preferences.desktopTimerSize },
                                    set: { newValue in
                                        historyManager.preferences.desktopTimerSize = newValue
                                        historyManager.objectWillChange.send()
                                        historyManager.updatePreferences(historyManager.preferences)
                                    }
                                ), in: 128...512, step: 8)
                            }
                            
                            HStack {
                                Toggle("Show Customer", isOn: Binding(
                                    get: { historyManager.preferences.showCustomerDropdown },
                                    set: { newValue in
                                        historyManager.preferences.showCustomerDropdown = newValue
                                        historyManager.objectWillChange.send()
                                        historyManager.updatePreferences(historyManager.preferences)
                                    }
                                ))
                                Spacer()
                            }
                            
                            HStack {
                                Toggle("Show Project", isOn: Binding(
                                    get: { historyManager.preferences.showProjectDropdown },
                                    set: { newValue in
                                        historyManager.preferences.showProjectDropdown = newValue
                                        historyManager.objectWillChange.send()
                                        historyManager.updatePreferences(historyManager.preferences)
                                    }
                                ))
                                Spacer()
                            }
                }
                .padding()
            }
            
            GroupBox {
                VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Toggle("Play Sound", isOn: Binding(
                                    get: { historyManager.preferences.playSoundEnabled },
                                    set: { newValue in
                                        historyManager.preferences.playSoundEnabled = newValue
                                        historyManager.objectWillChange.send()
                                        historyManager.updatePreferences(historyManager.preferences)
                                    }
                                ))
                                
                                if historyManager.preferences.playSoundEnabled {
                                    Picker("", selection: Binding(
                                        get: { historyManager.preferences.selectedSoundName },
                                        set: { newValue in
                                            historyManager.preferences.selectedSoundName = newValue
                                            historyManager.objectWillChange.send()
                                            historyManager.updatePreferences(historyManager.preferences)
                                        }
                                    )) {
                                        Text("Glass").tag("Glass")
                                        Text("Ping").tag("Ping")
                                        Text("Pop").tag("Pop")
                                        Text("Purr").tag("Purr")
                                    }
                                    .pickerStyle(MenuPickerStyle())
                                    .frame(width: 100)
                                    
                                    Button("▶") {
                                        testSound()
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                                
                                Spacer()
                            }
                }
                .padding()
            }
            
            GroupBox {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Button("Export DB") {
                                    exportDatabase()
                                }
                                .buttonStyle(.bordered)
                                
                                Button("Import DB") {
                                    showImportDialog()
                                }
                                .buttonStyle(.bordered)
                                
                                Spacer()
                            }
                            
                            Divider()
                            
                            HStack {
                                Button("Choose...") {
                                    chooseDBExportFolder()
                                }
                                
                                Text(historyManager.preferences.dbExportFolderPath.isEmpty ? "Default (~/Documents/Mattato/)" : historyManager.preferences.dbExportFolderPath)
                                    .foregroundColor(.secondary)
                                    .lineLimit(1)
                                    .font(.caption)
                                
                                Spacer()
                            }
                        }
                        .padding()
            }
            
            Spacer()
        }
        .padding(EdgeInsets(top: 29, leading: 20, bottom: 20, trailing: 20))
    }
    
    
    
    
    private func testSound() {
        SoundManager.shared.playSound(named: historyManager.preferences.selectedSoundName)
    }
    
    private func updatePreference<T>(_ keyPath: WritableKeyPath<UserPreferences, T>, to value: T) {
        historyManager.preferences[keyPath: keyPath] = value
        historyManager.updatePreferences(historyManager.preferences)
    }
    
    private func chooseDBExportFolder() {
        let panel = NSOpenPanel()
        panel.canChooseFiles = false
        panel.canChooseDirectories = true
        panel.allowsMultipleSelection = false
        panel.prompt = "Choose Database Export Folder"
        
        if panel.runModal() == .OK {
            if let url = panel.url {
                historyManager.preferences.dbExportFolderPath = url.path
                historyManager.updatePreferences(historyManager.preferences)
            }
        }
    }
    
    private func exportDatabase() {
        let result = historyManager.exportDatabase()
        
        let alert = NSAlert()
        if result.success {
            alert.messageText = "Database Export Successful"
            alert.informativeText = "Database exported successfully to: \(result.url?.lastPathComponent ?? "file")"
            alert.alertStyle = .informational
            
            if let url = result.url {
                NSWorkspace.shared.selectFile(url.path, inFileViewerRootedAtPath: url.deletingLastPathComponent().path)
            }
        } else {
            alert.messageText = "Database Export Failed"
            alert.informativeText = result.error ?? "Unknown error occurred"
            alert.alertStyle = .critical
        }
        
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }
    
    private func showImportDialog() {
        let alert = NSAlert()
        alert.messageText = "Import Database"
        alert.informativeText = "⚠️ WARNING: This will replace ALL current sessions and settings with the imported data. This action cannot be undone.\n\nAre you sure you want to continue?"
        alert.alertStyle = .warning
        alert.addButton(withTitle: "Cancel")
        alert.addButton(withTitle: "Import")
        
        let response = alert.runModal()
        if response == .alertSecondButtonReturn {
            chooseImportFile()
        }
    }
    
    private func chooseImportFile() {
        let panel = NSOpenPanel()
        panel.canChooseFiles = true
        panel.canChooseDirectories = false
        panel.allowsMultipleSelection = false
        panel.allowedContentTypes = [.json]
        panel.prompt = "Choose Database File"
        
        if panel.runModal() == .OK {
            if let url = panel.url {
                importDatabase(from: url)
            }
        }
    }
    
    private func importDatabase(from url: URL) {
        let result = historyManager.importDatabase(from: url)
        
        let alert = NSAlert()
        if result.success {
            alert.messageText = "Database Import Successful"
            alert.informativeText = "Database imported successfully. All sessions and settings have been replaced."
            alert.alertStyle = .informational
            
            NSWorkspace.shared.selectFile(url.path, inFileViewerRootedAtPath: url.deletingLastPathComponent().path)
        } else {
            alert.messageText = "Database Import Failed"
            alert.informativeText = result.error ?? "Unknown error occurred"
            alert.alertStyle = .critical
        }
        
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }
    
    
}