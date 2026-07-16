/**
 * RuntimeLoaderService
 *
 * Responsibility:
 * Public API for resolving and loading application execution modules.
 */
export class RuntimeLoaderService {
    constructor(runtimeLoaderManager) {
        this.manager = runtimeLoaderManager;
    }

    /**
     * Loads the module for a given application.
     * @param {Object} appInfo 
     * @returns {Promise<Object>}
     */
    async loadApplication(appInfo) {
        if (!appInfo || !appInfo.id) {
            throw new Error('RuntimeLoaderService: Invalid application manifest provided.');
        }
        return this.manager.load(appInfo);
    }
}
