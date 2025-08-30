import AppKit
import SwiftUI

class CelebrationWindow: NSWindow {
    private var celebrationTimer: Timer?
    
    init() {
        // Full screen window to cover all displays
        let screenFrame = NSScreen.main?.frame ?? NSRect.zero
        
        super.init(
            contentRect: screenFrame,
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )
        
        self.level = .screenSaver // Highest level to appear over everything
        self.backgroundColor = NSColor.clear
        self.isOpaque = false
        self.hasShadow = false
        self.ignoresMouseEvents = true
        self.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
    }
    
    func showCelebration(duration: TimeInterval = 3.0) {
        // Create the celebration view
        let celebrationView = CelebrationView { [weak self] in
            self?.hideCelebration()
        }
        self.contentView = NSHostingController(rootView: celebrationView).view
        
        // Show on all screens
        if let screens = NSScreen.screens as [NSScreen]? {
            for screen in screens {
                let window = CelebrationWindow()
                window.setFrame(screen.frame, display: true)
                window.contentView = NSHostingController(rootView: celebrationView).view
                window.makeKeyAndOrderFront(nil)
                window.orderFrontRegardless()
                
                // Hide after duration
                DispatchQueue.main.asyncAfter(deadline: .now() + duration) {
                    window.orderOut(nil)
                }
            }
        } else {
            // Fallback to main screen
            self.makeKeyAndOrderFront(nil)
            self.orderFrontRegardless()
            
            celebrationTimer = Timer.scheduledTimer(withTimeInterval: duration, repeats: false) { [weak self] _ in
                self?.hideCelebration()
            }
        }
    }
    
    private func hideCelebration() {
        self.orderOut(nil)
        celebrationTimer?.invalidate()
        celebrationTimer = nil
    }
    
    deinit {
        celebrationTimer?.invalidate()
    }
}

struct ConfettiPiece: View {
    let color: Color
    @State private var position: CGPoint = CGPoint(x: 0, y: 0)
    @State private var rotation: Double = 0
    @State private var opacity: Double = 1.0
    
    let startX: CGFloat
    let screenHeight: CGFloat
    
    var body: some View {
        Rectangle()
            .fill(color)
            .frame(width: 8, height: 8)
            .rotationEffect(.degrees(rotation))
            .opacity(opacity)
            .position(position)
            .onAppear {
                startAnimation()
            }
    }
    
    private func startAnimation() {
        // Start at top of screen at random X position
        position = CGPoint(x: startX, y: -10)
        
        // Animate falling with rotation and slight horizontal drift
        withAnimation(.easeIn(duration: Double.random(in: 2.0...4.0))) {
            position = CGPoint(
                x: startX + CGFloat.random(in: -50...50),
                y: screenHeight + 50
            )
            rotation = Double.random(in: 0...720)
        }
        
        // Fade out near the end
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            withAnimation(.easeOut(duration: 1.0)) {
                opacity = 0.0
            }
        }
    }
}

struct FireworkBurst: View {
    @State private var particles: [ParticleData] = []
    @State private var isAnimating = false
    
    let centerX: CGFloat
    let centerY: CGFloat
    let colors: [Color] = [.red, .orange, .yellow, .green, .blue, .purple, .pink]
    
    struct ParticleData: Identifiable {
        let id = UUID()
        let color: Color
        let angle: Double
        let speed: Double
        var position: CGPoint
        var opacity: Double = 1.0
    }
    
    var body: some View {
        ZStack {
            ForEach(particles) { particle in
                Circle()
                    .fill(particle.color)
                    .frame(width: 6, height: 6)
                    .position(particle.position)
                    .opacity(particle.opacity)
            }
        }
        .onAppear {
            createParticles()
            animateParticles()
        }
    }
    
    private func createParticles() {
        particles = []
        for i in 0..<20 {
            let angle = Double(i) * (360.0 / 20.0) * .pi / 180.0
            let particle = ParticleData(
                color: colors.randomElement() ?? .white,
                angle: angle,
                speed: Double.random(in: 80...150),
                position: CGPoint(x: centerX, y: centerY)
            )
            particles.append(particle)
        }
    }
    
