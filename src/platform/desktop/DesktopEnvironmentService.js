/**
 * DesktopEnvironmentService
 *
 * Responsibility:
 * Provider service for registering and managing session-owned desktop environments.
 */
export class DesktopEnvironmentService {
    constructor(serviceRegistry) {
        this.registry = serviceRegistry;
        this.providers = new Map(); // envId -> provider object
        this.environments = new Map(); // sessionId -> Environment instance
        this.defaultEnvId = 'lde';
    }

    /**
     * Registers a desktop environment provider.
     * @param {Object} provider - Provider object exposing metadata, create(), destroy()
     */
    registerEnvironment(provider) {
        if (!provider || !provider.metadata || !provider.metadata.id) {
            throw new Error('[DesktopEnvironmentService] Invalid provider metadata.');
        }
        this.providers.set(provider.metadata.id, provider);
    }

    /**
     * Sets the default desktop environment.
     * @param {string} envId 
     */
    setDefaultEnvironment(envId) {
        this.defaultEnvId = envId;
    }

    /**
     * Gets the default desktop environment ID.
     * @returns {string}
     */
    getDefaultEnvironment() {
        return this.defaultEnvId;
    }

    /**
     * Creates a desktop environment for a session.
     * @param {string} envId 
     * @param {string} sessionId 
     * @returns {Promise<Environment>}
     */
    async create(envId, sessionId) {
        const provider = this.providers.get(envId);
        if (!provider) {
            throw new Error(`[DesktopEnvironmentService] Provider not found: ${envId}`);
        }
        await this.destroy(sessionId);
        const result = await provider.create(this.registry, sessionId);
        const env = result || this.environments.get(sessionId);
        if (env) {
            this.environments.set(sessionId, env);
        }
        return env;
    }

    /**
     * Destroys a session's desktop environment.
     * @param {string} sessionId 
     */
    async destroy(sessionId) {
        const env = this.environments.get(sessionId);
        if (env) {
            await env.suspend();
            await env.destroy();
            this.environments.delete(sessionId);
        }
    }

    /**
     * Resumes a session's desktop environment (makes it active/visible).
     * @param {string} sessionId 
     */
    async resume(sessionId) {
        const env = this.environments.get(sessionId);
        if (env) {
            await env.resume();
        }
    }

    /**
     * Suspends a session's desktop environment (suspends/hides it).
     * @param {string} sessionId 
     */
    async suspend(sessionId) {
        const env = this.environments.get(sessionId);
        if (env) {
            await env.suspend();
        }
    }

    /**
     * Retrieves the desktop environment instance for a session.
     * @param {string} sessionId 
     * @returns {Environment|null}
     */
    getCurrent(sessionId) {
        return this.environments.get(sessionId) || null;
    }
}
