import { LdeDesktopEnvironment } from '../environments/desktop/Desktop.js';
import { MinimalDesktopEnvironment } from '../environments/desktop/MinimalDesktopEnvironment.js';

const desktopConstructors = {
    lde: LdeDesktopEnvironment,
    minimal: MinimalDesktopEnvironment
};

/**
 * DesktopEnvironmentService
 *
 * Responsibility:
 * Provider service for registering and managing session-owned desktop environments.
 */
export class DesktopEnvironmentService {
    constructor(serviceRegistry) {
        this.registry = serviceRegistry;
        this.environments = new Map(); // sessionId -> Environment instance
    }



    /**
     * Creates a desktop environment for a session.
     * @param {string} envId 
     * @param {string} sessionId 
     * @returns {Promise<Environment>}
     */
    async create(envId, sessionId) {
        const Ctor = desktopConstructors[envId];
        if (!Ctor) {
            throw new Error(`[DesktopEnvironmentService] Constructor not found for: ${envId}`);
        }
        await this.destroy(sessionId);
        const env = new Ctor(this.registry, sessionId);
        this.environments.set(sessionId, env);
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
