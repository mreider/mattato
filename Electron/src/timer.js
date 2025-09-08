const { ipcRenderer } = require('electron');

class TimerUI {
    constructor() {
        this.isEditing = false;
        this.currentSession = null;
        this.settings = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadSettings();
        this.updateDisplay();
    }

    initializeElements() {
        this.timerDisplay = document.getElementById('timerDisplay');
        this.sessionInfo = document.getElementById('sessionInfo');
        this.editMode = document.getElementById('editMode');
        
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        
        this.durationInput = document.getElementById('durationInput');
        this.descriptionInput = document.getElementById('descriptionInput');
        this.customerSelect = document.getElementById('customerSelect');
        this.projectSelect = document.getElementById('projectSelect');
        this.customerLabel = document.getElementById('customerLabel');
        this.projectLabel = document.getElementById('projectLabel');
    }

    async loadSettings() {
        try {
            this.settings = await ipcRenderer.invoke('get-settings');
            this.durationInput.value = this.settings.defaultSessionLength;
            
            // Show/hide customer and project fields based on settings
            if (this.settings.showCustomer) {
                this.customerSelect.classList.remove('hidden');
                this.customerLabel.classList.remove('hidden');
            }
            
            if (this.settings.showProject) {
                this.projectSelect.classList.remove('hidden');
                this.projectLabel.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.settings = {
                defaultSessionLength: 25,
                showCustomer: false,
                showProject: false
            };
        }
    }

    setupEventListeners() {
        this.playBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.stopBtn.addEventListener('click', () => this.stopTimer());
        this.settingsBtn.addEventListener('click', () => this.toggleEditMode());

        // IPC listeners for timer updates
        ipcRenderer.on('timer-update', (event, session) => {
            this.currentSession = session;
            this.updateDisplay();
        });

        ipcRenderer.on('timer-completed', (event, session) => {
            this.onTimerCompleted(session);
        });

        // Update display when duration changes
        this.durationInput.addEventListener('input', () => {
            if (!this.currentSession) {
                this.updateDisplay();
            }
        });
    }

    toggleEditMode() {
        this.isEditing = !this.isEditing;
        
        if (this.isEditing) {
            this.editMode.classList.remove('hidden');
            this.settingsBtn.style.background = '#3498db';
        } else {
            this.editMode.classList.add('hidden');
            this.settingsBtn.style.background = '#95a5a6';
        }
    }

    async startTimer() {
        const sessionData = {
            duration: parseInt(this.durationInput.value) || 25,
            description: this.descriptionInput.value || 'Work Session',
            customer: this.customerSelect.value || null,
            project: this.projectSelect.value || null
        };

        try {
            const result = await ipcRenderer.invoke('start-timer', sessionData);
            
            if (result.success) {
                this.currentSession = result.session;
                this.updateButtonStates('running');
                this.sessionInfo.textContent = sessionData.description;
                this.sessionInfo.classList.remove('hidden');
                this.editMode.classList.add('hidden');
                this.isEditing = false;
                this.settingsBtn.style.background = '#95a5a6';
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Failed to start timer:', error);
            alert('Failed to start timer');
        }
    }

    async pauseTimer() {
        try {
            const result = await ipcRenderer.invoke('pause-timer');
            
            if (result.success) {
                this.currentSession = result.session;
                this.updateButtonStates('paused');
            }
        } catch (error) {
            console.error('Failed to pause timer:', error);
        }
    }

    async stopTimer() {
        try {
            const result = await ipcRenderer.invoke('stop-timer');
            
            if (result.success) {
                this.currentSession = null;
                this.updateButtonStates('idle');
                this.sessionInfo.classList.add('hidden');
                this.updateDisplay();
            }
        } catch (error) {
            console.error('Failed to stop timer:', error);
        }
    }

    updateButtonStates(state) {
        // Hide all buttons first
        this.playBtn.classList.add('hidden');
        this.pauseBtn.classList.add('hidden');
        this.stopBtn.classList.add('hidden');

        switch (state) {
            case 'idle':
                this.playBtn.classList.remove('hidden');
                break;
            case 'running':
                this.pauseBtn.classList.remove('hidden');
                this.stopBtn.classList.remove('hidden');
                break;
            case 'paused':
                this.playBtn.classList.remove('hidden');
                this.stopBtn.classList.remove('hidden');
                break;
        }
    }

    updateDisplay() {
        let displayTime;
        
        if (this.currentSession && this.currentSession.remainingTime !== undefined) {
            // Show remaining time for active session
            const minutes = Math.floor(this.currentSession.remainingTime / (1000 * 60));
            const seconds = Math.floor((this.currentSession.remainingTime % (1000 * 60)) / 1000);
            displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            // Show default duration when no active session
            const duration = parseInt(this.durationInput.value) || 25;
            displayTime = `${duration.toString().padStart(2, '0')}:00`;
        }
        
        this.timerDisplay.textContent = displayTime;
    }

    onTimerCompleted(session) {
        // Visual feedback for completed timer
        document.body.classList.add('completed');
        
        // Play completion sound if enabled
        if (this.settings && this.settings.playSound) {
            // You could add audio playback here
        }
        
        // Show completion notification
        setTimeout(() => {
            alert(`Session completed!\\n\\nDescription: ${session.description}\\nDuration: ${session.actualDuration} minutes`);
            document.body.classList.remove('completed');
            this.currentSession = null;
            this.updateButtonStates('idle');
            this.sessionInfo.classList.add('hidden');
            this.updateDisplay();
        }, 1000);
    }

    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Initialize the timer UI when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TimerUI();
});