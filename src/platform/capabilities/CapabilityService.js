import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * CapabilityService
 *
 * Responsibility:
 * The public OS API for applications to interact with capabilities.
 * Resolves capability requests against the registry and serves as the 
 * future boundary for Permission integration.
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
