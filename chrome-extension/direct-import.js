// Mattato TimeCockpit Direct Import - Pure JavaScript Approach
// This bypasses all UI automation and directly manipulates the data models

class MattatoDirectImport {
    constructor() {
        this.loadedJSON = null;
        this.angularScope = null;
        this.modalScope = null;
    }

    // Main import function - complete API-based flow
    async importSessionsDirectly(jsonData) {
        try {
            console.log('MATTATO DIRECT: Starting complete API import');
            
            // 1. Validate and process JSON
            const sessions = this.validateAndExtractSessions(jsonData);
            if (!sessions.length) {
                throw new Error('No valid sessions found');
            }

            // 2. Get TimeCockpit API context
            await this.getTimeCockpitContext();
            
            // 3. Process each session: Search → Create → Verify
            const results = [];
            for (const session of sessions) {
                console.log('MATTATO DIRECT: Processing session', session.description);
                
                // Step 1: Search for ticket/task
                const taskId = await this.searchForTask(session.project || session.description);
                
                // Step 2: Create timesheet entry via API
                const timesheetData = this.buildTimesheetData(session, taskId);
                const result = await this.createTimesheetViaAPI(timesheetData);
                
                results.push({
                    session: session.description,
                    taskFound: !!taskId,
                    created: !!result,
                    timesheetId: result?.id || result?.Uuid
                });
            }
            
            // 4. Refresh page to show results
            if (results.some(r => r.created)) {
                console.log('MATTATO DIRECT: Import completed, refreshing page');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
            
            return results;
            
        } catch (error) {
            console.error('MATTATO DIRECT: Import failed', error);
            throw error;
        }
    }

    validateAndExtractSessions(jsonData) {
        if (!jsonData.exported_at || !jsonData.export_title) {
            throw new Error('Invalid Mattato JSON format');
        }
        
        let sessions = [];
        if (jsonData.sessions) {
            sessions = jsonData.sessions;
        } else if (jsonData.grouped_sessions) {
            sessions = this.flattenGroupedSessions(jsonData.grouped_sessions);
        }
        
        // Filter for current week (if needed)
        const currentWeek = this.getCurrentWeekFromPage();
        if (currentWeek) {
            sessions = this.filterSessionsForWeek(sessions, currentWeek);
        }
        
        return sessions;
    }

    async getTimeCockpitContext() {
        // Get Angular scope and services
        const appElement = document.querySelector('[ng-app]') || document.body;
        const injector = angular.element(appElement).injector();
        
        if (!injector) {
            throw new Error('Angular injector not found');
        }
        
        // Get key services
        this.dataContextService = injector.get('dataContextService');
        this.$http = injector.get('$http');
        this.$q = injector.get('$q');
        this.modalScope = this.findModalScope();
        
        // Get base API URL and auth info
        this.apiBaseUrl = this.extractApiBaseUrl();
        
        console.log('MATTATO DIRECT: Got TimeCockpit context', {
            dataContextService: !!this.dataContextService,
            $http: !!this.$http,
            apiBaseUrl: this.apiBaseUrl,
            modalScope: !!this.modalScope
        });
    }

    extractApiBaseUrl() {
        // Extract API base URL from current page or network requests
        const scripts = Array.from(document.scripts);
        for (const script of scripts) {
            if (script.src && script.src.includes('timecockpit.com')) {
                const match = script.src.match(/(https:\/\/[^\/]+)/);
                if (match) {
                    return match[1] + '/odata';
                }
            }
        }
        
        // Fallback: construct from current URL
        return window.location.origin + '/odata';
    }

    findModalScope() {
        const modalElement = document.querySelector('.cofx-view-content[aria-hidden="false"]');
        if (modalElement) {
            return angular.element(modalElement).scope();
        }
        return null;
    }

    async createTimesheetEntry(session) {
        console.log('MATTATO DIRECT: Creating entry for session', session);
        
        try {
            // Method 1: Direct data context service call
            if (this.dataContextService) {
                return await this.createViaDataService(session);
            }
            
            // Method 2: Direct scope manipulation
            if (this.modalScope) {
                return this.createViaScope(session);
            }
            
            throw new Error('No creation method available');
            
        } catch (error) {
            console.error('MATTATO DIRECT: Failed to create entry', error);
            throw error;
        }
    }

    async createViaDataService(session) {
        // Create timesheet object directly via data service
        const timesheetData = {
            APP_Description: session.description || 'Imported from Mattato',
            APP_BeginTime: this.formatTimeForTimeCockpit(session.start_time),
            APP_EndTime: this.formatTimeForTimeCockpit(session.end_time || this.calculateEndTime(session)),
            APP_DateActual: this.formatDateForTimeCockpit(session.start_time),
            USR_TimesheetTypeUuid: await this.getDefaultTimesheetType(),
            APP_TaskUuid: await this.findOrCreateTask(session.project || session.description)
        };

        console.log('MATTATO DIRECT: Creating timesheet via data service', timesheetData);
        
        // Use TimeCockpit's own data service to create the entry
        const result = await this.dataContextService.addObject('Timesheet', timesheetData, []).toPromise();
        
        console.log('MATTATO DIRECT: Created via data service', result);
        return result;
    }

    createViaScope(session) {
        if (!this.modalScope || !this.modalScope.dataItems || !this.modalScope.dataItems[0]) {
            throw new Error('Modal scope not properly initialized');
        }

        const dataItem = this.modalScope.dataItems[0];
        
        // Disable validation interference
        this.disableValidationInterference();
        
        // Update the entity directly
        dataItem.entity.APP_Description = session.description || 'Imported from Mattato';
        dataItem.entity.APP_BeginTime = this.formatTimeForTimeCockpit(session.start_time);
        dataItem.entity.APP_EndTime = this.formatTimeForTimeCockpit(session.end_time || this.calculateEndTime(session));
        dataItem.entity.APP_DateActual = this.formatDateForTimeCockpit(session.start_time);
        
        // Mark properties as changed
        ['APP_Description', 'APP_BeginTime', 'APP_EndTime', 'APP_DateActual'].forEach(prop => {
            if (dataItem.changedPropertyNamesSinceLastSave.indexOf(prop) < 0) {
                dataItem.changedPropertyNamesSinceLastSave.push(prop);
            }
        });
        
        // Trigger Angular digest
        this.modalScope.$apply();
        
        console.log('MATTATO DIRECT: Updated scope directly', dataItem.entity);
        return dataItem.entity;
    }

    disableValidationInterference() {
        if (this.modalScope && this.modalScope.ignoreUpdatedPropertiesFromValidationManager) {
            const timeProps = ['APP_BeginTime', 'APP_EndTime', 'APP_BeginTimeActual', 'APP_EndTimeActual'];
            timeProps.forEach(prop => {
                const index = this.modalScope.ignoreUpdatedPropertiesFromValidationManager.indexOf(prop);
                if (index >= 0) {
                    this.modalScope.ignoreUpdatedPropertiesFromValidationManager.splice(index, 1);
                }
            });
            console.log('MATTATO DIRECT: Disabled validation interference for time props');
        }
    }

    formatTimeForTimeCockpit(dateString) {
        const date = new Date(dateString);
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        if (hours === 0) hours = 12;
        return `${hours}:${minutes} ${ampm}`;
    }

    formatDateForTimeCockpit(dateString) {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    }

    calculateEndTime(session) {
        const start = new Date(session.start_time);
        const duration = session.duration || (25 * 60 * 1000); // Default 25 minutes
        return new Date(start.getTime() + duration);
    }

    async getDefaultTimesheetType() {
        // Try to find default timesheet type UUID
        if (this.modalScope && this.modalScope.dataItems && this.modalScope.dataItems[0]) {
            return this.modalScope.dataItems[0].entity.USR_TimesheetTypeUuid || null;
        }
        return null;
    }

    // Search for task/ticket via API (same as Search Tickets button)
    async searchForTask(projectName) {
        try {
            console.log('MATTATO DIRECT: Searching for task:', projectName);
            
            // Use the same search endpoint that the "Search Tickets" action uses
            const searchUrl = `${this.apiBaseUrl}/USR_SearchTasksAction`;
            const searchPayload = {
                USR_Code: projectName
            };
            
            const response = await this.$http.post(searchUrl, searchPayload).toPromise();
            
            if (response.data && response.data.length > 0) {
                const firstTask = response.data[0];
                console.log('MATTATO DIRECT: Found task:', firstTask);
                return firstTask.Uuid || firstTask.Id;
            } else {
                console.log('MATTATO DIRECT: No task found for:', projectName);
                return null;
            }
            
        } catch (error) {
            console.error('MATTATO DIRECT: Task search failed:', error);
            return null;
        }
    }

    buildTimesheetData(session, taskId) {
        const startDate = new Date(session.start_time);
        const endTime = session.end_time ? 
            new Date(session.end_time) : 
            new Date(startDate.getTime() + (session.duration || 25 * 60 * 1000));
        
        return {
            APP_Description: session.description || 'Imported from Mattato',
            APP_BeginTime: this.formatTimeForAPI(startDate),
            APP_EndTime: this.formatTimeForAPI(endTime),
            APP_DateActual: this.formatDateForAPI(startDate),
            APP_TaskUuid: taskId,
            USR_TimesheetTypeUuid: this.getDefaultTimesheetTypeId()
        };
    }

    async createTimesheetViaAPI(timesheetData) {
        try {
            console.log('MATTATO DIRECT: Creating timesheet via API:', timesheetData);
            
            // Use TimeCockpit's OData API to create timesheet entry
            const createUrl = `${this.apiBaseUrl}/Timesheet`;
            
            const response = await this.$http.post(createUrl, timesheetData).toPromise();
            
            console.log('MATTATO DIRECT: Timesheet created successfully:', response.data);
            return response.data;
            
        } catch (error) {
            console.error('MATTATO DIRECT: Timesheet creation failed:', error);
            throw error;
        }
    }

    formatTimeForAPI(date) {
        // Format as ISO datetime for API
        return date.toISOString();
    }

    formatDateForAPI(date) {
        // Format as ISO date for API
        return date.toISOString().split('T')[0];
    }

    getDefaultTimesheetTypeId() {
        // Try to get from current modal context or return null
        if (this.modalScope && this.modalScope.dataItems && this.modalScope.dataItems[0]) {
            return this.modalScope.dataItems[0].entity.USR_TimesheetTypeUuid;
        }
        return null;
    }

    getCurrentWeekFromPage() {
        const dateSpan = document.querySelector('.tc-calendar-selected-day');
        return dateSpan ? dateSpan.textContent.trim() : null;
    }

    filterSessionsForWeek(sessions, currentWeek) {
        // Implement week filtering logic
        const currentDate = new Date(currentWeek);
        if (isNaN(currentDate.getTime())) return sessions;
        
        const day = currentDate.getDay();
        const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(currentDate.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        weekEnd.setHours(0, 0, 0, 0);
        
        return sessions.filter(session => {
            const sessionDate = new Date(session.start_time);
            return sessionDate >= weekStart && sessionDate < weekEnd;
        });
    }

    flattenGroupedSessions(groupedSessions) {
        const sessions = [];
        const addSessions = (obj) => {
            if (Array.isArray(obj)) {
                sessions.push(...obj);
            } else if (typeof obj === 'object') {
                Object.values(obj).forEach(addSessions);
            }
        };
        addSessions(groupedSessions);
        return sessions;
    }
}

// Global instance
window.MattatoDirectImport = MattatoDirectImport;

// Usage example:
/*
const importer = new MattatoDirectImport();
importer.importSessionsDirectly(jsonData)
    .then(results => console.log('Import successful:', results))
    .catch(error => console.error('Import failed:', error));
*/