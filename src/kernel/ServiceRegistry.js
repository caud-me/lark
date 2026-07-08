import { EventBus } from './SystemEventBus.js';

/**
 * ServiceRegistry
 *
 * Responsibility:
 * Acts as a centralized dependency injection container for services.
 *
 * Does NOT:
 * - Instantiate services internally
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
        if (this.services.has(name)) {
            EventBus.emit('registry:overwrite', { severity: 'Warning', source: 'ServiceRegistry', message: `Service ${name} is already registered. Overwriting.` });
        }
        this.services.set(name, instance);
        EventBus.emit('registry:register', { severity: 'Info', source: 'ServiceRegistry', message: `Registered service: ${name}` });
    }

    /**
     * Retrieves a service from the registry.
     * @param {string} name - The name of the service
     * @returns {object|null} The service instance or null if not found
     */
    get(name) {
        if (!this.services.has(name)) {
            EventBus.emit('registry:notFound', { severity: 'Error', source: 'ServiceRegistry', message: `Service ${name} not found.` });
            return null;
        }
        return this.services.get(name);
    }
}

// Export as singleton
export const ServiceRegistry = new ServiceRegistryClass();
