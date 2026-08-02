import { CapabilityProvider } from './CapabilityProvider.js';

/**
 * NetworkCapabilityProvider
 *
 * Responsibility:
 * Exposes the NetworkService and DownloadService as a capability
 * to applications, masking internal OS implementation details.
 */
export class NetworkCapabilityProvider extends CapabilityProvider {
    constructor(networkService, downloadService) {
        super();
        this.networkService = networkService;
        this.downloadService = downloadService;
    }

    getName() {
        return 'NetworkCapabilityProvider';
    }

    /**
     * Proxies core fetch functionality.
     */
    async fetch(url, options = {}) {
        return this.networkService.fetch(url, options);
    }

    async fetchJson(url, options = {}) {
        return this.networkService.fetchJson(url, options);
    }

    async fetchText(url, options = {}) {
        return this.networkService.fetchText(url, options);
    }

    async fetchBlob(url, options = {}) {
        return this.networkService.fetchBlob(url, options);
    }

    /**
     * Proxies core download functionality.
     */
    async download(url, destination) {
        return this.downloadService.download(url, destination);
    }

    async downloadJson(url) {
        return this.downloadService.downloadJson(url);
    }

    async downloadText(url) {
        return this.downloadService.downloadText(url);
    }

    async downloadBlob(url) {
        return this.downloadService.downloadBlob(url);
    }
}
