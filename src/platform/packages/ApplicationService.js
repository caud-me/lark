/**
 * ApplicationService
 *
 * Responsibility:
 * Exposes a public API for querying application metadata and identity.
 * Serves as the central repository of knowledge about what is installed.
 *
 * Does NOT:
 * - Execute applications (that is ProcessService)
 * - Assign file associations (that is AssociationService)
 * - Manage database state (that is ApplicationDatabaseService)
 */
export class ApplicationService {
    constructor(applicationDatabaseService) {
        this.appDbService = applicationDatabaseService;
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
     * Retrieves all applications flagged for startup on login.
     * @returns {Array} List of applications
     */
    getStartupApplications() {
        return this.appDbService.getAllApps()
            .filter(app => app.runtime && app.runtime.startup === true)
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
