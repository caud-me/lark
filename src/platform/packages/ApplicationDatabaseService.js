import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * ApplicationDatabaseService
 *
 * Responsibility:
 * Exposes a public API for querying the installed application database.
 * Handles persistence of the database via FileService.
 * 
 * Does NOT:
 * - Perform execution (ProcessService)
 * - Assign file associations (AssociationService)
 */
export class ApplicationDatabaseService {
    constructor(applicationDatabaseManager, serviceRegistry) {
        this.appDbManager = applicationDatabaseManager;
        this.serviceRegistry = serviceRegistry;
        this.dbPath = '/system/apps.json';
    }

    /**
     * Initializes the service, loading the database from storage.
     */
    async initialize() {
        const fileService = this.serviceRegistry.get('FileService');
        const securityService = this.serviceRegistry.get('SecurityService');
        if (!fileService || !securityService) return;

        const systemContext = securityService.getSystemContext();
        try {
            if (await fileService.exists(this.dbPath, { context: systemContext })) {
                const data = await fileService.readFile(this.dbPath, { context: systemContext });
                this.appDbManager.setDatabase(JSON.parse(data));
            } else {
                this.appDbManager.setInitialized(true);
            }
        } catch (error) {
            console.error('[ApplicationDatabaseService] Failed to load apps.json:', error);
            this.appDbManager.setInitialized(true);
        }
    }

    /**
     * Seeds or synchronizes the database with default applications.
     */
    async syncBuiltins(defaultApps) {
        if (!this.appDbManager.isInitialized()) {
            throw new Error('ApplicationDatabaseService must be initialized before syncing.');
        }

        let changed = false;

        if (this.appDbManager.getAllApps().length === 0) {
            for (const app of defaultApps) {
                const manifest = this._normalizeManifest(app);
                this.appDbManager.registerApp(manifest);
            }
            changed = true;
        } else {
            // 1. Add missing defaults and update existing built-ins
            for (const def of defaultApps) {
                const existing = this.appDbManager.getAppById(def.id);
                if (!existing || (existing.runtime && existing.runtime.loader === 'builtin')) {
                    this.appDbManager.registerApp(this._normalizeManifest(def));
                    changed = true;
                }
            }
            
            // 2. Remove obsolete built-in apps
            const defaultIds = new Set(defaultApps.map(d => d.id));
            for (const app of this.appDbManager.getAllApps()) {
                if (app.runtime && app.runtime.loader === 'builtin' && !defaultIds.has(app.id)) {
                    this.appDbManager.unregisterApp(app.id);
                    changed = true;
                }
            }
        }

        if (changed) {
            await this.save();
        }
    }

    async save() {
        const fileService = this.serviceRegistry.get('FileService');
        const securityService = this.serviceRegistry.get('SecurityService');
        if (!fileService || !securityService) return;

        const systemContext = securityService.getSystemContext();
        const payload = this.appDbManager.getDatabaseState();
        const data = JSON.stringify(payload, null, 4);

        try {
            if (!await fileService.exists('/system', { context: systemContext })) {
                await fileService.createDirectory('/system', { context: systemContext });
            }
            await fileService.writeFile(this.dbPath, data, { context: systemContext });
            
            EventBus.emit('application.database.changed', {
                severity: 'Info',
                source: 'ApplicationDatabaseService',
                message: 'Application database was saved.'
            });
        } catch (e) {
            console.error('[ApplicationDatabaseService] Failed to save database:', e);
        }
    }

    async registerApp(manifest) {
        this.appDbManager.registerApp(manifest);
        await this.save();
    }

    async unregisterApp(appId) {
        this.appDbManager.unregisterApp(appId);
        await this.save();
    }

    /**
     * Retrieves all installed applications.
     * @returns {Array} List of applications
     */
    getAllApps() {
        return this.appDbManager.getAllApps();
    }

    /**
     * Retrieves application metadata by ID.
     * @param {string} id 
     * @returns {Object|null}
     */
    getAppById(id) {
        return this.appDbManager.getAppById(id);
    }

    _normalizeManifest(app) {
        return {
            id: app.id,
            title: app.title || app.name,
            name: app.name || app.title,
            description: app.description || '',
            icon: app.icon || '📦',
            type: app.type || 'user',
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
                extensions: app.extensions || (app.runtime && app.runtime.extensions) || [],
                searchableIntents: app.searchableIntents || (app.runtime && app.runtime.searchableIntents) || []
            },
            install: {
                version: app.version || '1.0.0',
                minimumVersion: app.minimumVersion || '1.0.0',
                packageId: app.packageId || app.id,
                installDate: app.installDate || new Date().toISOString(),
                author: app.author || 'Unknown',
                enabled: true,
                trust: app.install && app.install.trust ? app.install.trust : {
                    state: 'BUILT_IN',
                    publisher: app.author || 'LDE Core',
                    origin: 'system',
                    signature: null
                }
            }
        };
    }
}
