import SwiftUI
import AppKit

class DesktopTimerWindow: NSWindow, ObservableObject {
    private var timerManager: TimerManager
    private var preferences: UserPreferences
    @Published var currentSize: Double
    
    init(timerManager: TimerManager, preferences: UserPreferences) {
        self.timerManager = timerManager
        self.preferences = preferences
        self.currentSize = preferences.desktopTimerSize
        
        let screenFrame = NSScreen.main?.frame ?? NSRect(x: 0, y: 0, width: 1920, height: 1080)
        let menuBarHeight: CGFloat = 24
        let xPosition = screenFrame.width - preferences.desktopTimerSize - 20
        let yPosition = screenFrame.height - menuBarHeight - preferences.desktopTimerSize - 10
        
        super.init(
            contentRect: NSRect(x: xPosition, y: yPosition, width: preferences.desktopTimerSize, height: preferences.desktopTimerSize),
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )
        
        setupWindow()
        setupContent()
    }
    
    private func setupWindow() {
        self.isOpaque = false
        self.backgroundColor = NSColor.clear
        self.level = NSWindow.Level.floating
        self.collectionBehavior = [.canJoinAllSpaces, .stationary]
        self.isMovableByWindowBackground = true
        self.hasShadow = false
        self.ignoresMouseEvents = false
        self.acceptsMouseMovedEvents = true
    }
    
    override var canBecomeKey: Bool {
        return true
    }
    
    private func setupContent() {
        let hostingView = NSHostingView(rootView: DesktopTimerView(
            timerManager: timerManager,
            window: self
        ))
        hostingView.frame = self.contentView?.bounds ?? NSRect.zero
        self.contentView = hostingView
    }
    
    func updateSize(_ newSize: Double) {
        currentSize = newSize
        
        let newFrame = NSRect(
            x: self.frame.origin.x,
            y: self.frame.origin.y,
            width: newSize,
            height: newSize
        )
        self.setFrame(newFrame, display: true, animate: true)
        
        if let hostingView = self.contentView {
            hostingView.frame = NSRect(x: 0, y: 0, width: newSize, height: newSize)
        }
    }
    
}

struct DesktopTimerView: View {
    @ObservedObject var timerManager: TimerManager
    @ObservedObject var window: DesktopTimerWindow
    @ObservedObject var historyManager = HistoryManager.shared
    
    @State private var isEditingTime: Bool = false
    @State private var timeInput: String = "25:00"
    @State private var editingMinutes: Int = 25
    @State private var editingSeconds: Int = 0
    @State private var sessionDescription: String = "Work Session"
    @State private var selectedCustomer: String = ""
    @State private var selectedProject: String = ""
    @State private var showInfoOverlay: Bool = false
    
    private var minutesFormatter: NumberFormatter {
        let formatter = NumberFormatter()
        formatter.minimum = 0
        formatter.maximum = 999
        formatter.allowsFloats = false
        return formatter
    }
    
    private var secondsFormatter: NumberFormatter {
        let formatter = NumberFormatter()
        formatter.minimum = 0
        formatter.maximum = 59
        formatter.allowsFloats = false
        formatter.minimumIntegerDigits = 2
        return formatter
    }
    
    var size: Double {
        window.currentSize
    }
    
    private var currentMinutes: Int {
        Int(timerManager.timeRemaining) / 60
    }
    
