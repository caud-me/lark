/**
 * BrowserStorageService
 *
 * Responsibility:
 * Single location for all browser Storage API queries.
 * Provides runtime storage capability information to platform services.
 *
 * Does NOT:
 * - Persist any values
 * - Know about virtual disks, LRFS, or driver implementations
 * - Cache results (callers receive fresh data on every call)
 */
export class BrowserStorageService {
    /**
     * Queries the browser's StorageManager for origin-level quota, usage, and persistence.
     * Returns null fields if the API is unavailable or throws.
     *
     * @returns {Promise<{ quotaBytes: number|null, usageBytes: number|null, persisted: boolean|null, supported: boolean }>}
     */
    static async getStorageCapabilities() {
        const caps = { quotaBytes: null, usageBytes: null, persisted: null, supported: false };

        if (typeof navigator === 'undefined' || !navigator.storage) {
            return caps;
        }

        caps.supported = true;

        try {
            if (typeof navigator.storage.estimate === 'function') {
                const estimate = await navigator.storage.estimate();
                if (estimate) {
                    caps.quotaBytes = typeof estimate.quota === 'number' ? estimate.quota : null;
                    caps.usageBytes = typeof estimate.usage === 'number' ? estimate.usage : null;
                }
            }
        } catch (e) {
            console.warn('[BrowserStorageService] Storage estimate query note:', e.message);
        }

        try {
            if (typeof navigator.storage.persisted === 'function') {
                caps.persisted = await navigator.storage.persisted();
            }
        } catch (e) {
            console.warn('[BrowserStorageService] Storage persisted query note:', e.message);
        }

        return caps;
    }
}
