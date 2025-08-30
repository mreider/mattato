import AppKit
import SwiftUI

class DesktopFlashWindow: NSWindow {
    private var flashTimer: Timer?
    
    init() {
        // Start with a larger centered window to accommodate full timer text
        let windowSize = NSSize(width: 400, height: 180)
        let screenFrame = NSScreen.main?.frame ?? NSRect.zero
        let centeredRect = NSRect(
            x: screenFrame.midX - windowSize.width / 2,
            y: screenFrame.midY - windowSize.height / 2,
            width: windowSize.width,
            height: windowSize.height
        )
        
        super.init(
            contentRect: centeredRect,
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )
        
        self.level = .floating
        self.backgroundColor = NSColor.clear
        self.isOpaque = false
        self.hasShadow = false
        self.ignoresMouseEvents = true
        self.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
    }
    
    func showFlash(with timeText: String, duration: TimeInterval = 2.5) {
        // Create the content view with glowing timer display
        let flashView = DesktopFlashView(timeText: timeText) { [weak self] in
            // Callback for when fade-out animation completes
            self?.hideFlash()
        }
        self.contentView = NSHostingController(rootView: flashView).view
        
        // Center the window on the main screen
        if let mainScreen = NSScreen.main {
            let windowSize = NSSize(width: 400, height: 180)
            let centeredRect = NSRect(
                x: mainScreen.frame.midX - windowSize.width / 2,
                y: mainScreen.frame.midY - windowSize.height / 2,
                width: windowSize.width,
                height: windowSize.height
            )
            self.setFrame(centeredRect, display: true)
        }
        
        // Show the window
        self.makeKeyAndOrderFront(nil)
        self.orderFrontRegardless()
        
        // Hide after duration with fade-out
        flashTimer?.invalidate()
        flashTimer = Timer.scheduledTimer(withTimeInterval: duration - 0.4, repeats: false) { [weak self] _ in
            // Start fade-out animation 0.4 seconds before hiding
            if self?.contentView != nil {
                // Trigger fade-out in the SwiftUI view
                NotificationCenter.default.post(name: NSNotification.Name("StartFadeOut"), object: nil)
            }
        }
    }
    
    private func hideFlash() {
        self.orderOut(nil)
        flashTimer?.invalidate()
        flashTimer = nil
    }
    
    deinit {
        flashTimer?.invalidate()
    }
}

struct BlinkingTomatoIcons: View {
    @State private var isBlinking = false
    
    var body: some View {
        HStack(spacing: 8) {
            // Left tomato
            Text("🍅")
                .font(.system(size: 24))
                .opacity(isBlinking ? 0.3 : 1.0)
                .animation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true), value: isBlinking)
            
            // Right tomato
            Text("🍅")
                .font(.system(size: 24))
                .opacity(isBlinking ? 1.0 : 0.3)
                .animation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true).delay(0.4), value: isBlinking)
        }
        .onAppear {
            isBlinking = true
        }
    }
}

struct DesktopFlashView: View {
    let timeText: String
    let onComplete: () -> Void
    @State private var opacity: Double = 0.0
    
    var body: some View {
        ZStack {
            // Transparent background
            Color.clear
                .ignoresSafeArea()
            
            VStack(spacing: 12) {
                // Main timer text - clean and readable
                Text(timeText)
                    .font(.system(size: 80, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
                    .shadow(color: .black, radius: 1, x: 1, y: 1)
                
                // Blinking tomato icons (keep small)
                BlinkingTomatoIcons()
                
                // "Time Remaining" text - clean and readable
                Text("Time Remaining")
                    .font(.system(size: 24, weight: .medium))
                    .foregroundColor(.white)
                    .shadow(color: .black, radius: 1, x: 1, y: 1)
            }
            .padding(30)
        }
        .opacity(opacity)
        .onAppear {
            // Fade in
            withAnimation(.easeIn(duration: 0.4)) {
                opacity = 1.0
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("StartFadeOut"))) { _ in
            // Fade out
            withAnimation(.easeOut(duration: 0.4)) {
                opacity = 0.0
            }
            // Call completion after fade-out
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                onComplete()
            }
        }
    }
}