    private var currentSeconds: Int {
        Int(timerManager.timeRemaining) % 60
    }
    
    
    private var infoOverlayView: some View {
        ZStack {
            VStack(spacing: size * 0.025) {
                HStack {
                    Spacer()
                    Button(action: { showInfoOverlay = false }) {
                        Image(systemName: "xmark")
                            .font(.system(size: size * 0.05, weight: .bold))
                            .foregroundColor(.white)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                .padding(.bottom, size * -0.05)
                
                if timerManager.state == .idle {
                    // Smart time input field inspired by TimeCockpit behavior
                    TextField("MM:SS", text: $timeInput)
                        .textFieldStyle(.plain)
                        .multilineTextAlignment(.center)
                        .font(.system(size: size * 0.08, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                        .frame(width: size * 0.4)
                        .padding(size * 0.01)
                        .background(Color.black.opacity(0.3))
                        .cornerRadius(6)
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(Color.white.opacity(0.3), lineWidth: 1)
                        )
                        .onAppear {
                            let minutes = Int(timerManager.timeRemaining) / 60
                            let seconds = Int(timerManager.timeRemaining) % 60
                            timeInput = String(format: "%d:%02d", minutes, seconds)
                        }
                        .onChange(of: timeInput) { newValue in
                            parseSmartTimeInput(newValue)
                        }
                        .onSubmit {
                            finalizeTimeInput()
                        }
                }
                
                TextField("Session description", text: $sessionDescription)
                    .textFieldStyle(.plain)
                    .font(.system(size: size * 0.07, weight: .medium))
                    .foregroundColor(.white)
                    .padding(size * 0.015)
                    .background(Color.black.opacity(0.3))
                    .cornerRadius(6)
                    .overlay(
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(Color.white.opacity(0.3), lineWidth: 1)
                    )
                    .onSubmit {
                        if sessionDescription.count > 40 {
                            sessionDescription = String(sessionDescription.prefix(40))
                        }
                    }
                
                if historyManager.preferences.showCustomerDropdown {
                    Picker("Customer", selection: $selectedCustomer) {
                        Text("None").tag("")
                        ForEach(historyManager.preferences.customers.sorted(by: <), id: \.self) { customer in
                            Text(customer).tag(customer)
                        }
                    }
                    .pickerStyle(.menu)
                    .font(.system(size: size * 0.04))
                    .foregroundColor(.white)
                }
                
                if historyManager.preferences.showProjectDropdown {
                    Picker("Project", selection: $selectedProject) {
                        Text("None").tag("")
                        ForEach(historyManager.preferences.projects.sorted(by: <), id: \.self) { project in
                            let detail = historyManager.preferences.projectDetails[project] ?? ""
                            let displayText = detail.isEmpty ? project : "\(project) — \(detail.count > 35 ? String(detail.prefix(35)) + ".." : detail)"
                            Text(displayText).tag(project)
                        }
                    }
                    .pickerStyle(.menu)
                    .font(.system(size: size * 0.04))
                    .foregroundColor(.white)
                }
            }
            .padding(size * 0.04)
            .background(Color.black.opacity(0.7))
            .cornerRadius(size * 0.04)
            .frame(maxWidth: size * 0.8)
            .onTapGesture {
            }
        }
        .frame(width: size, height: size)
        .contentShape(Rectangle())
        .onTapGesture {
            showInfoOverlay = false
        }
    }
    
    private func parseSmartTimeInput(_ input: String) {
        // Smart parsing inspired by TimeCockpit time field behavior
        let cleanInput = input.filter { $0.isNumber }
        
        // Handle different input lengths intelligently
        switch cleanInput.count {
        case 0:
            // Empty input - keep current values
            return
        case 1:
            // Single digit: assume it's minutes (e.g., "2" -> 2:00)
            if let minutes = Int(cleanInput) {
                editingMinutes = min(minutes, 999)
                editingSeconds = 0
                updateFormattedTimeInput()
            }
        case 2:
            // Two digits: assume it's minutes (e.g., "25" -> 25:00)
            if let minutes = Int(cleanInput) {
                editingMinutes = min(minutes, 999)
                editingSeconds = 0
                updateFormattedTimeInput()
            }
        case 3:
            // Three digits: first digit is minutes, last two are seconds (e.g., "130" -> 1:30)
            let minuteStr = String(cleanInput.prefix(1))
            let secondStr = String(cleanInput.suffix(2))
            if let minutes = Int(minuteStr), let seconds = Int(secondStr) {
                editingMinutes = minutes
                editingSeconds = min(seconds, 59)
                updateFormattedTimeInput()
            }
        case 4:
            // Four digits: first two are minutes, last two are seconds (e.g., "2530" -> 25:30)
            let minuteStr = String(cleanInput.prefix(2))
            let secondStr = String(cleanInput.suffix(2))
            if let minutes = Int(minuteStr), let seconds = Int(secondStr) {
                editingMinutes = min(minutes, 999)
                editingSeconds = min(seconds, 59)
                updateFormattedTimeInput()
            }
        default:
            // More than 4 digits: take first 3 as minutes, next 2 as seconds
            let minuteStr = String(cleanInput.prefix(3))
            let secondStr = String(cleanInput.dropFirst(3).prefix(2))
            if let minutes = Int(minuteStr), let seconds = Int(secondStr.isEmpty ? "0" : secondStr) {
                editingMinutes = min(minutes, 999)
                editingSeconds = min(seconds, 59)
                updateFormattedTimeInput()
            }
        }
        
        updateTimerFromInputs()
    }
    
    private func updateFormattedTimeInput() {
        // Update the displayed format without triggering onChange again
        let formatted = String(format: "%d:%02d", editingMinutes, editingSeconds)
        if timeInput != formatted {
            timeInput = formatted
        }
    }
    
    private func finalizeTimeInput() {
        // Ensure proper formatting when user finishes editing
        updateFormattedTimeInput()
        updateTimerFromInputs()
        isEditingTime = false
    }
    
    // Legacy functions kept for compatibility
    private func formatAndMoveToSeconds() {
        editingMinutes = max(0, min(999, editingMinutes))
        updateTimerFromInputs()
    }
    
    private func formatAndSaveSeconds() {
        editingSeconds = max(0, min(59, editingSeconds))
        updateTimerFromInputs()
    }
    
    private func updateTimerFromInputs() {
        let newTimeRemaining = TimeInterval(editingMinutes * 60 + editingSeconds)
        timerManager.timeRemaining = newTimeRemaining
        timerManager.sessionLength = newTimeRemaining
    }
    
    private func saveTimer() {
        let newTimeRemaining = TimeInterval(editingMinutes * 60 + editingSeconds)
        timerManager.timeRemaining = newTimeRemaining
        timerManager.sessionLength = newTimeRemaining
        
        isEditingTime = false
    }
    
    var body: some View {
        ZStack {
            if let robotImage = loadRobotImage() {
                Image(nsImage: robotImage)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: size, height: size)
            } else {
                Text("🤖")
                    .font(.system(size: size * 0.8))
            }
            
            
            ZStack {
                Text(safeFormattedTime)
                    .font(.system(size: size * 0.10, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
                    .offset(y: size * -0.10)
                
                HStack {
                    Spacer()
                    HStack(spacing: size * 0.02) {
                        Button(action: { showInfoOverlay.toggle() }) {
                            Image(systemName: "gearshape")
                                .font(.system(size: size * 0.08, weight: .bold))
                                .foregroundColor(.white)
                        }
                        .buttonStyle(PlainButtonStyle())
                        .opacity(timerManager.state == .idle || timerManager.state == .completed ? 1.0 : 0.75)
                        
                        Button(action: toggleTimer) {
                            Image(systemName: playPauseIcon)
                                .font(.system(size: size * 0.08, weight: .bold))
                                .foregroundColor(.white)
                        }
                        .buttonStyle(PlainButtonStyle())
                        
                        Button(action: resetTimer) {
                            Image(systemName: "xmark")
                                .font(.system(size: size * 0.08, weight: .bold))
                                .foregroundColor(.white)
                        }
                        .buttonStyle(PlainButtonStyle())
                        .disabled(timerManager.state == .idle)
                        .opacity(timerManager.state == .idle ? 0.75 : 1.0)
                    }
                    Spacer()
                }
                .offset(y: size * 0.23)
            }
            
            if showInfoOverlay {
                infoOverlayView
            }
        }
        .frame(width: size, height: size)
    }
    
    private func loadRobotImage() -> NSImage? {
        let possiblePaths = [
            Bundle.main.url(forResource: "robot", withExtension: "png"),
            Bundle.main.url(forResource: "robot", withExtension: "png", subdirectory: "Resources"),
            Bundle.main.resourceURL?.appendingPathComponent("robot.png"),
            Bundle.main.resourceURL?.appendingPathComponent("Resources/robot.png")
        ]
        
        for path in possiblePaths {
            if let url = path, FileManager.default.fileExists(atPath: url.path) {
                if let image = NSImage(contentsOf: url) {
                    return image
                }
            }
        }
        
        let sourceURL = URL(fileURLWithPath: "/Users/matthew.reider/mattato/Sources/Mattato/Resources/robot.png")
        if FileManager.default.fileExists(atPath: sourceURL.path) {
            if let image = NSImage(contentsOf: sourceURL) {
                return image
            }
        }
        return nil
    }
    
    private var safeFormattedTime: String {
        return timerManager.formattedTime
    }
    
    private var playPauseIcon: String {
        switch timerManager.state {
        case .idle, .paused:
            return "play.fill"
        case .running:
            return "pause.fill"
        case .completed:
            return "checkmark.circle.fill"
        }
    }
    
    private func toggleTimer() {
        switch timerManager.state {
        case .idle:
            if isEditingTime {
                saveTimer()
            }
            let customer = selectedCustomer.isEmpty ? nil : selectedCustomer
            let project = selectedProject.isEmpty ? nil : selectedProject
            timerManager.startTimer(description: sessionDescription, customer: customer, project: project)
        case .paused:
            let description = timerManager.currentSession?.description ?? "Resumed Session"
            let customer = timerManager.currentSession?.customer
            let project = timerManager.currentSession?.project
            timerManager.startTimer(description: description, customer: customer, project: project)
        case .running:
            timerManager.pauseTimer()
        case .completed:
            timerManager.handleCompletedTimerClick()
        }
    }
    
    private func resetTimer() {
        DispatchQueue.main.async { [weak timerManager] in
            guard let timerManager = timerManager else { return }
            timerManager.performSafeReset()
        }
    }
}
