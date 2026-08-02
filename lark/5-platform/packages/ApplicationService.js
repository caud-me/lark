import { Result } from '../common/Result.js';

/**
 * ApplicationService
 *
 * STABLE PUBLIC PLATFORM API (LDE 27.8.3)
 *
 * Responsibility:
 * Exposes a public API for querying application metadata, identity, and launching apps.
 * Serves as the central capability interface for installed applications.
 */
export class ApplicationService {
    constructor(applicationDatabaseService, registry = null) {
        this.appDbService = applicationDatabaseService;
        this.registry = registry;
    }

    /**
     * OS Capability: Launches an application by ID.
     */
    async launch(appId, launchContext = {}) {
        if (!this.registry) {
            return Result.failure('SERVICE_UNAVAILABLE', 'ServiceRegistry unavailable on ApplicationService.');
        }
        const processService = this.registry.get('ProcessService');
        if (!processService) {
            return Result.failure('SERVICE_UNAVAILABLE', 'ProcessService unavailable for application launch.');
        }
        return await processService.launch(appId, launchContext);
    }

    /**
     * Retrieves all available applications.
     * @returns {Array} List of applications
     */
    getInstalledApplications() {
        return this.appDbService.getAllApps().map(app => this._mapToPublicApi(app));
    }

    /**
     * Retrieves application metadata by ID.
     * @param {string} id 
     * @returns {Object|null}
     */
    getApplication(id) {
        return this._mapToPublicApi(this.appDbService.getAppById(id));
    }

    /**
     * Retrieves all applications that declare a startup intent.
     * @returns {Array} List of applications
     */
    getStartupApplications() {
        return this.appDbService.getAllApps()
            .filter(app => {
                if (!app.runtime || !app.runtime.startup) return false;
                if (app.runtime.startup === true) return true; // Legacy backwards compatibility
                return app.runtime.startup.enabled === true || Boolean(app.runtime.startup.intent);
            })
            .map(app => this._mapToPublicApi(app));
    }

    /**
     * Searches installed applications by query against title, description, or keywords.
     * @param {string} query 
     * @returns {Array} List of applications
     */
    searchApplications(query) {
        if (!query) return this.getInstalledApplications();
        const lowerQuery = query.toLowerCase();
        
        return this.appDbService.getAllApps().filter(app => {
            const titleMatch = app.title && app.title.toLowerCase().includes(lowerQuery);
            const descMatch = app.description && app.description.toLowerCase().includes(lowerQuery);
            const keywordMatch = app.runtime && app.runtime.keywords && app.runtime.keywords.some(kw => kw.toLowerCase().includes(lowerQuery));
            return titleMatch || descMatch || keywordMatch;
        }).map(app => this._mapToPublicApi(app));
    }

    /**
     * Retrieves applications grouped by their primary category.
     * @param {string} category 
     * @returns {Array} List of applications in that category
     */
    getApplicationsByCategory(category) {
        if (!category) return [];
        const lowerCat = category.toLowerCase();
        return this.appDbService.getAllApps()
            .filter(app => app.runtime && app.runtime.category && app.runtime.category.toLowerCase() === lowerCat)
            .map(app => this._mapToPublicApi(app));
    }

    /**
     * Maps the strict internal Database manifest (with separate runtime/install sections)
     * to the flat public API object expected by consumers like Desktop.
     * This preserves UI backwards compatibility while improving backend architecture.
     */
    _mapToPublicApi(app) {
        if (!app) return null;
        // Flatten the object for consumers
        return {
            ...app,
            ...(app.runtime || {}),
            ...(app.install || {})
        };
    }
}
