import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * ExtensionService
 * 
 * Responsibility:
 * Public API for discovering extensions provided by installed applications.
 * Subsystems (like Search, Widgets, Themes) use this service to find their
 * respective extension points.
 * 
 * Emits:
 * - `extensions.changed`: When the available extensions update (e.g. app installed)
 */
export class ExtensionService {
    constructor(extensionRepositoryManager) {
        this.extensionRepo = extensionRepositoryManager;
        
        // When the application database changes, the manager refreshes.
        // We broadcast that the extensions themselves have changed.
        EventBus.on('application.database.changed', () => {
            EventBus.emit('extensions.changed', {
                severity: 'Info',
                source: 'ExtensionService',
                message: 'Available extensions updated.'
            });
        });
    }

    /**
     * Gets all registered extensions.
     */
    getAllExtensions() {
        return this.extensionRepo.getAllExtensions();
    }

    /**
     * Gets extensions by a specific type (e.g., 'widget', 'search-provider').
     * @param {string} type 
     */
    getExtensions(type) {
        return this.extensionRepo.getExtensionsByType(type);
    }

    /**
     * Gets all extensions provided by a specific application.
     * @param {string} appId 
     */
    getExtensionsForApplication(appId) {
        return this.extensionRepo.getExtensionsForApp(appId);
    }
}
