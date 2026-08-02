import { EventBus } from '../../1-kernel/SystemEventBus.js';

/**
 * NetworkService
 *
 * Layer: 5-platform/network
 * Responsibility:
 * The public OS API for external communication. Consumes the Kernel NetworkDriver
 * contract to verify device connectivity and execute network downloads.
 *
 * Does NOT:
 * - Direct browser API querying where a Kernel Driver exists
 */
export class NetworkService {
    constructor(networkManager, serviceRegistry = null) {
        this.manager = networkManager;
        this.registry = serviceRegistry;
    }

    /**
     * Resolves the Kernel NetworkDriver contract via ServiceRegistry / DriverManager.
     * @private
     */
    _getNetworkAPI() {
        if (!this.registry) return null;
        return this.registry.get('KernelNetworkAPI');
    }

    /**
     * Checks whether the network interface is online via KernelNetworkAPI.
     * @returns {boolean}
     */
    isOnline() {
        const api = this._getNetworkAPI();
        if (api && typeof api.isOnline === 'function') {
            return api.isOnline();
        }
        return this.manager ? this.manager.isOnline() : false;
    }

    /**
     * Core wrapper for network requests executing through KernelNetworkAPI.
     * @param {string} url 
     * @param {Object} options 
     */
    async fetch(url, options = {}) {
        if (!this.isOnline()) {
            throw new Error(`[NetworkService] Network interface unavailable or offline for ${url}`);
        }

        if (this.manager) this.manager.incrementActiveRequests();
        EventBus.emit('network.request.started', { severity: 'Info', source: 'NetworkService', message: `Request started: ${url}` });

        try {
            const api = this._getNetworkAPI();
            let response;
            if (api && typeof api.download === 'function') {
                response = await api.download(url, options);
            } else {
                response = await fetch(url, options);
            }

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
            if (this.manager) this.manager.decrementActiveRequests();
        }
    }

    async fetchJson(url, options = {}) {
        const response = await this.fetch(url, options);
        return response.json();
    }

    async fetchText(url, options = {}) {
        const response = await this.fetch(url, options);
        return response.text();
    }

    async fetchBlob(url, options = {}) {
        const response = await this.fetch(url, options);
        return response.blob();
    }
}
