/**
 * TrustManager
 *
 * Responsibility:
 * Owns the state of package trust, publisher identity, and installation origins.
 */
export class TrustManager {
    constructor() {
        this.states = {
            BUILT_IN: 'BUILT_IN',
            TRUSTED: 'TRUSTED',
            UNKNOWN: 'UNKNOWN',
            UNTRUSTED: 'UNTRUSTED'
        };
    }

    /**
     * Computes the initial trust metadata for a package manifest during installation.
     * @param {Object} manifest 
     * @returns {Object} Trust Metadata
     */
    computeTrustMetadata(manifest) {
        // Phase 4: Built-in loaders are explicitly trusted.
        // Otherwise, the package is UNKNOWN.
        const isBuiltIn = manifest.runtime && manifest.runtime.loader === 'builtin';

        return {
            state: isBuiltIn ? this.states.BUILT_IN : this.states.UNKNOWN,
            publisher: manifest.install ? manifest.install.author : 'Unknown Publisher',
            origin: isBuiltIn ? 'system' : 'local',
            signature: null // Deferred to future phase
        };
    }
}
