/**
 * BuiltinRepositorySource
 *
 * Responsibility:
 * Reads a built-in repository manifest shipped with the OS.
 */
export class BuiltinRepositorySource {
    constructor(manifestUrl) {
        this.manifestUrl = manifestUrl;
    }

    /**
     * Fetches the repository manifest.
     * @param {NetworkService} networkService
     * @returns {Promise<Object|null>} The repository data
     */
    async fetchMetadata(networkService) {
        if (!networkService) {
            console.error('[BuiltinRepositorySource] Cannot fetch metadata without a NetworkService');
            return null;
        }

        try {
            // Uses the OS NetworkService to load the JSON manifest
            const data = await networkService.fetchJson(this.manifestUrl);
            return data;
        } catch (error) {
            console.error(`[BuiltinRepositorySource] Failed to fetch ${this.manifestUrl}:`, error);
            return null;
        }
    }
}
