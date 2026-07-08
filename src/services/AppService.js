/**
 * AppService
 *
 * Responsibility:
 * Exposes a public API for querying installed applications.
 *
 * Does NOT:
 * - Execute applications
 */
export class AppService {
    constructor(appRegistry) {
        this.appRegistry = appRegistry;
    }

    /**
     * Retrieves all available applications.
     * @returns {Array} List of applications
     */
    getApps() {
        return this.appRegistry.getAllApps();
    }

    /**
     * Retrieves application metadata by ID.
     * @param {string} id 
     * @returns {Object|null}
     */
    getAppById(id) {
        return this.appRegistry.getAppById(id);
    }

    /**
     * Retrieves all applications flagged for startup on login.
     * @returns {Array} List of applications
     */
    getStartupApps() {
        return this.appRegistry.getAllApps().filter(app => app.startup === true);
    }
}
