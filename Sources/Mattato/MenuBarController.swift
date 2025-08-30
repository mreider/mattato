import AppKit
import SwiftUI
import Combine

class MenuBarController: NSObject {
    private var statusItem: NSStatusItem?
    private var timerManager = TimerManager()
    private var historyManager = HistoryManager.shared
    private var cancellables = Set<AnyCancellable>()
    private var popover: NSPopover?
    private var historyWindow: NSWindow?
    
    override init() {
        super.init()
        setupStatusItem()
        setupObservers()
        loadPreferences()
    }
    
    private func setupStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        
        guard let statusItem = statusItem else { return }
        
        statusItem.button?.target = self
        statusItem.button?.action = #selector(statusItemClicked)
        statusItem.button?.sendAction(on: [.leftMouseUp, .rightMouseUp])
        
        updateStatusItemAppearance()
    }
    
    private func setupObservers() {
        timerManager.$state
            .sink { [weak self] _ in
                DispatchQueue.main.async {
                    self?.updateStatusItemAppearance()
                }
            }
            .store(in: &cancellables)
        
        timerManager.$timeRemaining
            .sink { [weak self] _ in
                DispatchQueue.main.async {
                    self?.updateStatusItemTitle()
                }
            }
            .store(in: &cancellables)
    }
    
    private func loadPreferences() {
        timerManager.sessionLength = historyManager.preferences.defaultSessionLength
    }
    
    private func updateStatusItemTitle() {
        if timerManager.state == .running || timerManager.state == .completed {
            updateStatusItemAppearance()
        }
    }
    
    private func updateStatusItemAppearance() {
        guard let button = statusItem?.button else { return }
        
        switch timerManager.state {
        case .idle, .paused:
            button.title = ""
            button.attributedTitle = NSAttributedString(string: "")
            if let tomatoImage = loadTomatoIcon() {
                button.image = tomatoImage
            } else {
                button.title = "🍅"
            }
        case .running:
            if let tomatoImage = loadTomatoIcon() {
                button.image = tomatoImage
                button.title = " \(timerManager.formattedTime)"
            } else {
                button.image = nil
                button.title = "🍅 \(timerManager.formattedTime)"
            }
        case .completed:
            if let tomatoImage = loadTomatoIcon() {
                button.image = tomatoImage
                let attributes: [NSAttributedString.Key: Any] = [
                    .foregroundColor: NSColor.systemGreen,
                    .strokeColor: NSColor.systemGreen,
                    .strokeWidth: -2.0
                ]
                button.attributedTitle = NSAttributedString(
                    string: " \(timerManager.formattedTime)",
                    attributes: attributes
                )
            } else {
                button.image = nil
                let attributes: [NSAttributedString.Key: Any] = [
                    .foregroundColor: NSColor.systemGreen,
                    .strokeColor: NSColor.systemGreen,
                    .strokeWidth: -2.0
                ]
                button.attributedTitle = NSAttributedString(
                    string: "🍅 \(timerManager.formattedTime)",
                    attributes: attributes
                )
            }
        }
    }
    
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
    
    @objc private func statusItemClicked() {
        if timerManager.state == .completed {
            timerManager.handleCompletedTimerClick()
            return
        }
        
        togglePopover()
    }
    
    private func togglePopover() {
        if let popover = popover, popover.isShown {
            closePopover()
        } else {
            showPopover()
        }
    }
    
    @objc private func showPopover() {
        guard let statusButton = statusItem?.button else { return }
        
        let popover = NSPopover()
        popover.contentSize = NSSize(width: 320, height: 380)
        popover.behavior = .transient
        popover.contentViewController = NSHostingController(
            rootView: MenuPopupView(
                timerManager: timerManager,
                historyManager: historyManager,
                onHistoryRequested: { [weak self] in
                    self?.showHistoryWindow()
                },
                onCloseRequested: { [weak self] in
                    self?.closePopover()
                }
            )
        )
        
        popover.show(relativeTo: statusButton.bounds, of: statusButton, preferredEdge: .minY)
        self.popover = popover
    }
    
    private func closePopover() {
        popover?.performClose(nil)
        popover = nil
    }
    
    private func showContextMenu() {
        let menu = NSMenu()
        
        // Remove "Show Timer" since the timer is always visible in menu bar
        let historyItem = NSMenuItem(title: "History", action: #selector(showHistoryWindow), keyEquivalent: "")
        historyItem.target = self
        menu.addItem(historyItem)
        
        menu.addItem(NSMenuItem.separator())
        
        let quitItem = NSMenuItem(title: "Quit Mattato", action: #selector(quitApp), keyEquivalent: "q")
        quitItem.target = self
        menu.addItem(quitItem)
        
        statusItem?.menu = menu
        statusItem?.button?.performClick(nil)
        statusItem?.menu = nil
    }
    
    @objc private func showHistoryWindow() {
    closePopover()
    
    DispatchQueue.main.async { [weak self] in
        guard let self = self else { return }
        
        // If window already exists and is visible, just bring it to front
        if let existingWindow = self.historyWindow, existingWindow.isVisible {
            existingWindow.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return
        }
        
        // Clean up any existing window properly
        if let existingWindow = self.historyWindow {
            existingWindow.close()
            self.historyWindow = nil
            
            // Small delay to ensure window is fully closed
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                self.createNewHistoryWindow()
            }
        } else {
            self.createNewHistoryWindow()
        }
    }
}

private func createNewHistoryWindow() {
    let panel = NSPanel(
        contentRect: NSRect(x: 0, y: 0, width: 600, height: 400),
        styleMask: [.titled, .closable, .resizable],
        backing: .buffered,
        defer: false
    )
    
    panel.title = "Pomodoro History"
    panel.isFloatingPanel = false  // Don't float above other windows
    panel.becomesKeyOnlyIfNeeded = true  // Only become key when needed
    
    // Create a fresh HistoryWindowView instance
    let historyView = HistoryWindowView(historyManager: self.historyManager)
    panel.contentViewController = NSHostingController(rootView: historyView)
    panel.center()
    
    // Set up window delegate to clean up when closed
    panel.delegate = self
    
    self.historyWindow = panel
    panel.makeKeyAndOrderFront(nil)
    NSApp.activate(ignoringOtherApps: true)
}
    
    @objc private func quitApp() {
        NSApp.terminate(nil)
    }
    
    func cleanup() {
        cancellables.removeAll()
        statusItem = nil
        popover = nil
        historyWindow = nil
    }
}

extension MenuBarController: NSWindowDelegate {
    func windowWillClose(_ notification: Notification) {
        if let window = notification.object as? NSWindow,
           window === historyWindow {
            historyWindow = nil
        }
    }
}
