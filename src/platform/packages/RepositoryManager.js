/**
 * RepositoryManager
 *
 * Responsibility:
 * Maintains a registry of repository sources, coordinates metadata fetching,
 * and caches available package data.
 */
export class RepositoryManager {
    constructor() {
        this.sources = new Map();
        this.packagesCache = new Map(); // packageId -> package manifest
        this.lastRefresh = null;
    }

    /**
     * Registers a repository source.
     * @param {string} sourceId 
     * @param {Object} sourceInstance 
     */
    registerSource(sourceId, sourceInstance) {
        this.sources.set(sourceId, sourceInstance);
    }

    /**
     * Replaces the packages cache.
     * @param {Array<Object>} packages 
     */
    setPackages(packages) {
        this.packagesCache.clear();
        for (const pkg of packages) {
            this.packagesCache.set(pkg.id, pkg);
        }
        this.lastRefresh = new Date();
    }

    /**
     * Gets all registered sources.
     * @returns {Map<string, Object>}
     */
    getSources() {
        return this.sources;
    }

    /**
     * Returns all cached packages.
     * @returns {Array<Object>}
     */
    getAllPackages() {
        return Array.from(this.packagesCache.values());
    }

    /**
     * Gets a specific package by ID.
     * @param {string} packageId 
     * @returns {Object|null}
     */
    getPackageById(packageId) {
        return this.packagesCache.get(packageId) || null;
    }

    /**
     * Searches the package cache.
     * @param {string} query 
     * @returns {Array<Object>}
     */
    searchPackages(query) {
        if (!query) return this.getAllPackages();
        const lowerQuery = query.toLowerCase();
        
        return this.getAllPackages().filter(pkg => {
            return (
                (pkg.title && pkg.title.toLowerCase().includes(lowerQuery)) ||
                (pkg.description && pkg.description.toLowerCase().includes(lowerQuery)) ||
                (pkg.tags && pkg.tags.some(t => t.toLowerCase().includes(lowerQuery)))
            );
        });
    }
}
