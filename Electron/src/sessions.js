const { ipcRenderer } = require('electron');

class SessionManager {
    constructor() {
        this.sessions = [];
        this.filteredSessions = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadSessions();
    }

    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.customerFilter = document.getElementById('customerFilter');
        this.projectFilter = document.getElementById('projectFilter');
        this.dateFilter = document.getElementById('dateFilter');
        this.addSessionBtn = document.getElementById('addSessionBtn');
        this.sessionsTableBody = document.getElementById('sessionsTableBody');
        
        // Summary elements
        this.totalSessions = document.getElementById('totalSessions');
        this.totalTime = document.getElementById('totalTime');
        this.todaySessions = document.getElementById('todaySessions');
        this.todayTime = document.getElementById('todayTime');
        
        // Export elements
        this.exportFormat = document.getElementById('exportFormat');
        this.exportRange = document.getElementById('exportRange');
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.startDate = document.getElementById('startDate');
        this.endDate = document.getElementById('endDate');
    }

    setupEventListeners() {
        // Search and filter
        this.searchInput.addEventListener('input', () => this.filterSessions());
        this.customerFilter.addEventListener('change', () => this.filterSessions());
        this.projectFilter.addEventListener('change', () => this.filterSessions());
        this.dateFilter.addEventListener('change', () => this.filterSessions());
        
        // Export range
        this.exportRange.addEventListener('change', () => {
            if (this.exportRange.value === 'custom') {
                this.startDate.style.display = 'inline-block';
                this.endDate.style.display = 'inline-block';
            } else {
                this.startDate.style.display = 'none';
                this.endDate.style.display = 'none';
            }
        });
        
        // Buttons
        this.addSessionBtn.addEventListener('click', () => this.showAddSessionDialog());
        this.exportBtn.addEventListener('click', () => this.exportSessions());
        this.importBtn.addEventListener('click', () => this.importSessions());
        
        // IPC listeners
        ipcRenderer.on('session-completed', (event, session) => {
            this.addSession(session);
            this.loadSessions(); // Refresh the display
        });
    }

    async loadSessions() {
        try {
            this.sessions = await ipcRenderer.invoke('get-sessions');
            this.updateFilters();
            this.filterSessions();
            this.updateSummary();
        } catch (error) {
            console.error('Failed to load sessions:', error);
            this.sessions = [];
            this.renderSessions();
        }
    }

    updateFilters() {
        // Update customer filter
        const customers = [...new Set(this.sessions.map(s => s.customer).filter(Boolean))];
        this.customerFilter.innerHTML = '<option value="">All Customers</option>';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer;
            option.textContent = customer;
            this.customerFilter.appendChild(option);
        });

        // Update project filter
        const projects = [...new Set(this.sessions.map(s => s.project).filter(Boolean))];
        this.projectFilter.innerHTML = '<option value="">All Projects</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project;
            option.textContent = project;
            this.projectFilter.appendChild(option);
        });
    }

    filterSessions() {
        let filtered = [...this.sessions];
        
        // Text search
        const searchTerm = this.searchInput.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(session => 
                (session.description || '').toLowerCase().includes(searchTerm) ||
                (session.customer || '').toLowerCase().includes(searchTerm) ||
                (session.project || '').toLowerCase().includes(searchTerm)
            );
        }
        
        // Customer filter
        if (this.customerFilter.value) {
            filtered = filtered.filter(session => session.customer === this.customerFilter.value);
        }
        
        // Project filter
        if (this.projectFilter.value) {
            filtered = filtered.filter(session => session.project === this.projectFilter.value);
        }
        
        // Date filter
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        switch (this.dateFilter.value) {
            case 'today':
                filtered = filtered.filter(session => {
                    const sessionDate = new Date(session.startTime);
                    return sessionDate >= today;
                });
                break;
            case 'week':
                filtered = filtered.filter(session => {
                    const sessionDate = new Date(session.startTime);
                    return sessionDate >= weekStart;
                });
                break;
            case 'month':
                filtered = filtered.filter(session => {
                    const sessionDate = new Date(session.startTime);
                    return sessionDate >= monthStart;
                });
                break;
        }
        
        this.filteredSessions = filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        this.renderSessions();
    }

    renderSessions() {
        if (this.filteredSessions.length === 0) {
            this.sessionsTableBody.innerHTML = '<tr><td colspan="9" class="no-sessions">No sessions match your filters.</td></tr>';
            return;
        }
        
        this.sessionsTableBody.innerHTML = this.filteredSessions.map(session => {
            const startTime = new Date(session.startTime);
            const endTime = session.endTime ? new Date(session.endTime) : null;
            
            return `
                <tr>
                    <td>
                        <span class="status-indicator status-${session.status || 'completed'}"></span>
                        ${(session.status || 'completed').charAt(0).toUpperCase() + (session.status || 'completed').slice(1)}
                    </td>
                    <td>${startTime.toLocaleDateString()}</td>
                    <td>${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td>${endTime ? endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                    <td>${session.actualDuration || session.duration || 0}min</td>
                    <td>${session.customer || '-'}</td>
                    <td>${session.project || '-'}</td>
                    <td>${session.description || 'Untitled session'}</td>
                    <td>
                        <button class="btn btn-secondary" onclick="sessionManager.editSession('${session.id || Date.now()}')">Edit</button>
                        <button class="btn btn-secondary" onclick="sessionManager.deleteSession('${session.id || Date.now()}')">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateSummary() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Total stats
        this.totalSessions.textContent = this.sessions.length;
        const totalMinutes = this.sessions.reduce((sum, session) => sum + (session.actualDuration || session.duration || 0), 0);
        this.totalTime.textContent = this.formatDuration(totalMinutes);
        
        // Today's stats
        const todaySessions = this.sessions.filter(session => {
            const sessionDate = new Date(session.startTime);
            return sessionDate >= today;
        });
        
        this.todaySessions.textContent = todaySessions.length;
        const todayMinutes = todaySessions.reduce((sum, session) => sum + (session.actualDuration || session.duration || 0), 0);
        this.todayTime.textContent = this.formatDuration(todayMinutes);
    }

    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    }

    async addSession(session) {
        try {
            await ipcRenderer.invoke('save-session', session);
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    }

    showAddSessionDialog() {
        // TODO: Implement add session dialog
        alert('Add session dialog coming soon!');
    }

    editSession(sessionId) {
        // TODO: Implement edit session dialog
        alert(`Edit session ${sessionId} coming soon!`);
    }

    deleteSession(sessionId) {
        if (confirm('Are you sure you want to delete this session?')) {
            // TODO: Implement delete session
            alert(`Delete session ${sessionId} coming soon!`);
        }
    }

    async exportSessions() {
        const format = this.exportFormat.value;
        let sessionsToExport = this.getSessionsForExport();
        
        try {
            let content;
            let filename;
            
            switch (format) {
                case 'json':
                    content = JSON.stringify(sessionsToExport, null, 2);
                    filename = `mattato-sessions-${this.getDateString()}.json`;
                    break;
                    
                case 'csv':
                    content = this.generateCSV(sessionsToExport);
                    filename = `mattato-sessions-${this.getDateString()}.csv`;
                    break;
                    
                case 'pdf':
                    alert('PDF export coming soon!');
                    return;
                    
                case 'ics':
                    alert('ICS export coming soon!');
                    return;
                    
                default:
                    alert('Unknown export format');
                    return;
            }
            
            // Create download
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed: ' + error.message);
        }
    }

    getSessionsForExport() {
        // TODO: Filter sessions based on export range
        return this.filteredSessions;
    }

    generateCSV(sessions) {
        const headers = ['Date', 'Start Time', 'End Time', 'Duration (min)', 'Customer', 'Project', 'Description', 'Status'];
        const rows = sessions.map(session => {
            const startTime = new Date(session.startTime);
            const endTime = session.endTime ? new Date(session.endTime) : null;
            
            return [
                startTime.toLocaleDateString(),
                startTime.toLocaleTimeString(),
                endTime ? endTime.toLocaleTimeString() : '',
                session.actualDuration || session.duration || 0,
                session.customer || '',
                session.project || '',
                `"${(session.description || '').replace(/"/g, '""')}"`,
                session.status || 'completed'
            ].join(',');
        });
        
        return [headers.join(','), ...rows].join('\\n');
    }

    getDateString() {
        return new Date().toISOString().split('T')[0];
    }

    importSessions() {
        // TODO: Implement import functionality
        alert('Import functionality coming soon!');
    }
}

// Initialize session manager when page loads
let sessionManager;
document.addEventListener('DOMContentLoaded', () => {
    sessionManager = new SessionManager();
});