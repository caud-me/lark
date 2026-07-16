import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * NetworkService
 *
 * Responsibility:
 * The public OS API for external communication. Wraps native fetch,
 * updates network state via NetworkManager, and emits semantic events.
 */
export class NetworkService {
    constructor(networkManager) {
        this.manager = networkManager;

        // Listen for standard browser connectivity events
        window.addEventListener('online', () => {
            this.manager.setOnlineStatus(true);
            EventBus.emit('network.online', { severity: 'Info', source: 'NetworkService', message: 'System is online.' });
        });

        window.addEventListener('offline', () => {
            this.manager.setOnlineStatus(false);
            EventBus.emit('network.offline', { severity: 'Warning', source: 'NetworkService', message: 'System is offline.' });
        });
    }

    /**
     * Core wrapper around native fetch().
     * @param {string} url 
     * @param {Object} options 
     */
    async fetch(url, options = {}) {
        if (!this.manager.isOnline()) {
            throw new Error(`[NetworkService] Cannot fetch ${url}: System is offline.`);
        }

        this.manager.incrementActiveRequests();
        EventBus.emit('network.request.started', { severity: 'Info', source: 'NetworkService', message: `Request started: ${url}` });

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                EventBus.emit('network.request.failed', { severity: 'Error', source: 'NetworkService', message: `Request failed (${response.status}): ${url}` });
                throw new Error(`HTTP Error: ${response.status} on ${url}`);
            }
            EventBus.emit('network.request.completed', { severity: 'Info', source: 'NetworkService', message: `Request completed: ${url}` });
            return response;
        } catch (error) {
            EventBus.emit('network.request.failed', { severity: 'Error', source: 'NetworkService', message: `Request failed: ${url} - ${error.message}` });
            throw error;
        } finally {
            this.manager.decrementActiveRequests();
        }
    }

    /**
     * Fetches and parses a JSON response.
     * @param {string} url 
     * @param {Object} options 
     */
    async fetchJson(url, options = {}) {
        const response = await this.fetch(url, options);
        return response.json();
    }

    /**
     * Fetches and parses a Text response.
     * @param {string} url 
     * @param {Object} options 
     */
    async fetchText(url, options = {}) {
        const response = await this.fetch(url, options);
        return response.text();
    }

    /**
     * Fetches and parses a Blob response.
     * @param {string} url 
     * @param {Object} options 
     */
    async fetchBlob(url, options = {}) {
        const response = await this.fetch(url, options);
        return response.blob();
    }
}
