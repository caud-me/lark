/**
 * RuntimeLoaderManager
 *
 * Responsibility:
 * Maintains a registry of available loader strategies.
 * Dispatches load requests to the appropriate loader based on manifest declarations.
 */
export class RuntimeLoaderManager {
    constructor() {
        this.loaders = new Map();
    }

    /**
     * Registers a new runtime loader strategy.
     * @param {string} strategyName 
     * @param {Object} loaderInstance 
     */
    registerLoader(strategyName, loaderInstance) {
        this.loaders.set(strategyName, loaderInstance);
    }

    /**
     * Resolves the runtime module for a given application manifest.
     * @param {Object} appInfo 
     * @returns {Promise<Object>}
     */
    async load(appInfo) {
        const strategy = (appInfo.runtime && appInfo.runtime.loader) || 'builtin';
        const loader = this.loaders.get(strategy);
        
        if (!loader) {
            throw new Error(`RuntimeLoaderManager: No loader registered for strategy '${strategy}'. Cannot load application ${appInfo.id}.`);
        }

        return loader.load(appInfo);
    }
}
