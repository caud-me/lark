import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * AssociationService
 *
 * Responsibility:
 * Resolves file paths or mime types to application IDs based on AppRegistry capabilities.
 * 
 * Does NOT:
 * - Launch applications (that is ProcessService)
 * - Access the filesystem (File paths are evaluated logically by extension)
 */
export class AssociationService {
    constructor(applicationService) {
        this.applicationService = applicationService;
    }

    /**
     * Resolves the default application for a given file path based on its extension.
     * @param {string} path 
     * @returns {string|null} appId
     */
    resolveApplication(path) {
        const extMatch = path.match(/\.[^/.]+$/);
        if (!extMatch) return null;
        
        const ext = extMatch[0].toLowerCase();
        
        const apps = this.applicationService.getInstalledApplications();
        
        // Find the first app that lists this extension in its capabilities.fileTypes
        for (const app of apps) {
            if (app.capabilities && app.capabilities.fileTypes) {
                if (app.capabilities.fileTypes.includes(ext)) {
                    EventBus.emit('association.resolved', {
                        severity: 'Info',
                        source: 'AssociationService',
                        message: `Resolved ${ext} to ${app.id}`,
                        data: { path, ext, appId: app.id }
                    });
                    return app.id;
                }
            }
        }
        
        return null;
    }

    /**
     * Retrieves all applications compatible with the given file path.
     * @param {string} path 
     * @returns {Array} List of applications
     */
    getCompatibleApplications(path) {
        const extMatch = path.match(/\.[^/.]+$/);
        if (!extMatch) return [];
        
        const ext = extMatch[0].toLowerCase();
        const apps = this.applicationService.getInstalledApplications();
        
        return apps.filter(app => app.capabilities && app.capabilities.fileTypes && app.capabilities.fileTypes.includes(ext));
    }
}
