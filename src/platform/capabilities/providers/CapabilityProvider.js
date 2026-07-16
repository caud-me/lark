/**
 * CapabilityProvider
 *
 * Responsibility:
 * Base contract that all Capability Providers must implement.
 */
export class CapabilityProvider {
    /**
     * Returns the name of the provider.
     * @returns {string}
     */
    getName() {
        throw new Error('CapabilityProvider.getName() must be implemented.');
    }
}
