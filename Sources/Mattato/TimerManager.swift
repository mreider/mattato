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
    @Published var timeRemaining: TimeInterval = 25 * 60
    @Published var currentSession: Session?
    @Published var shouldClearFields: Bool = false
    
    private var timer: Timer?
    private var startTime: Date?
    private var pausedTime: TimeInterval = 0
    private var currentSessionId: String?
    
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
    
    private func generateSessionId() -> String {
        return HistoryManager.shared.generateSessionId()
    }
    
    func startTimer(description: String, customer: String? = nil, project: String? = nil) {
        guard state == .idle || state == .paused else { return }
        
        HistoryManager.shared.endAllRunningSessions()
        
        if state == .idle {
            let sessionId = generateSessionId()
            var session = Session(id: sessionId, description: description, customer: customer, project: project, plannedDuration: sessionLength)
            session.sessionState = .started
            currentSession = session
            currentSessionId = sessionId
            timeRemaining = sessionLength
            pausedTime = 0
            
            HistoryManager.shared.addSession(session)
        } else if state == .paused {
            if let pausedSessionId = currentSessionId {
                HistoryManager.shared.resumeSessionById(pausedSessionId)
                
                let newSessionId = generateSessionId()
                var newSession = Session(id: newSessionId, description: description, customer: customer, project: project, plannedDuration: sessionLength)
                newSession.sessionState = .started
                currentSession = newSession
                currentSessionId = newSessionId
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
        
        if let sessionId = currentSessionId {
            HistoryManager.shared.pauseSessionById(sessionId)
        }
        
        state = .paused
    }
    
    func resetTimer() {
        guard state != .idle else { return }
        
        timer?.invalidate()
        timer = nil
        
        
        if currentSessionId != nil {
            HistoryManager.shared.endAllRunningSessionsSync()
        }
        
        let oldSessionLength = sessionLength
        currentSession = nil
        currentSessionId = nil
        startTime = nil
        pausedTime = 0
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            self.state = .idle
            self.timeRemaining = oldSessionLength
            self.shouldClearFields = true
        }
    }
    
    private func updateTimer() {
        guard state == .running, let startTime = startTime else {
            timer?.invalidate()
            timer = nil
            return 
        }
        
        let elapsed = Date().timeIntervalSince(startTime) + pausedTime
        timeRemaining = max(0, sessionLength - elapsed)
        
        if timeRemaining <= 0 {
            completeTimer()
        }
    }
    
    private func completeTimer() {
        timer?.invalidate()
        timer = nil
        
        let sessionId = currentSessionId
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            if let sessionId = sessionId {
                HistoryManager.shared.completeSessionById(sessionId)
            }
            
            self.sendCompletionNotification()
            
            self.currentSession = nil
            self.currentSessionId = nil
            self.startTime = nil
            self.pausedTime = 0
            self.state = .idle
            self.timeRemaining = self.sessionLength
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
                guard let self = self else { return }
                self.shouldClearFields = true
            }
        }
    }
    
    private func sendCompletionNotification() {
        let preferences = HistoryManager.shared.preferences
        
        if preferences.playSoundEnabled {
            SoundManager.shared.playCompletionSound(soundName: preferences.selectedSoundName)
        }
        
        
        guard let bundleId = Bundle.main.bundleIdentifier, !bundleId.isEmpty else {
            print("Skipping notification - running in development mode without bundle identifier")
            return
        }
        
        let content = UNMutableNotificationContent()
        content.title = "Pomodoro Complete!"
        content.body = currentSession?.formattedDescription ?? "Session finished"
        
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
        performSafeReset()
    }
    
    func performSafeReset() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            self.timer?.invalidate()
            self.timer = nil
            
            
            if self.currentSessionId != nil {
                HistoryManager.shared.endAllRunningSessionsSync()
            }
            
            self.currentSession = nil
            self.currentSessionId = nil
            self.startTime = nil
            self.pausedTime = 0
            self.state = .idle
            self.timeRemaining = self.sessionLength
            self.shouldClearFields = true
        }
    }
    
    deinit {
        timer?.invalidate()
        timer = nil
    }
}
