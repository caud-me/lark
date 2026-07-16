import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * ApplicationDatabaseManager
 *
 * Responsibility:
 * Manages the persistence and in-memory cache of the installed applications database.
 * Serves as the single source of truth for installed software.
 * 
 * Does NOT:
 * - Know where default applications come from (Kernel/AppRegistry provides them to `seed()`)
 * - Handle execution logic
 */
export class ApplicationDatabaseManager {
    constructor() {
        this.databaseVersion = 1;
        this.apps = new Map();
        this.initialized = false;
    }

    /**
     * Sets the parsed database into memory.
     * @param {Object} json
     */
    setDatabase(json) {
        this.apps.clear();
        if (Array.isArray(json)) {
            // Backwards compatibility for early unversioned format
            json.forEach(app => this.apps.set(app.id, app));
        } else if (typeof json === 'object' && json !== null) {
            if (json.databaseVersion > this.databaseVersion) {
                throw new Error(`Unsupported database version: ${json.databaseVersion}`);
            }
            if (Array.isArray(json.applications)) {
                json.applications.forEach(app => this.apps.set(app.id, app));
            }
        }
        this.initialized = true;
    }

    /**
     * Returns the serialized state of the database.
     * @returns {Object}
     */
    getDatabaseState() {
        return {
            databaseVersion: this.databaseVersion,
            applications: Array.from(this.apps.values())
        };
    }

    setInitialized(state) {
        this.initialized = state;
    }

    isInitialized() {
        return this.initialized;
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

    /**
     * Registers a new application manifest in memory.
     * @param {Object} manifest 
     */
    registerApp(manifest) {
        this.apps.set(manifest.id, manifest);
    }

    /**
     * Unregisters an application by ID from memory.
     * @param {string} appId 
     */
    unregisterApp(appId) {
        if (this.apps.has(appId)) {
            this.apps.delete(appId);
        }
    }

    /**
     * Normalizes an old-style or incoming manifest into the separated runtime/install schema.
     * @param {Object} app 
     * @returns {Object}
     */
    _normalizeManifest(app) {
        return {
            id: app.id,
            title: app.title || app.name,
            name: app.name || app.title,
            description: app.description || '',
            icon: app.icon || '📦',
            type: app.type || 'user',
            
            // Runtime Metadata
            runtime: {
                loader: app.loader || (app.runtime && app.runtime.loader) || 'builtin',
                entryPoint: app.entryPoint || (app.runtime && app.runtime.entryPoint),
                singleton: app.singleton !== undefined ? app.singleton : false,
                background: app.background !== undefined ? app.background : false,
                startup: app.startup !== undefined ? app.startup : false,
                category: app.category || 'Uncategorized',
                permissions: app.permissions || [],
                dependencies: app.dependencies || [],
                capabilities: app.capabilities || { fileTypes: [], mimeTypes: [] },
                defaultAction: app.defaultAction || 'open',
                keywords: app.keywords || [],
                protected: app.protected !== undefined ? app.protected : false,
                hidden: app.hidden !== undefined ? app.hidden : false,
                supportedProtocols: app.supportedProtocols || [],
                recommendedFiles: app.recommendedFiles || [],
                extensions: app.extensions || (app.runtime && app.runtime.extensions) || []
            },
            
            // Installation Metadata
            install: {
                version: app.version || '1.0.0',
                minimumVersion: app.minimumVersion || '1.0.0',
                packageId: app.packageId || app.id,
                installDate: app.installDate || new Date().toISOString(),
                author: app.author || 'Unknown',
                enabled: true
            }
        };
    }
}
