import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * ExtensionRepositoryManager
 * 
 * Responsibility:
 * Discovers and caches all extensions contributed by installed applications.
 * Subscribes to the application database to keep the extension list up-to-date.
 * 
 * Does NOT:
 * - Instantiate extensions or execute them.
 */
export class ExtensionRepositoryManager {
    constructor(applicationDatabaseManager) {
        this.appDbManager = applicationDatabaseManager;
        this.extensions = new Map();
        
        EventBus.on('application.database.changed', () => {
            this.refresh();
        });
    }

    refresh() {
        this.extensions.clear();
        const apps = this.appDbManager.getAllApps();
        
        for (const app of apps) {
            const exts = app.runtime?.extensions || [];
            for (const ext of exts) {
                if (!ext.type || !ext.id) continue;
                
                const uniqueId = `${app.id}.${ext.id}`;
                this.extensions.set(uniqueId, {
                    ...ext,
                    id: uniqueId,
                    appId: app.id
                });
            }
        }
    }

    getAllExtensions() {
        return Array.from(this.extensions.values());
    }

    getExtensionsByType(type) {
        return this.getAllExtensions().filter(ext => ext.type === type);
    }

    getExtensionsForApp(appId) {
        return this.getAllExtensions().filter(ext => ext.appId === appId);
    }
}
