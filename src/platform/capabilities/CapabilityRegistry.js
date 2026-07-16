/**
 * CapabilityRegistry
 *
 * Responsibility:
 * Maps capability identifiers to their registered providers.
 *
 * Does NOT:
 * - Handle state persistence (unlike Managers)
 * - Execute provider logic (unlike Services)
 */
export class CapabilityRegistry {
    constructor() {
        this.providers = new Map();
    }

    /**
     * Registers a capability provider.
     * @param {string} capabilityId - Identifier (e.g., 'dialogs')
     * @param {CapabilityProvider} provider - Provider instance
     */
    register(capabilityId, provider) {
        if (!provider || typeof provider.getName !== 'function') {
            throw new Error(`[CapabilityRegistry] Invalid provider for '${capabilityId}'. Must implement CapabilityProvider contract.`);
        }
        this.providers.set(capabilityId, provider);
    }

    /**
     * Retrieves a provider by its identifier.
     * @param {string} capabilityId 
     * @returns {CapabilityProvider|null}
     */
    get(capabilityId) {
        return this.providers.get(capabilityId) || null;
    }

    /**
     * Checks if a capability is registered.
     * @param {string} capabilityId 
     * @returns {boolean}
     */
    has(capabilityId) {
        return this.providers.has(capabilityId);
    }
}
