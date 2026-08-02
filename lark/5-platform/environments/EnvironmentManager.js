/**
 * EnvironmentManager
 *
 * Responsibility:
 * Pure state holder representing the currently active Environment.
 * Does NOT orchestrate environment transitions (that is done by Services).
 */
export class EnvironmentManager {
    constructor() {
        this.activeEnvironment = null;
    }

    /**
     * Set the active environment.
     * @param {Environment|null} env
     */
    setActiveEnvironment(env) {
        this.activeEnvironment = env;
    }

    /**
     * Retrieve the active environment.
     * @returns {Environment|null}
     */
    getActiveEnvironment() {
        return this.activeEnvironment;
    }

    /**
     * Clear the active environment.
     */
    clear() {
        this.activeEnvironment = null;
    }
}
