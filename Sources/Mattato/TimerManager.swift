import Foundation
import Combine
import UserNotifications
import AppKit

enum TimerState {
    case idle
    case running
    case paused
    case completed
}

class TimerManager: ObservableObject {
    @Published var state: TimerState = .idle
    @Published var timeRemaining: TimeInterval = 25 * 60 // 25 minutes default
    @Published var currentSession: Session?
    @Published var shouldClearFields: Bool = false // Trigger for UI to clear fields
    
    private var timer: Timer?
    private var flashTimer: Timer?
    private var startTime: Date?
    private var pausedTime: TimeInterval = 0
    private var currentSessionId: String?
    private var lastFlashMinute: Int = -1
    private var desktopFlashWindow: DesktopFlashWindow?
    private var celebrationWindow: CelebrationWindow?
    
    var sessionLength: TimeInterval = 25 * 60 {
        didSet {
            if state == .idle {
                timeRemaining = sessionLength
            }
        }
    }
    
    var formattedTime: String {
        let minutes = Int(timeRemaining) / 60
        let seconds = Int(timeRemaining) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
    
    func startTimer(description: String) {
        guard state == .idle || state == .paused else { return }
        
        if state == .idle {
            // Start new session - save immediately to history
            let session = HistoryManager.shared.startSession(description: description, plannedDuration: sessionLength)
            currentSession = session
            currentSessionId = session.id
            timeRemaining = sessionLength
            pausedTime = 0
        } else if state == .paused {
            // Resume paused session - remove paused record and save as started
            if let sessionId = currentSessionId {
                HistoryManager.shared.removeSession(id: sessionId)
                if var session = currentSession {
                    session.resume()
                    let newSession = HistoryManager.shared.startSession(description: session.description, plannedDuration: session.plannedDuration)
                    currentSession = newSession
                    currentSessionId = newSession.id
                }
            }
        }
        
        state = .running
        startTime = Date()
        
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.updateTimer()
        }
    }
    
    func pauseTimer() {
        guard state == .running else { return }
        
        timer?.invalidate()
        timer = nil
        
        if let startTime = startTime {
            pausedTime += Date().timeIntervalSince(startTime)
        }
        
        // Update session as paused in history
        if var session = currentSession {
            session.pause()
            currentSession = session
            HistoryManager.shared.updateSession(session)
        }
        
        state = .paused
    }
    
    func resetTimer() {
        timer?.invalidate()
        timer = nil
        
        // If there's a running or paused session, complete it with current time
        if (state == .running || state == .paused), var session = currentSession {
            session.complete()
            currentSession = session
            HistoryManager.shared.updateSession(session)
        }
        
        state = .idle
        // Reset to default 25 minutes
        sessionLength = 25 * 60
        timeRemaining = sessionLength
        currentSession = nil
        currentSessionId = nil
        startTime = nil
        pausedTime = 0
        
        // Trigger UI to clear fields
        shouldClearFields = true
    }
    
    private func updateTimer() {
        guard let startTime = startTime else { return }
        
        let elapsed = Date().timeIntervalSince(startTime) + pausedTime
        timeRemaining = max(0, sessionLength - elapsed)
        
        // Check for desktop flash every minute
        let currentMinute = Int(timeRemaining) / 60
        if HistoryManager.shared.preferences.desktopEffects && 
           currentMinute != lastFlashMinute && 
           Int(timeRemaining) % 60 == 0 && 
           timeRemaining > 0 {
            showDesktopFlash()
            lastFlashMinute = currentMinute
        }
        
        if timeRemaining <= 0 {
            completeTimer()
        }
    }
    
    private func showDesktopFlash() {
        if desktopFlashWindow == nil {
            desktopFlashWindow = DesktopFlashWindow()
        }
        desktopFlashWindow?.showFlash(with: formattedTime)
    }
    
    private func completeTimer() {
        timer?.invalidate()
        timer = nil
        
        state = .completed
        timeRemaining = 0
        
        // Update existing session as completed
        if var session = currentSession {
            session.complete()
            currentSession = session
            HistoryManager.shared.updateSession(session)
        }
        
        // Show celebration effect if desktop effects are enabled
        if HistoryManager.shared.preferences.desktopEffects {
            showCelebration()
        }
        
        // Send notification
        sendCompletionNotification()
        
        // Trigger UI to clear fields after completion
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            self.shouldClearFields = true
        }
    }
    
    private func showCelebration() {
        if celebrationWindow == nil {
            celebrationWindow = CelebrationWindow()
        }
        celebrationWindow?.showCelebration()
    }
    
    private func sendCompletionNotification() {
        let preferences = HistoryManager.shared.preferences
        
        // Play custom sound if enabled
        if preferences.playSoundEnabled {
            SoundManager.shared.playCompletionSound(soundName: preferences.selectedSoundName)
        }
        
        let content = UNMutableNotificationContent()
        content.title = "Pomodoro Complete!"
        content.body = currentSession?.description ?? "Session finished"
        
        // Only use default notification sound if custom sound is disabled
        if !preferences.playSoundEnabled {
            content.sound = .default
        }
        
        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Error sending notification: \(error)")
            }
        }
    }
    
    func handleCompletedTimerClick() {
        guard state == .completed else { return }
        resetTimer()
    }
}
