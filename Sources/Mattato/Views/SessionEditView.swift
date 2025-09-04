import SwiftUI

struct SessionEditView: View {
    @ObservedObject var historyManager: HistoryManager
    @State private var sessionDate: Date
    @State private var startTime: Date
    @State private var endTime: Date
    @State private var description: String
    @State private var selectedCustomer: String
    @State private var selectedProject: String
    @State private var validationErrors: [String] = []
    
    let editingSession: Session?
    let onSave: (Session) -> Void
    let onCancel: () -> Void
    
    private var isEditing: Bool {
        editingSession != nil
    }
    
    private var duration: TimeInterval {
        endTime.timeIntervalSince(startTime)
    }
    
    private var formattedDuration: String {
        let hours = Int(duration) / 3600
        let minutes = Int(duration) % 3600 / 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
    
    init(historyManager: HistoryManager, session: Session? = nil, onSave: @escaping (Session) -> Void, onCancel: @escaping () -> Void) {
        self.historyManager = historyManager
        self.editingSession = session
        self.onSave = onSave
        self.onCancel = onCancel
        
        if let session = session {
            _sessionDate = State(initialValue: session.startTime)
            _startTime = State(initialValue: session.startTime)
            _endTime = State(initialValue: session.endTime ?? Date())
            _description = State(initialValue: session.description)
            _selectedCustomer = State(initialValue: session.customer ?? "")
            _selectedProject = State(initialValue: session.project ?? "")
        } else {
            let now = Date()
            let oneHourAgo = Calendar.current.date(byAdding: .hour, value: -1, to: now) ?? now
            _sessionDate = State(initialValue: now)
            _startTime = State(initialValue: oneHourAgo)
            _endTime = State(initialValue: now)
            _description = State(initialValue: "")
            _selectedCustomer = State(initialValue: "")
            _selectedProject = State(initialValue: "")
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text(isEditing ? "Edit Session" : "Add Session")
                    .font(.headline)
                    .fontWeight(.medium)
                Spacer()
                Button("Cancel") {
                    onCancel()
                }
                .buttonStyle(.bordered)
            }
            
            if !validationErrors.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(validationErrors, id: \.self) { error in
                        Text("• \(error)")
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.red.opacity(0.1))
                .cornerRadius(4)
            }
            
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("Date:")
                        .frame(width: 80, alignment: .leading)
                    DatePicker("", selection: $sessionDate, displayedComponents: .date)
                        .datePickerStyle(.compact)
                        .environment(\.locale, historyManager.preferences.exportDateFormat == "MM.DD.YYYY" ? Locale(identifier: "en_US") : Locale(identifier: "de_DE"))
                        .onChange(of: sessionDate) { newDate in
                            updateDateComponents(newDate)
                        }
                }
                
                HStack {
                    Text("Start:")
                        .frame(width: 80, alignment: .leading)
                    DatePicker("", selection: $startTime, displayedComponents: .hourAndMinute)
                        .datePickerStyle(.compact)
                        .environment(\.locale, historyManager.preferences.exportDateFormat == "MM.DD.YYYY" ? Locale(identifier: "en_US") : Locale(identifier: "de_DE"))
                        .onChange(of: startTime) { _ in
                            validateTimes()
                        }
                }
                
                HStack {
                    Text("End:")
                        .frame(width: 80, alignment: .leading)
                    DatePicker("", selection: $endTime, displayedComponents: .hourAndMinute)
                        .datePickerStyle(.compact)
                        .environment(\.locale, historyManager.preferences.exportDateFormat == "MM.DD.YYYY" ? Locale(identifier: "en_US") : Locale(identifier: "de_DE"))
                        .onChange(of: endTime) { _ in
                            validateTimes()
                        }
                }
                
                HStack {
                    Text("Duration:")
                        .frame(width: 80, alignment: .leading)
                    Text(formattedDuration)
                        .foregroundColor(.secondary)
                        .font(.system(.body, design: .monospaced))
                }
                
                Divider()
                
                HStack {
                    Text("Customer:")
                        .frame(width: 80, alignment: .leading)
                    Picker("", selection: $selectedCustomer) {
                        Text("(none)").tag("")
                        ForEach(historyManager.preferences.customers, id: \.self) { customer in
                            Text(customer).tag(customer)
                        }
                    }
                    .pickerStyle(.menu)
                    .frame(width: 150)
                }
                
