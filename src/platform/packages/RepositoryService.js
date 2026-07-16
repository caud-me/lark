import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * RepositoryService
 *
 * Responsibility:
 * Public API for applications (like Software Center and Search) to query available packages.
 */
export class RepositoryService {
    constructor(repositoryManager, networkService) {
        this.manager = repositoryManager;
        this.networkService = networkService;
    }

    /**
     * Refreshes metadata from all configured repositories.
     */
    async refresh() {
        EventBus.emit('repository.refresh.started', { 
            severity: 'Info', 
            source: 'RepositoryService', 
            message: 'Starting repository metadata refresh' 
        });

        try {
            const packages = [];
            const sources = this.manager.getSources();
            for (const [sourceId, source] of sources.entries()) {
                const data = await source.fetchMetadata(this.networkService);
                if (data && Array.isArray(data.packages)) {
                    for (const pkg of data.packages) {
                        pkg.repositoryId = sourceId;
                        packages.push(pkg);
                    }
                }
            }
            this.manager.setPackages(packages);
            EventBus.emit('repository.refresh.completed', { 
                severity: 'Info', 
                source: 'RepositoryService', 
                message: 'Successfully refreshed repository metadata' 
            });
        } catch (error) {
            EventBus.emit('repository.refresh.failed', { 
                severity: 'Error', 
                source: 'RepositoryService', 
                message: `Repository refresh failed: ${error.message}` 
            });
            throw error;
        }
    }

    /**
     * Retrieves all available packages.
     * @returns {Array<Object>}
     */
    getPackages() {
        return this.manager.getAllPackages();
    }

    /**
     * Searches available packages.
     * @param {string} query 
     * @returns {Array<Object>}
     */
    searchPackages(query) {
        return this.manager.searchPackages(query);
    }
}
