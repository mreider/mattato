import Foundation

enum SessionState: String, Codable {
    case started
    case paused
    case completed
}

struct Session: Codable, Identifiable {
    let id: String
    var startTime: Date
    var endTime: Date?
    var pauseTime: Date?
    var description: String
    var customer: String?
    var project: String?
    var plannedDuration: TimeInterval
    var sessionState: SessionState
    var lastModified: Date?
    var isManuallyCreated: Bool
    var isEdited: Bool
    
    init(id: String, description: String, customer: String? = nil, project: String? = nil, plannedDuration: TimeInterval, isManual: Bool = false) {
        self.id = id
        self.startTime = Date()
        self.description = description
        self.customer = customer
        self.project = project
        self.plannedDuration = plannedDuration
        self.sessionState = .started
        self.lastModified = nil
        self.isManuallyCreated = isManual
        self.isEdited = false
    }
    
    init(id: String, startTime: Date, endTime: Date, description: String, customer: String? = nil, project: String? = nil) {
        self.id = id
        self.startTime = startTime
        self.endTime = endTime
        self.pauseTime = nil
        self.description = description
        self.customer = customer
        self.project = project
        self.plannedDuration = endTime.timeIntervalSince(startTime)
        self.sessionState = .completed
        self.lastModified = Date()
        self.isManuallyCreated = true
        self.isEdited = false
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
    
    mutating func markAsEdited() {
        self.isEdited = true
        self.lastModified = Date()
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
    
    var formattedDescription: String {
        let hasCustomer = customer != nil && !customer!.isEmpty
        let hasProject = project != nil && !project!.isEmpty
        
        if hasCustomer && hasProject {
            return "\(customer!.uppercased()) - \(project!.uppercased()): \(description)"
        } else if hasCustomer {
            return "\(customer!.uppercased()): \(description)"
        } else if hasProject {
            return "\(project!.uppercased()): \(description)"
        } else {
            return description
        }
    }
}

struct UserPreferences: Codable {
    var defaultSessionLength: TimeInterval = 25 * 60
    var lastUsedDescription: String = ""
    var lastUsedCustomer: String = ""
    var lastUsedProject: String = ""
    var customers: [String] = []
    var projects: [String] = []
    var desktopTimer: Bool = false
    var desktopTimerSize: Double = 128.0
    var playSoundEnabled: Bool = false
    var selectedSoundName: String = "Glass"
    var includeBearTag: Bool = false
    var bearWeeklyTag: Bool = false
    var exportMarkdown: Bool = true
    var exportBear: Bool = false
    var exportICS: Bool = false
    var exportCSV: Bool = false
    var exportPDF: Bool = false
    var preferredMarkdownEditor: String = "System Default"
    var exportFolderPath: String = ""
    var showCustomerDropdown: Bool = false
    var showProjectDropdown: Bool = false
    var exportSplitBy: String = "week" // "none", "week" or "month"
    var pdfSplitByCustomer: Bool = false
    var exportDateRange: String = "current_week" // "current_week", "last_week", "current_month", "current_quarter", "custom"
    var exportCustomFromDate: Date = Calendar.current.date(byAdding: .weekOfYear, value: -2, to: Date()) ?? Date()
    var exportCustomToDate: Date = Date()
    var exportTitle: String = "Mattato Sessions"
    // Removed exportDateFormat - now using ISO 8601 standard for all exports
    var dbExportFolderPath: String = ""
    
    // New consolidated export settings
    var lastExportFormat: String = "Markdown" // "Bear", "CSV", "ICS", "JSON", "Markdown", "PDF"
    var lastExportDateRange: String = "current_week" // "current_week", "last_week", "current_month", "last_month", "custom"
    var lastExportSplitBy: String = "none" // "none", "week", "month"  
    var lastExportGroupBy: String = "none" // "none", "customer", "project", "both"
    
    static let shared = UserPreferences()
    
    // Custom decoder to handle missing keys gracefully
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        defaultSessionLength = try container.decodeIfPresent(TimeInterval.self, forKey: .defaultSessionLength) ?? 25 * 60
        lastUsedDescription = try container.decodeIfPresent(String.self, forKey: .lastUsedDescription) ?? ""
        lastUsedCustomer = try container.decodeIfPresent(String.self, forKey: .lastUsedCustomer) ?? ""
        lastUsedProject = try container.decodeIfPresent(String.self, forKey: .lastUsedProject) ?? ""
        customers = try container.decodeIfPresent([String].self, forKey: .customers) ?? []
        projects = try container.decodeIfPresent([String].self, forKey: .projects) ?? []
        desktopTimer = try container.decodeIfPresent(Bool.self, forKey: .desktopTimer) ?? false
        desktopTimerSize = try container.decodeIfPresent(Double.self, forKey: .desktopTimerSize) ?? 128.0
        playSoundEnabled = try container.decodeIfPresent(Bool.self, forKey: .playSoundEnabled) ?? false
        selectedSoundName = try container.decodeIfPresent(String.self, forKey: .selectedSoundName) ?? "Glass"
        includeBearTag = try container.decodeIfPresent(Bool.self, forKey: .includeBearTag) ?? false
        bearWeeklyTag = try container.decodeIfPresent(Bool.self, forKey: .bearWeeklyTag) ?? false
        exportMarkdown = try container.decodeIfPresent(Bool.self, forKey: .exportMarkdown) ?? true
        exportBear = try container.decodeIfPresent(Bool.self, forKey: .exportBear) ?? false
        exportICS = try container.decodeIfPresent(Bool.self, forKey: .exportICS) ?? false
        exportCSV = try container.decodeIfPresent(Bool.self, forKey: .exportCSV) ?? false
        exportPDF = try container.decodeIfPresent(Bool.self, forKey: .exportPDF) ?? false
        preferredMarkdownEditor = try container.decodeIfPresent(String.self, forKey: .preferredMarkdownEditor) ?? "System Default"
        exportFolderPath = try container.decodeIfPresent(String.self, forKey: .exportFolderPath) ?? ""
        showCustomerDropdown = try container.decodeIfPresent(Bool.self, forKey: .showCustomerDropdown) ?? false
        showProjectDropdown = try container.decodeIfPresent(Bool.self, forKey: .showProjectDropdown) ?? false
        exportSplitBy = try container.decodeIfPresent(String.self, forKey: .exportSplitBy) ?? "week"
        pdfSplitByCustomer = try container.decodeIfPresent(Bool.self, forKey: .pdfSplitByCustomer) ?? false
        exportDateRange = try container.decodeIfPresent(String.self, forKey: .exportDateRange) ?? "current_week"
        exportCustomFromDate = try container.decodeIfPresent(Date.self, forKey: .exportCustomFromDate) ?? (Calendar.current.date(byAdding: .weekOfYear, value: -2, to: Date()) ?? Date())
        exportCustomToDate = try container.decodeIfPresent(Date.self, forKey: .exportCustomToDate) ?? Date()
        exportTitle = try container.decodeIfPresent(String.self, forKey: .exportTitle) ?? "Mattato Sessions"
        // exportDateFormat removed - using ISO 8601 standard
        dbExportFolderPath = try container.decodeIfPresent(String.self, forKey: .dbExportFolderPath) ?? ""
        
        // New consolidated export settings
        lastExportFormat = try container.decodeIfPresent(String.self, forKey: .lastExportFormat) ?? "Markdown"
        lastExportDateRange = try container.decodeIfPresent(String.self, forKey: .lastExportDateRange) ?? "current_week"
        lastExportSplitBy = try container.decodeIfPresent(String.self, forKey: .lastExportSplitBy) ?? "none"
        lastExportGroupBy = try container.decodeIfPresent(String.self, forKey: .lastExportGroupBy) ?? "none"
    }
    
    init() {
    }
}

extension Session {
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        id = try container.decode(String.self, forKey: .id)
        startTime = try container.decode(Date.self, forKey: .startTime)
        endTime = try container.decodeIfPresent(Date.self, forKey: .endTime)
        pauseTime = try container.decodeIfPresent(Date.self, forKey: .pauseTime)
        description = try container.decode(String.self, forKey: .description)
        customer = try container.decodeIfPresent(String.self, forKey: .customer)
        project = try container.decodeIfPresent(String.self, forKey: .project)
        plannedDuration = try container.decode(TimeInterval.self, forKey: .plannedDuration)
        sessionState = try container.decode(SessionState.self, forKey: .sessionState)
        lastModified = try container.decodeIfPresent(Date.self, forKey: .lastModified)
        isManuallyCreated = try container.decodeIfPresent(Bool.self, forKey: .isManuallyCreated) ?? false
        isEdited = try container.decodeIfPresent(Bool.self, forKey: .isEdited) ?? false
    }
}
