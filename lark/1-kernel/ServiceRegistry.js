import { EventBus } from './SystemEventBus.js';
import { ServiceRegistrationError } from '../3-system/errors/LarkErrors.js';

/**
 * ServiceRegistry
 *
 * Responsibility:
 * Centralized dependency injection container for platform services.
 * Enforces deterministic contract lookups (throws ServiceRegistrationError if unregistered).
 */
class ServiceRegistryClass {
    constructor() {
        this.services = new Map();
    }

    /**
     * Registers a service with the registry.
     * @param {string} name - The name of the service (e.g., 'FileService')
     * @param {object} instance - The service instance
     */
    register(name, instance) {
        if (!name || !instance) {
            throw new Error(`[ServiceRegistry] Cannot register invalid service '${name}'.`);
        }
        if (this.services.has(name)) {
            EventBus.emit('registry:overwrite', { severity: 'Warning', source: 'ServiceRegistry', message: `Service ${name} is already registered. Overwriting.` });
        }
        this.services.set(name, instance);
        EventBus.emit('registry:register', { severity: 'Info', source: 'ServiceRegistry', message: `Registered service: ${name}` });
    }

    /**
     * Checks if a service is registered.
     * @param {string} name 
     * @returns {boolean}
     */
    has(name) {
        return this.services.has(name);
    }

    /**
     * Retrieves a service from the registry.
     * Throws ServiceRegistrationError if the requested service is not registered.
     * @param {string} name - The name of the service
     * @returns {object} The service instance
     */
    get(name) {
        if (!this.services.has(name)) {
            EventBus.emit('registry:notFound', { severity: 'Error', source: 'ServiceRegistry', message: `Service '${name}' not found.` });
            throw new ServiceRegistrationError(name);
        }
        return this.services.get(name);
    }

    /**
     * Retrieves all registered services.
     * @returns {Map<string, object>}
     */
    getAll() {
        return this.services;
    }
}

// Export as singleton
export const ServiceRegistry = new ServiceRegistryClass();
