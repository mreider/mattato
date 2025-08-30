import Foundation

enum SessionState: String, Codable {
    case started
    case paused
    case completed
}

struct Session: Codable, Identifiable {
    let id: String
    let startTime: Date
    var endTime: Date?
    var pauseTime: Date?
    let description: String
    let plannedDuration: TimeInterval // in seconds
    var sessionState: SessionState
    
    init(id: String, description: String, plannedDuration: TimeInterval) {
        self.id = id
        self.startTime = Date()
        self.description = description
        self.plannedDuration = plannedDuration
        self.sessionState = .started
    }
    
    mutating func complete() {
        self.endTime = Date()
        self.sessionState = .completed
    }
    
    mutating func pause() {
        self.pauseTime = Date()
        self.sessionState = .paused
    }
    
    mutating func resume() {
        self.pauseTime = nil
        self.sessionState = .started
    }
    
    var isCompleted: Bool {
        return sessionState == .completed
    }
    
    var actualDuration: TimeInterval? {
        guard let endTime = endTime else { return nil }
        return endTime.timeIntervalSince(startTime)
    }
    
    var formattedStartTime: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: startTime)
    }
    
    var formattedEndTime: String {
        guard let endTime = endTime else { return "" }
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: endTime)
    }
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: startTime)
    }
}

struct UserPreferences: Codable {
    var defaultSessionLength: TimeInterval = 25 * 60
    var lastUsedDescription: String = ""
    var desktopEffects: Bool = false
    var playSoundEnabled: Bool = false
    var selectedSoundName: String = "Glass"
    var includeBearTag: Bool = false
    
    static let shared = UserPreferences()
}
