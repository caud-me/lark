/**
 * Environment
 *
 * Base class defining the common abstraction and lifecycle contract
 * for all environments running on the Lark OS platform.
 */
export class Environment {
    /**
     * @param {string} id - Unique environment instance ID
     * @param {Symbol} type - Environment type Symbol from EnvironmentType
     * @param {ServiceRegistry} registry - Platform service registry
     */
    constructor(id, type, registry) {
        this.id = id;
        this.type = type;
        this.registry = registry;
    }

    /**
     * Attach the environment presentation elements to the DOM.
     * Called once when the environment is instantiated/loaded.
     */
    async mount() {}

    /**
     * Become active and visible.
     */
    async resume() {}

    /**
     * Become inactive and hidden.
     */
    async suspend() {}

    /**
     * Detach presentation elements from the DOM, release event listeners, and clean up.
     */
    async destroy() {}
}
