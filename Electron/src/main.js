const { app, BrowserWindow, Tray, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize electron-store for data persistence
const store = new Store();

class MattatoApp {
  constructor() {
    this.mainWindow = null;
    this.timerWindow = null;
    this.tray = null;
    this.isTimerRunning = false;
    this.currentSession = null;
    this.timerInterval = null;
  }

  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 900,
      height: 700,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      show: false,
      title: 'Mattato - Session Manager'
    });

    this.mainWindow.loadFile('src/index.html');

    // Hide instead of close
    this.mainWindow.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        this.mainWindow.hide();
      }
    });
  }

  createTimerWindow() {
    this.timerWindow = new BrowserWindow({
      width: 200,
      height: 250,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      show: false,
      title: 'Mattato Timer'
    });

    this.timerWindow.loadFile('src/timer.html');

    this.timerWindow.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        this.timerWindow.hide();
      }
    });
  }

  createTray() {
    // Use tomato icon or fallback
    const iconPath = path.join(__dirname, '../assets/tray-icon.png');
    this.tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Timer',
        click: () => {
          if (this.timerWindow) {
            this.timerWindow.show();
          }
        }
      },
      {
        label: 'Hide Timer',
        click: () => {
          if (this.timerWindow) {
            this.timerWindow.hide();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'View Sessions',
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.show();
          }
        }
      },
      {
        label: 'Projects',
        submenu: [
          { label: 'Manage Projects...', click: () => this.showProjectManager() }
        ]
      },
      {
        label: 'Customers',
        submenu: [
          { label: 'Manage Customers...', click: () => this.showCustomerManager() }
        ]
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => this.showSettings()
      },
      {
        label: 'About',
        click: () => this.showAbout()
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('Mattato Timer');

    // Double-click to show/hide timer
    this.tray.on('double-click', () => {
      if (this.timerWindow) {
        if (this.timerWindow.isVisible()) {
          this.timerWindow.hide();
        } else {
          this.timerWindow.show();
        }
      }
    });
  }

  showProjectManager() {
    // TODO: Implement project manager
    dialog.showMessageBox(this.mainWindow, {
      title: 'Projects',
      message: 'Project manager coming soon!'
    });
  }

  showCustomerManager() {
    // TODO: Implement customer manager
    dialog.showMessageBox(this.mainWindow, {
      title: 'Customers',
      message: 'Customer manager coming soon!'
    });
  }

  showSettings() {
    // TODO: Implement settings window
    dialog.showMessageBox(this.mainWindow, {
      title: 'Settings',
      message: 'Settings window coming soon!'
    });
  }

  showAbout() {
    dialog.showMessageBox(this.mainWindow, {
      title: 'About Mattato',
      message: 'Mattato Timer v1.0.0\\n\\nA cross-platform Pomodoro timer with session tracking.',
      type: 'info'
    });
  }

  setupIPC() {
    // Timer controls
    ipcMain.handle('start-timer', (event, sessionData) => {
      return this.startTimer(sessionData);
    });

    ipcMain.handle('pause-timer', () => {
      return this.pauseTimer();
    });

    ipcMain.handle('stop-timer', () => {
      return this.stopTimer();
    });

    ipcMain.handle('get-timer-state', () => {
      return {
        isRunning: this.isTimerRunning,
        currentSession: this.currentSession
      };
    });

    // Data operations
    ipcMain.handle('get-sessions', () => {
      return store.get('sessions', []);
    });

    ipcMain.handle('save-session', (event, session) => {
      const sessions = store.get('sessions', []);
      sessions.push(session);
      store.set('sessions', sessions);
      return sessions;
    });

    ipcMain.handle('get-settings', () => {
      return store.get('settings', {
        defaultSessionLength: 25,
        showCustomer: false,
        showProject: false,
        playSound: true,
        soundFile: 'Glass'
      });
    });

    ipcMain.handle('save-settings', (event, settings) => {
      store.set('settings', settings);
      return settings;
    });
  }

  startTimer(sessionData) {
    if (this.isTimerRunning) {
      return { success: false, message: 'Timer already running' };
    }

    this.currentSession = {
      ...sessionData,
      startTime: new Date(),
      remainingTime: sessionData.duration * 60 * 1000, // Convert minutes to milliseconds
      status: 'running'
    };

    this.isTimerRunning = true;

    this.timerInterval = setInterval(() => {
      this.currentSession.remainingTime -= 1000;

      // Update timer window
      if (this.timerWindow) {
        this.timerWindow.webContents.send('timer-update', this.currentSession);
      }

      // Timer completed
      if (this.currentSession.remainingTime <= 0) {
        this.completeTimer();
      }
    }, 1000);

    return { success: true, session: this.currentSession };
  }

  pauseTimer() {
    if (!this.isTimerRunning) {
      return { success: false, message: 'Timer not running' };
    }

    this.isTimerRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.currentSession.status = 'paused';
    return { success: true, session: this.currentSession };
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.isTimerRunning = false;
    this.currentSession = null;

    return { success: true };
  }

  completeTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.isTimerRunning = false;
    
    if (this.currentSession) {
      this.currentSession.endTime = new Date();
      this.currentSession.status = 'completed';
      this.currentSession.actualDuration = Math.round((this.currentSession.endTime - this.currentSession.startTime) / 1000 / 60);

      // Save completed session
      const sessions = store.get('sessions', []);
      sessions.push(this.currentSession);
      store.set('sessions', sessions);

      // Notify windows
      if (this.timerWindow) {
        this.timerWindow.webContents.send('timer-completed', this.currentSession);
      }
      if (this.mainWindow) {
        this.mainWindow.webContents.send('session-completed', this.currentSession);
      }

      this.currentSession = null;
    }
  }

  initialize() {
    // Create windows
    this.createMainWindow();
    this.createTimerWindow();
    
    // Create system tray
    this.createTray();
    
    // Setup IPC handlers
    this.setupIPC();

    // Show timer window by default
    this.timerWindow.show();
  }
}

// App event handlers
const mattatoApp = new MattatoApp();

app.whenReady().then(() => {
  mattatoApp.initialize();
});

app.on('window-all-closed', () => {
  // Keep app running on macOS when windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mattatoApp.createMainWindow();
    mattatoApp.createTimerWindow();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});