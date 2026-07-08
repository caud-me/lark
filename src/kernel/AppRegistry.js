/**
 * AppRegistry
 *
 * Responsibility:
 * Maintains the registry of installed applications.
 *
 * Does NOT:
 * - Launch applications
 * - Manage running processes
 */
export class AppRegistry {
    constructor() {
        this.apps = new Map();
        this._loadDefaultApps();
        
        // TODO (Series 2):
        // Load app definitions from /system/apps.json
    }

    _loadDefaultApps() {
        const defaultApps = [
            {
                id: 'sys.eventviewer',
                title: 'Event Viewer',
                name: 'Event Viewer', // legacy alias
                description: 'System logging and diagnostic viewer',
                icon: '📋',
                category: 'System',
                entryPoint: '../apps/system/EventViewer.js',
                type: 'system',
                singleton: true,
                protected: false,
                hidden: false,
                version: '1.0.0',
                author: 'LDE Core'
            },
            {
                id: 'sys.taskmanager',
                title: 'Task Manager',
                name: 'Task Manager',
                description: 'Process and performance monitoring',
                icon: '📈',
                category: 'System',
                entryPoint: '../apps/system/TaskManager.js',
                type: 'system',
                singleton: true,
                protected: false,
                hidden: false,
                version: '1.0.0',
                author: 'LDE Core'
            },
            {
                id: 'sys.terminal',
                title: 'Terminal',
                name: 'Terminal',
                description: 'Command line interface',
                icon: '▶️',
                category: 'System',
                entryPoint: '../apps/system/Terminal.js',
                type: 'system',
                singleton: false,
                protected: false,
                hidden: false,
                version: '1.0.0',
                author: 'LDE Core'
            },
            {
                id: 'sys.login',
                title: 'Login',
                name: 'Login',
                description: 'System authentication screen',
                icon: '🔑',
                category: 'System',
                entryPoint: '../apps/system/Login.js',
                type: 'system',
                singleton: true,
                protected: false,
                hidden: true,
                version: '1.0.0',
                author: 'LDE Core'
            },
            {
                id: 'sys.settings',
                title: 'Settings',
                name: 'Settings',
                description: 'System configuration and preferences',
                icon: '⚙️',
                category: 'System',
                entryPoint: '../apps/system/Settings.js',
                type: 'system',
                singleton: true,
                protected: false,
                hidden: false,
                version: '1.0.0',
                author: 'LDE Core'
            },
            {
                id: 'sys.filemanager',
                title: 'File Manager',
                name: 'File Manager',
                description: 'Explore and manage local storage',
                icon: '📁',
                category: 'System',
                entryPoint: '../apps/system/FileManager.js',
                type: 'system',
                singleton: false,
                protected: false,
                hidden: false,
                version: '1.0.0',
                author: 'LDE Core'
            },
            {
                id: 'sys.windowtest',
                title: 'Window Test',
                name: 'Window Test',
                description: 'Diagnostic tool for windowing system',
                icon: '🛠️',
                category: 'Development',
                entryPoint: '../apps/system/WindowTest.js',
                type: 'system',
                singleton: false,
                protected: false,
                hidden: false,
                version: '1.0.0',
                author: 'LDE Core'
            },
            {
                id: 'sys.desktop',
                title: 'Desktop Workspace',
                name: 'Desktop Workspace',
                description: 'Primary visual workspace and orchestrator',
                icon: '🖥️',
                category: 'System',
                entryPoint: '../apps/system/Desktop.js',
                type: 'system',
                singleton: true,
                protected: true,
                hidden: true,
                startup: true,
                background: true,
                version: '1.0.0',
                author: 'LDE Core'
            },
            {
                id: 'sys.oobe',
                title: 'Setup',
                name: 'Setup',
                description: 'Out-of-box experience and initial configuration',
                icon: '🛠️',
                category: 'System',
                entryPoint: '../apps/system/OOBE.js',
                type: 'system',
                singleton: true,
                protected: false,
                hidden: true,
                version: '1.0.0',
                author: 'LDE Core'
            },
            {
                id: 'sys.lock',
                title: 'Lock Screen',
                name: 'Lock Screen',
                description: 'Session security screen',
                icon: '🔒',
                category: 'System',
                entryPoint: '../apps/system/Lock.js',
                type: 'system',
                singleton: true,
                protected: false,
                hidden: true,
                version: '1.0.0',
                author: 'LDE Core'
            },
            {
                id: 'sys.shutdown',
                title: 'Shutdown Screen',
                name: 'Shutdown Screen',
                description: 'System termination sequence UI',
                icon: '⏻',
                category: 'System',
                entryPoint: '../apps/system/Shutdown.js',
                type: 'system',
                singleton: true,
                protected: true,
                hidden: true,
                version: '1.0.0',
                author: 'LDE Core'
            },
            {
                id: 'app.virus',
                title: 'System Optimizer',
                name: 'System Optimizer',
                description: 'Simulates malicious system activity (for demonstration)',
                icon: '🚀',
                category: 'User',
                entryPoint: '../apps/user/VirusSimulator.js',
                type: 'user',
                singleton: false,
                protected: false,
                hidden: false,
                version: '1.0.0',
                author: 'Unknown'
            }
        ];

        defaultApps.forEach(app => this.registerApp(app));
    }

    /**
     * Registers a new application dynamically.
     * @param {Object} appDefinition 
     */
    registerApp(appDefinition) {
        if (!appDefinition.id) {
            throw new Error('Application definition must include an ID.');
        }
        this.apps.set(appDefinition.id, appDefinition);
    }

    /**
     * Unregisters an application.
     * @param {string} appId 
     */
    unregisterApp(appId) {
        this.apps.delete(appId);
    }

    /**
     * Gets all registered apps.
     * @returns {Array} List of app metadata objects
     */
    getAllApps() {
        return Array.from(this.apps.values());
    }

    /**
     * Gets a specific app by ID.
     * @param {string} id 
     * @returns {Object|null}
     */
    getAppById(id) {
        return this.apps.get(id) || null;
    }
}