                HStack {
                    Text("Project:")
                        .frame(width: 80, alignment: .leading)
                    Picker("", selection: $selectedProject) {
                        Text("(none)").tag("")
                        ForEach(historyManager.preferences.projects, id: \.self) { project in
                            Text(project).tag(project)
                        }
                    }
                    .pickerStyle(.menu)
                    .frame(width: 150)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Description:")
                    TextField("Enter session description", text: $description)
                        .textFieldStyle(.roundedBorder)
                }
            }
            
            if !isEditing {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Quick Add:")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    HStack(spacing: 8) {
                        Button("15m") { setDuration(minutes: 15) }
                            .buttonStyle(.bordered)
                            .font(.caption)
                        Button("30m") { setDuration(minutes: 30) }
                            .buttonStyle(.bordered)
                            .font(.caption)
                        Button("1h") { setDuration(minutes: 60) }
                            .buttonStyle(.bordered)
                            .font(.caption)
                        Button("2h") { setDuration(minutes: 120) }
                            .buttonStyle(.bordered)
                            .font(.caption)
                        Spacer()
                    }
                }
            }
            
            Spacer()
            
            HStack {
                Spacer()
                Button("Save") {
                    saveSession()
                }
                .buttonStyle(.borderedProminent)
                .disabled(!isValidSession())
            }
        }
        .padding()
        .frame(width: 450, height: isEditing ? 400 : 500)
        .onAppear {
            validateTimes()
        }
    }
    
    private func updateDateComponents(_ newDate: Date) {
        let calendar = Calendar.current
        
        let startComponents = calendar.dateComponents([.hour, .minute], from: startTime)
        startTime = calendar.date(bySettingHour: startComponents.hour ?? 0,
                                  minute: startComponents.minute ?? 0,
                                  second: 0,
                                  of: newDate) ?? newDate
        
        let endComponents = calendar.dateComponents([.hour, .minute], from: endTime)
        endTime = calendar.date(bySettingHour: endComponents.hour ?? 0,
                                minute: endComponents.minute ?? 0,
                                second: 0,
                                of: newDate) ?? newDate
        
        validateTimes()
    }
    
    private func setDuration(minutes: Int) {
        endTime = Calendar.current.date(byAdding: .minute, value: minutes, to: startTime) ?? endTime
        validateTimes()
    }
    
    private func validateTimes() {
        validationErrors.removeAll()
        
        if endTime <= startTime {
            validationErrors.append("End time must be after start time")
        }
        
        if duration > 12 * 3600 {
            validationErrors.append("Session duration cannot exceed 12 hours")
        }
        
        if duration < 60 {
            validationErrors.append("Session must be at least 1 minute long")
        }
        
        if startTime > Date() {
            validationErrors.append("Session cannot be in the future")
        }
        
        if let daysAgo = Calendar.current.dateComponents([.day], from: startTime, to: Date()).day,
           daysAgo > 30 {
            validationErrors.append("Warning: Session is \(daysAgo) days old")
        }
        
        if let overlapping = findOverlappingSessions() {
            validationErrors.append("Overlaps with existing session: \(overlapping.formattedDescription)")
        }
    }
    
    private func findOverlappingSessions() -> Session? {
        let currentSessionId = editingSession?.id
        
        return historyManager.sessions.first { session in
            guard session.id != currentSessionId,
                  let sessionEnd = session.endTime else { return false }
            
            let sessionStart = session.startTime
            return (startTime < sessionEnd && endTime > sessionStart)
        }
    }
    
    private func isValidSession() -> Bool {
        return validationErrors.filter { !$0.hasPrefix("Warning:") }.isEmpty &&
               !description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    private func saveSession() {
        guard isValidSession() else { return }
        
        let trimmedDescription = description.trimmingCharacters(in: .whitespacesAndNewlines)
        let customerName = selectedCustomer.isEmpty ? nil : selectedCustomer
        let projectName = selectedProject.isEmpty ? nil : selectedProject
        
        if let existing = editingSession {
            var updatedSession = existing
            updatedSession.startTime = startTime
            updatedSession.endTime = endTime
            updatedSession.description = trimmedDescription
            updatedSession.customer = customerName
            updatedSession.project = projectName
            updatedSession.plannedDuration = duration
            updatedSession.markAsEdited()
            
            onSave(updatedSession)
        } else {
            let sessionId = "manual-\(Date().timeIntervalSince1970)"
            let newSession = Session(
                id: sessionId,
                startTime: startTime,
                endTime: endTime,
                description: trimmedDescription,
                customer: customerName,
                project: projectName
            )
            
            onSave(newSession)
        }
    }
}