    private func animateParticles() {
        withAnimation(.easeOut(duration: 1.5)) {
            for i in 0..<particles.count {
                let distance = particles[i].speed
                let newX = centerX + CGFloat(cos(particles[i].angle) * distance)
                let newY = centerY + CGFloat(sin(particles[i].angle) * distance)
                particles[i].position = CGPoint(x: newX, y: newY)
            }
        }
        
        // Fade out particles
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
            withAnimation(.easeOut(duration: 0.7)) {
                for i in 0..<particles.count {
                    particles[i].opacity = 0.0
                }
            }
        }
    }
}

struct CelebrationView: View {
    let onComplete: () -> Void
    @State private var confettiPieces: [ConfettiData] = []
    @State private var fireworks: [FireworkData] = []
    @State private var showMessage = false
    
    let confettiColors: [Color] = [.red, .orange, .yellow, .green, .blue, .purple, .pink, .white]
    
    struct ConfettiData: Identifiable {
        let id = UUID()
        let color: Color
        let startX: CGFloat
        let delay: Double
    }
    
    struct FireworkData: Identifiable {
        let id = UUID()
        let x: CGFloat
        let y: CGFloat
        let delay: Double
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Transparent background
                Color.clear
                    .ignoresSafeArea()
                
                // Confetti pieces
                ForEach(confettiPieces) { confetti in
                    ConfettiPiece(
                        color: confetti.color,
                        startX: confetti.startX,
                        screenHeight: geometry.size.height
                    )
                    .animation(.none, value: confetti.id)
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + confetti.delay) {
                            // Confetti animation is handled in ConfettiPiece
                        }
                    }
                }
                
                // Firework bursts
                ForEach(fireworks) { firework in
                    FireworkBurst(centerX: firework.x, centerY: firework.y)
                        .onAppear {
                            DispatchQueue.main.asyncAfter(deadline: .now() + firework.delay) {
                                // Firework animation is handled in FireworkBurst
                            }
                        }
                }
                
                // Celebration message
                if showMessage {
                    VStack(spacing: 20) {
                        Text("🍅")
                            .font(.system(size: 80))
                            .scaleEffect(showMessage ? 1.2 : 0.5)
                            .animation(.spring(response: 0.6, dampingFraction: 0.6), value: showMessage)
                        
                        Text("Session Complete!")
                            .font(.system(size: 48, weight: .bold))
                            .foregroundColor(.white)
                            .shadow(color: .black, radius: 1, x: 1, y: 1)
                            .scaleEffect(showMessage ? 1.0 : 0.5)
                            .animation(.spring(response: 0.8, dampingFraction: 0.7).delay(0.2), value: showMessage)
                        
                        Text("Great work! 🎉")
                            .font(.system(size: 24, weight: .medium))
                            .foregroundColor(.white)
                            .shadow(color: .black, radius: 1, x: 1, y: 1)
                            .opacity(showMessage ? 1.0 : 0.0)
                            .animation(.easeIn(duration: 0.5).delay(0.5), value: showMessage)
                    }
                    .position(x: geometry.size.width / 2, y: geometry.size.height / 2)
                }
            }
        }
        .onAppear {
            startCelebration()
        }
    }
    
    private func startCelebration() {
        let screenWidth = NSScreen.main?.frame.width ?? 1920
        let screenHeight = NSScreen.main?.frame.height ?? 1080
        
        // Create confetti pieces
        confettiPieces = []
        for _ in 0..<100 {
            let confetti = ConfettiData(
                color: confettiColors.randomElement() ?? .white,
                startX: CGFloat.random(in: 0...screenWidth),
                delay: Double.random(in: 0...2.0)
            )
            confettiPieces.append(confetti)
        }
        
        // Create firework bursts
        fireworks = []
        for i in 0..<8 {
            let firework = FireworkData(
                x: CGFloat.random(in: screenWidth * 0.2...screenWidth * 0.8),
                y: CGFloat.random(in: screenHeight * 0.2...screenHeight * 0.6),
                delay: Double(i) * 0.3
            )
            fireworks.append(firework)
        }
        
        // Show celebration message
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            showMessage = true
        }
        
        // Complete celebration after duration
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
            onComplete()
        }
    }
}
