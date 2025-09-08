import SwiftUI

struct ProjectManagerView: View {
    @ObservedObject var historyManager: HistoryManager
    @State private var newProjectName: String = ""
    @State private var newProjectDetail: String = ""
    @State private var editingProject: String? = nil
    @State private var editingText: String = ""
    @State private var editingDetailText: String = ""
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                VStack(spacing: 8) {
                    HStack {
                        TextField("Project name", text: $newProjectName)
                            .textFieldStyle(.roundedBorder)
                            .onSubmit {
                                addProject()
                            }
                        
                        Button("Add") {
                            addProject()
                        }
                        .buttonStyle(.bordered)
                        .disabled(newProjectName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    }
                    
                    TextField("Project details (optional)", text: $newProjectDetail)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit {
                            addProject()
                        }
                }
            }
            
            Divider()
            
            VStack(alignment: .leading, spacing: 8) {
                if historyManager.preferences.projects.isEmpty {
                    Text("No projects yet")
                        .foregroundColor(.secondary)
                        .italic()
                } else {
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text("Project")
                                    .font(.headline)
                                    .frame(width: 120, alignment: .leading)
                                Text("Details")
                                    .font(.headline)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                Text("Actions")
                                    .font(.headline)
                                    .frame(width: 100)
                            }
                            .padding(.vertical, 4)
                            
                            Divider()
                            
                            ForEach(historyManager.preferences.projects.sorted(by: <), id: \.self) { project in
                                projectRow(for: project)
                            }
                        }
                    }
                    .frame(maxHeight: 200)
                }
            }
            
            Spacer()
        }
        .padding()
        .frame(width: 600, height: 400)
    }
    
    private func projectRow(for project: String) -> some View {
        HStack {
            if editingProject == project {
                VStack(spacing: 4) {
                    TextField("Project name", text: $editingText)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit {
                            saveEdit()
                        }
                    
                    TextField("Project details", text: $editingDetailText)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit {
                            saveEdit()
                        }
                }
                
                VStack(spacing: 4) {
                    Button("Save") {
                        saveEdit()
                    }
                    .buttonStyle(.bordered)
                    .disabled(editingText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    
                    Button("Cancel") {
                        cancelEdit()
                    }
                    .buttonStyle(.bordered)
                }
                .frame(width: 100)
            } else {
                Text(project)
                    .frame(width: 120, alignment: .leading)
                    .lineLimit(1)
                
                Text(historyManager.preferences.projectDetails[project] ?? "")
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                
                HStack {
                    Button("Edit") {
                        startEdit(for: project)
                    }
                    .buttonStyle(.bordered)
                    .font(.caption)
                    
                    Button("Delete") {
                        deleteProject(project)
                    }
                    .buttonStyle(.bordered)
                    .font(.caption)
                    .foregroundColor(.red)
                }
                .frame(width: 100)
            }
        }
        .padding(.vertical, 2)
    }
    
    private func addProject() {
        let trimmedName = newProjectName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedName.isEmpty else { return }
        guard !historyManager.preferences.projects.contains(trimmedName) else { return }
        
        var prefs = historyManager.preferences
        prefs.projects.append(trimmedName)
        prefs.projects.sort(by: <)
        
        let trimmedDetail = newProjectDetail.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedDetail.isEmpty {
            prefs.projectDetails[trimmedName] = trimmedDetail
        }
        
        historyManager.updatePreferences(prefs)
        
        newProjectName = ""
        newProjectDetail = ""
    }
    
    private func deleteProject(_ project: String) {
        var prefs = historyManager.preferences
        prefs.projects.removeAll { $0 == project }
        prefs.projectDetails.removeValue(forKey: project)
        
        if prefs.lastUsedProject == project {
            prefs.lastUsedProject = ""
        }
        
        historyManager.updatePreferences(prefs)
    }
    
    private func startEdit(for project: String) {
        editingProject = project
        editingText = project
        editingDetailText = historyManager.preferences.projectDetails[project] ?? ""
    }
    
    private func saveEdit() {
        let trimmedName = editingText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedName.isEmpty else { return }
        guard let originalProject = editingProject else { return }
        
        if trimmedName != originalProject {
            guard !historyManager.preferences.projects.contains(trimmedName) else { return }
        }
        
        var prefs = historyManager.preferences
        if let index = prefs.projects.firstIndex(of: originalProject) {
            prefs.projects[index] = trimmedName
            prefs.projects.sort(by: <)
            
            if prefs.lastUsedProject == originalProject {
                prefs.lastUsedProject = trimmedName
            }
            
            // Handle project details
            prefs.projectDetails.removeValue(forKey: originalProject)
            
            let trimmedDetail = editingDetailText.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmedDetail.isEmpty {
                prefs.projectDetails[trimmedName] = trimmedDetail
            }
            
            historyManager.updatePreferences(prefs)
        }
        
        cancelEdit()
    }
    
    private func cancelEdit() {
        editingProject = nil
        editingText = ""
        editingDetailText = ""
    }
}

struct ProjectManagerWindow: NSViewRepresentable {
    let historyManager: HistoryManager
    
    func makeNSView(context: Context) -> NSView {
        let hostingView = NSHostingView(rootView: ProjectManagerView(historyManager: historyManager))
        
        DispatchQueue.main.async {
            if hostingView.window != nil || NSApp.keyWindow != nil {
                let projectWindow = NSWindow(
                    contentRect: NSRect(x: 0, y: 0, width: 600, height: 400),
                    styleMask: [.titled, .closable],
                    backing: .buffered,
                    defer: false
                )
                
                projectWindow.title = "Manage Projects"
                projectWindow.contentView = hostingView
                projectWindow.center()
                projectWindow.makeKeyAndOrderFront(nil)
                
                projectWindow.level = .floating
            }
        }
        
        return hostingView
    }
    
    func updateNSView(_ nsView: NSView, context: Context) {}
}