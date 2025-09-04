import SwiftUI

struct ProjectManagerView: View {
    @ObservedObject var historyManager: HistoryManager
    @State private var newProjectName: String = ""
    @State private var editingProject: String? = nil
    @State private var editingText: String = ""
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
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
                            ForEach(historyManager.preferences.projects, id: \.self) { project in
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
        .frame(width: 400, height: 350)
    }
    
    private func projectRow(for project: String) -> some View {
        HStack {
            if editingProject == project {
                TextField("Project name", text: $editingText)
                    .textFieldStyle(.roundedBorder)
                    .onSubmit {
                        saveEdit()
                    }
                
                Button("Save") {
                    saveEdit()
                }
                .buttonStyle(.bordered)
                .disabled(editingText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                
                Button("Cancel") {
                    cancelEdit()
                }
                .buttonStyle(.bordered)
            } else {
                Text(project)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
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
        prefs.projects.sort()
        historyManager.updatePreferences(prefs)
        
        newProjectName = ""
    }
    
    private func deleteProject(_ project: String) {
        var prefs = historyManager.preferences
        prefs.projects.removeAll { $0 == project }
        
        if prefs.lastUsedProject == project {
            prefs.lastUsedProject = ""
        }
        
        historyManager.updatePreferences(prefs)
    }
    
    private func startEdit(for project: String) {
        editingProject = project
        editingText = project
    }
    
    private func saveEdit() {
        let trimmedName = editingText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedName.isEmpty else { return }
        guard let originalProject = editingProject else { return }
        guard trimmedName != originalProject else { 
            cancelEdit()
            return 
        }
        guard !historyManager.preferences.projects.contains(trimmedName) else { return }
        
        var prefs = historyManager.preferences
        if let index = prefs.projects.firstIndex(of: originalProject) {
            prefs.projects[index] = trimmedName
            prefs.projects.sort()
            
            if prefs.lastUsedProject == originalProject {
                prefs.lastUsedProject = trimmedName
            }
            
            historyManager.updatePreferences(prefs)
        }
        
        cancelEdit()
    }
    
    private func cancelEdit() {
        editingProject = nil
        editingText = ""
    }
}

struct ProjectManagerWindow: NSViewRepresentable {
    let historyManager: HistoryManager
    
    func makeNSView(context: Context) -> NSView {
        let hostingView = NSHostingView(rootView: ProjectManagerView(historyManager: historyManager))
        
        DispatchQueue.main.async {
            if hostingView.window != nil || NSApp.keyWindow != nil {
                let projectWindow = NSWindow(
                    contentRect: NSRect(x: 0, y: 0, width: 400, height: 350),
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