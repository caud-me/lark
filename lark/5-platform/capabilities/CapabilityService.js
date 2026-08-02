import { EventBus } from '../../1-kernel/SystemEventBus.js';

/**
 * CapabilityService
 *
 * STABLE PUBLIC PLATFORM API (LDE 27.7.9)
 *
 * Responsibility:
 * The public OS API for applications to request capability tokens (clipboard, dialogs, processes, network).
 * Resolves capability requests against CapabilityRegistry and enforces security policy checks.
 *
 * Does NOT:
 * - Implement individual capability mechanics directly (delegated to CapabilityProviders)
 */
export class CapabilityService {
    constructor(registry) {
        this.registry = registry;
    }

    /**
     * Resolves a capability provider by identifier.
     * @param {string} capabilityId 
     * @param {number|null} pid
     * @returns {CapabilityProvider}
     */
    get(capabilityId, pid = null) {
        const provider = this.registry.get(capabilityId);
        
        if (!provider) {
            throw new Error(`[CapabilityService] Capability '${capabilityId}' is not registered or unavailable.`);
        }

        const securityService = this.registry.get('SecurityService');
        const securityPolicy = this.registry.get('SecurityPolicy');

        if (securityService && securityPolicy) {
            const context = pid ? securityService.getContext(pid) : securityService.getSessionContext();
            const result = securityPolicy.canAccessCapability(context, capabilityId);
            if (result !== 'ALLOW') {
                throw new Error(`[CapabilityService] Access to capability '${capabilityId}' denied by security policy.`);
            }
        }

        EventBus.emit('capability.requested', { severity: 'Info', source: 'CapabilityService', message: `Capability '${capabilityId}' was requested.` });

        if (typeof provider.forProcess === 'function') {
            return provider.forProcess(pid);
        }

        return provider;
    }

    /**
     * Checks if a capability exists.
     * @param {string} capabilityId 
     * @returns {boolean}
     */
    has(capabilityId) {
        return this.registry.has(capabilityId);
    }
}
