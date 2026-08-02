import { ServiceRegistry } from './ServiceRegistry.js';
import { EventBus } from './SystemEventBus.js';

/**
 * KernelBootstrapContext
 * 
 * Layer: 1-kernel
 * Responsibility:
 * Lightweight shared state container passed between kernel boot stages.
 * Holds references to active infrastructure components during bootstrap sequence.
 * 
 * Does NOT:
 * - Contain business logic or helper methods
 */
export class KernelBootstrapContext {
    constructor(kernel) {
        this.kernel = kernel;
        this.serviceRegistry = ServiceRegistry;
        this.eventBus = EventBus;
        this.driverManager = null;
        this.resourceManager = null;
        this.lrfs = null;
        this.managers = new Map();
        this.appDbManager = null;
        this.appRegistry = null;
        this.extensionRepositoryManager = null;
        this.repositoryManager = null;
        this.runtimeLoaderManager = null;
        this.permissionManager = null;
        this.userManager = null;
        this.userProfileManager = null;
        this.userSettingsManager = null;
        this.securityManager = null;
        this.trustManager = null;
        this.recoveryManager = null;
        this.restoreManager = null;
    }
}
