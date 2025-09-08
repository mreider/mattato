import SwiftUI

struct CustomerManagerView: View {
    @ObservedObject var historyManager: HistoryManager
    @State private var newCustomerName: String = ""
    @State private var editingCustomer: String? = nil
    @State private var editingText: String = ""
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    TextField("Customer name", text: $newCustomerName)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit {
                            addCustomer()
                        }
                    
                    Button("Add") {
                        addCustomer()
                    }
                    .buttonStyle(.bordered)
                    .disabled(newCustomerName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            
            Divider()
            
            VStack(alignment: .leading, spacing: 8) {
                if historyManager.preferences.customers.isEmpty {
                    Text("No customers yet")
                        .foregroundColor(.secondary)
                        .italic()
                } else {
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 4) {
                            ForEach(historyManager.preferences.customers.sorted(by: <), id: \.self) { customer in
                                customerRow(for: customer)
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
    
    private func customerRow(for customer: String) -> some View {
        HStack {
            if editingCustomer == customer {
                TextField("Customer name", text: $editingText)
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
                Text(customer)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                Button("Edit") {
                    startEdit(for: customer)
                }
                .buttonStyle(.bordered)
                .font(.caption)
                
                Button("Delete") {
                    deleteCustomer(customer)
                }
                .buttonStyle(.bordered)
                .font(.caption)
            }
        }
        .padding(.vertical, 2)
    }
    
    private func addCustomer() {
        let trimmedName = newCustomerName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedName.isEmpty else { return }
        guard !historyManager.preferences.customers.contains(trimmedName) else { return }
        
        var prefs = historyManager.preferences
        prefs.customers.append(trimmedName)
        prefs.customers.sort(by: <)
        historyManager.updatePreferences(prefs)
        
        newCustomerName = ""
    }
    
    private func deleteCustomer(_ customer: String) {
        var prefs = historyManager.preferences
        prefs.customers.removeAll { $0 == customer }
        
        if prefs.lastUsedCustomer == customer {
            prefs.lastUsedCustomer = ""
        }
        
        historyManager.updatePreferences(prefs)
    }
    
    private func startEdit(for customer: String) {
        editingCustomer = customer
        editingText = customer
    }
    
    private func saveEdit() {
        let trimmedName = editingText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedName.isEmpty else { return }
        guard let originalCustomer = editingCustomer else { return }
        guard trimmedName != originalCustomer else { 
            cancelEdit()
            return 
        }
        guard !historyManager.preferences.customers.contains(trimmedName) else { return }
        
        var prefs = historyManager.preferences
        if let index = prefs.customers.firstIndex(of: originalCustomer) {
            prefs.customers[index] = trimmedName
            prefs.customers.sort(by: <)
            
            if prefs.lastUsedCustomer == originalCustomer {
                prefs.lastUsedCustomer = trimmedName
            }
            
            historyManager.updatePreferences(prefs)
        }
        
        cancelEdit()
    }
    
    private func cancelEdit() {
        editingCustomer = nil
        editingText = ""
    }
}