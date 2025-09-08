import AppKit
import SwiftUI
import Combine

class MenuBarController: NSObject {
    private var statusItem: NSStatusItem?
    private var timerManager = TimerManager()
    private var historyManager = HistoryManager.shared
    private var cancellables = Set<AnyCancellable>()
    private var desktopTimerWindow: DesktopTimerWindow?
    private var settingsWindowController: NSWindowController?
    private var historyWindowController: NSWindowController?
    private var customerManagerController: NSWindowController?
    private var projectManagerController: NSWindowController?
    
    override init() {
        super.init()
        setupStatusItem()
        setupObservers()
        loadPreferences()
        createDesktopTimer()
    }
    
    private func setupStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        
        guard let statusItem = statusItem else { return }
        
        statusItem.button?.target = self
        statusItem.button?.action = #selector(showContextMenu)
        
        updateStatusItemAppearance()
    }
    
    private func setupObservers() {
        timerManager.$state
            .sink { [weak self] _ in
                DispatchQueue.main.async {
                    guard let self = self else { return }
                    self.updateStatusItemAppearance()
                }
            }
            .store(in: &cancellables)
        
        timerManager.$timeRemaining
            .sink { [weak self] _ in
                DispatchQueue.main.async {
                    guard let self = self else { return }
                    self.updateStatusItemAppearance()
                }
            }
            .store(in: &cancellables)
        
        historyManager.$preferences
            .sink { [weak self] preferences in
                DispatchQueue.main.async {
                    guard let self = self else { return }
                    self.desktopTimerWindow?.updateSize(preferences.desktopTimerSize)
                    
                    if self.timerManager.state == .idle {
                        self.timerManager.sessionLength = preferences.defaultSessionLength
                        self.timerManager.timeRemaining = preferences.defaultSessionLength
                    }
                }
            }
            .store(in: &cancellables)
    }
    
    private func loadPreferences() {
        timerManager.sessionLength = historyManager.preferences.defaultSessionLength
    }
    
    private func createDesktopTimer() {
        let preferences = historyManager.preferences
        desktopTimerWindow = DesktopTimerWindow(timerManager: timerManager, preferences: preferences)
        desktopTimerWindow?.makeKeyAndOrderFront(nil)
    }
    
    private func updateStatusItemAppearance() {
        guard let button = statusItem?.button else { return }
        
        if let timerIcon = loadTimerIcon() {
            button.image = timerIcon
            button.attributedTitle = NSAttributedString(string: "")
            
            switch timerManager.state {
            case .completed:
                let attributes: [NSAttributedString.Key: Any] = [
                    .foregroundColor: NSColor.systemGreen,
                    .strokeColor: NSColor.systemGreen,
                    .strokeWidth: -2.0
                ]
                button.attributedTitle = NSAttributedString(
                    string: " \(timerManager.formattedTime)",
                    attributes: attributes
                )
            default:
                button.title = " \(timerManager.formattedTime)"
            }
        } else {
            button.image = nil
            switch timerManager.state {
            case .completed:
                let attributes: [NSAttributedString.Key: Any] = [
                    .foregroundColor: NSColor.systemGreen,
                    .strokeColor: NSColor.systemGreen,
                    .strokeWidth: -2.0
                ]
                button.attributedTitle = NSAttributedString(
                    string: "🍅 \(timerManager.formattedTime)",
                    attributes: attributes
                )
            default:
                button.title = "🍅 \(timerManager.formattedTime)"
            }
        }
    }
    
    // Commented out - keeping for comparison
    /*
    private func updateStatusItemAppearance() {
        guard let button = statusItem?.button else { return }
        
        if let tomatoImage = loadTomatoIcon() {
            button.image = tomatoImage
            button.attributedTitle = NSAttributedString(string: "")
            
            switch timerManager.state {
            case .completed:
                let attributes: [NSAttributedString.Key: Any] = [
                    .foregroundColor: NSColor.systemGreen,
                    .strokeColor: NSColor.systemGreen,
                    .strokeWidth: -2.0
                ]
                button.attributedTitle = NSAttributedString(
                    string: " \(timerManager.formattedTime)",
                    attributes: attributes
                )
            default:
                button.title = " \(timerManager.formattedTime)"
            }
        } else {
            button.image = nil
            switch timerManager.state {
            case .completed:
                let attributes: [NSAttributedString.Key: Any] = [
                    .foregroundColor: NSColor.systemGreen,
                    .strokeColor: NSColor.systemGreen,
                    .strokeWidth: -2.0
                ]
                button.attributedTitle = NSAttributedString(
                    string: "🍅 \(timerManager.formattedTime)",
                    attributes: attributes
                )
            default:
                button.title = "🍅 \(timerManager.formattedTime)"
            }
        }
    }
    */
    
    private func loadTimerIcon() -> NSImage? {
        guard let resourcePath = Bundle.main.path(forResource: "tomato-menubar", ofType: "png"),
              let originalImage = NSImage(contentsOfFile: resourcePath) else {
            return nil
        }
        
        let targetSize = NSSize(width: 16, height: 16)
        let resizedImage = NSImage(size: targetSize)
        
        resizedImage.lockFocus()
        originalImage.draw(in: NSRect(origin: .zero, size: targetSize),
                          from: NSRect(origin: .zero, size: originalImage.size),
                          operation: .sourceOver,
                          fraction: 1.0)
        resizedImage.unlockFocus()
        
        return resizedImage
    }
    
    // Commented out - keeping for comparison
    /*
    private func loadTomatoIcon() -> NSImage? {
        guard let resourcePath = Bundle.main.path(forResource: "tomato-512x512", ofType: "png"),
              let originalImage = NSImage(contentsOfFile: resourcePath) else {
            return nil
        }
        
        let targetSize = NSSize(width: 16, height: 16)
        let resizedImage = NSImage(size: targetSize)
        
        resizedImage.lockFocus()
        originalImage.draw(in: NSRect(origin: .zero, size: targetSize),
                          from: NSRect(origin: .zero, size: originalImage.size),
                          operation: .sourceOver,
                          fraction: 1.0)
        resizedImage.unlockFocus()
        
        return resizedImage
    }
    */
    
    @objc private func showContextMenu() {
        let menu = NSMenu()
        
        let aboutItem = NSMenuItem(title: "About Mattato", action: #selector(openAbout), keyEquivalent: "")
        aboutItem.target = self
        menu.addItem(aboutItem)
        
        menu.addItem(NSMenuItem.separator())
        
        let playPauseTitle: String
        switch timerManager.state {
        case .idle, .paused:
            playPauseTitle = "Play"
        case .running:
            playPauseTitle = "Pause"
        case .completed:
            playPauseTitle = "Start New"
        }
        let playPauseItem = NSMenuItem(title: playPauseTitle, action: #selector(toggleTimer), keyEquivalent: "")
        playPauseItem.target = self
        menu.addItem(playPauseItem)
        
        if timerManager.state != .idle {
            let resetItem = NSMenuItem(title: "Reset", action: #selector(resetTimer), keyEquivalent: "")
            resetItem.target = self
            menu.addItem(resetItem)
        }
        
        let timerVisible = desktopTimerWindow?.isVisible ?? false
        let timerToggleTitle = timerVisible ? "Hide Timer" : "Show Timer"
        let timerToggleItem = NSMenuItem(title: timerToggleTitle, action: #selector(toggleTimerVisibility), keyEquivalent: "")
        timerToggleItem.target = self
        menu.addItem(timerToggleItem)
        
        menu.addItem(NSMenuItem.separator())
        
        let historyItem = NSMenuItem(title: "Session Viewer", action: #selector(openHistory), keyEquivalent: "")
        historyItem.target = self
        menu.addItem(historyItem)

        menu.addItem(NSMenuItem.separator())
        
        let projectsItem = NSMenuItem(title: "Projects", action: #selector(openProjectManager), keyEquivalent: "")
        projectsItem.target = self
        menu.addItem(projectsItem)
        
        let customersItem = NSMenuItem(title: "Customers", action: #selector(openCustomerManager), keyEquivalent: "")
        customersItem.target = self
        menu.addItem(customersItem)
        
        menu.addItem(NSMenuItem.separator())
        
        let settingsItem = NSMenuItem(title: "Settings", action: #selector(openSettings), keyEquivalent: "")
        settingsItem.target = self
        menu.addItem(settingsItem)
        
        menu.addItem(NSMenuItem.separator())
        
        let quitItem = NSMenuItem(title: "Quit", action: #selector(quitApp), keyEquivalent: "q")
        quitItem.target = self
        menu.addItem(quitItem)
        
        statusItem?.menu = menu
        statusItem?.button?.performClick(nil)
        statusItem?.menu = nil
    }
    
    @objc private func toggleTimerVisibility() {
        guard let window = desktopTimerWindow else { 
            createDesktopTimer()
            return 
        }
        
        if window.isVisible {
            window.orderOut(nil)
        } else {
            window.makeKeyAndOrderFront(nil)
        }
    }
    
    @objc private func toggleTimer() {
        switch timerManager.state {
        case .idle:
            timerManager.startTimer(description: "Pomodoro Session")
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
    
    @objc private func resetTimer() {
        DispatchQueue.main.async { [weak timerManager] in
            guard let timerManager = timerManager else { return }
            timerManager.performSafeReset()
        }
    }
    
    @objc private func openHistory() {
        if let windowController = historyWindowController {
            windowController.showWindow(nil)
            windowController.window?.makeKeyAndOrderFront(nil)
            return
        }
        
        let historyWindow = NSWindow(
            contentRect: NSRect(x: 100, y: 100, width: 920, height: 500),
            styleMask: [.titled, .closable, .resizable],
            backing: .buffered,
            defer: false
        )
        
        historyWindow.title = "Session View"
        historyWindow.level = NSWindow.Level.floating
        historyWindow.center()
        
        let historyView = SessionHistoryView(historyManager: historyManager)
        let hostingView = NSHostingView(rootView: historyView)
        hostingView.frame = historyWindow.contentView?.bounds ?? NSRect.zero
        historyWindow.contentView = hostingView
        
        let windowController = NSWindowController(window: historyWindow)
        historyWindowController = windowController
        
        windowController.showWindow(nil)
        historyWindow.makeKeyAndOrderFront(nil)
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(historyWindowDidClose),
            name: NSWindow.willCloseNotification,
            object: historyWindow
        )
    }
    
    @objc private func openSettings() {
        if let windowController = settingsWindowController {
            windowController.showWindow(nil)
            return
        }
        
        let settingsWindow = SettingsWindow(
            timerManager: timerManager,
            preferences: historyManager.preferences
        )
        
        let windowController = NSWindowController(window: settingsWindow)
        settingsWindowController = windowController
        
        windowController.showWindow(nil)
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(settingsWindowDidClose),
            name: NSWindow.willCloseNotification,
            object: settingsWindow
        )
    }
    
    @objc private func historyWindowDidClose(_ notification: Notification) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if let window = notification.object as? NSWindow {
                NotificationCenter.default.removeObserver(self, name: NSWindow.willCloseNotification, object: window)
            }
            self.historyWindowController = nil
        }
    }
    
    @objc private func settingsWindowDidClose(_ notification: Notification) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if let window = notification.object as? NSWindow {
                NotificationCenter.default.removeObserver(self, name: NSWindow.willCloseNotification, object: window)
            }
            self.settingsWindowController = nil
        }
    }
    
    @objc private func customerManagerDidClose(_ notification: Notification) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if let window = notification.object as? NSWindow {
                NotificationCenter.default.removeObserver(self, name: NSWindow.willCloseNotification, object: window)
            }
            self.customerManagerController = nil
        }
    }
    
    @objc private func projectManagerDidClose(_ notification: Notification) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if let window = notification.object as? NSWindow {
                NotificationCenter.default.removeObserver(self, name: NSWindow.willCloseNotification, object: window)
            }
            self.projectManagerController = nil
        }
    }
    
    @objc private func openAbout() {
        if let url = URL(string: "https://mattato.com") {
            NSWorkspace.shared.open(url)
        }
    }
    
    @objc private func openCustomerManager() {
        if let windowController = customerManagerController {
            windowController.showWindow(nil)
            windowController.window?.makeKeyAndOrderFront(nil)
            return
        }
        
        let customerWindow = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 400, height: 350),
            styleMask: [.titled, .closable],
            backing: .buffered,
            defer: false
        )
        
        customerWindow.title = "Manage Customers"
        customerWindow.level = .floating
        customerWindow.center()
        
        let customerView = CustomerManagerView(historyManager: historyManager)
        let hostingView = NSHostingView(rootView: customerView)
        customerWindow.contentView = hostingView
        
        let windowController = NSWindowController(window: customerWindow)
        customerManagerController = windowController
        
        windowController.showWindow(nil)
        customerWindow.makeKeyAndOrderFront(nil)
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(customerManagerDidClose),
            name: NSWindow.willCloseNotification,
            object: customerWindow
        )
    }
    
    @objc private func openProjectManager() {
        if let windowController = projectManagerController {
            windowController.showWindow(nil)
            windowController.window?.makeKeyAndOrderFront(nil)
            return
        }
        
        let projectWindow = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 400, height: 350),
            styleMask: [.titled, .closable],
            backing: .buffered,
            defer: false
        )
        
        projectWindow.title = "Manage Projects"
        projectWindow.level = .floating
        projectWindow.center()
        
        let projectView = ProjectManagerView(historyManager: historyManager)
        let hostingView = NSHostingView(rootView: projectView)
        projectWindow.contentView = hostingView
        
        let windowController = NSWindowController(window: projectWindow)
        projectManagerController = windowController
        
        windowController.showWindow(nil)
        projectWindow.makeKeyAndOrderFront(nil)
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(projectManagerDidClose),
            name: NSWindow.willCloseNotification,
            object: projectWindow
        )
    }
    
    
    
    @objc private func quitApp() {
        NSApp.terminate(nil)
    }
    
    func cleanup() {
        NotificationCenter.default.removeObserver(self)
        
        cancellables.removeAll()
        
        if let settingsWindow = settingsWindowController?.window {
            settingsWindow.close()
        }
        settingsWindowController = nil
        
        if let historyWindow = historyWindowController?.window {
            historyWindow.close()
        }
        historyWindowController = nil
        
        if let customerWindow = customerManagerController?.window {
            customerWindow.close()
        }
        customerManagerController = nil
        
        if let projectWindow = projectManagerController?.window {
            projectWindow.close()
        }
        projectManagerController = nil
        
        if let desktopWindow = desktopTimerWindow {
            desktopWindow.close()
        }
        desktopTimerWindow = nil
        
        statusItem = nil
    }
}
