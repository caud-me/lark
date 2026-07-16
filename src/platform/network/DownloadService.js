import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * DownloadService
 *
 * Responsibility:
 * Pipeline abstraction for fetching and processing network assets.
 * Emits semantic download events for UI components (like Software Center) to observe.
 */
export class DownloadService {
    constructor(networkService) {
        this.networkService = networkService;
    }

    /**
     * Downloads an asset to a specific destination (Stub for future filesystem integration).
     * @param {string} url 
     * @param {string} destination 
     */
    async download(url, destination) {
        EventBus.emit('download.started', { severity: 'Info', source: 'DownloadService', message: `Downloading ${url} to ${destination}` });
        try {
            // Future: Implement streaming to LRFS
            const blob = await this.networkService.fetchBlob(url);
            EventBus.emit('download.completed', { severity: 'Info', source: 'DownloadService', message: `Downloaded ${url}` });
            return blob;
        } catch (error) {
            EventBus.emit('download.failed', { severity: 'Error', source: 'DownloadService', message: `Download failed: ${url}` });
            throw error;
        }
    }

    /**
     * Downloads an asset and parses it as JSON.
     * @param {string} url 
     */
    async downloadJson(url) {
        EventBus.emit('download.started', { severity: 'Info', source: 'DownloadService', message: `Downloading JSON from ${url}` });
        try {
            const json = await this.networkService.fetchJson(url);
            EventBus.emit('download.completed', { severity: 'Info', source: 'DownloadService', message: `Downloaded JSON from ${url}` });
            return json;
        } catch (error) {
            EventBus.emit('download.failed', { severity: 'Error', source: 'DownloadService', message: `Download failed: ${url}` });
            throw error;
        }
    }

    /**
     * Downloads an asset and parses it as Text.
     * @param {string} url 
     */
    async downloadText(url) {
        EventBus.emit('download.started', { severity: 'Info', source: 'DownloadService', message: `Downloading text from ${url}` });
        try {
            const text = await this.networkService.fetchText(url);
            EventBus.emit('download.completed', { severity: 'Info', source: 'DownloadService', message: `Downloaded text from ${url}` });
            return text;
        } catch (error) {
            EventBus.emit('download.failed', { severity: 'Error', source: 'DownloadService', message: `Download failed: ${url}` });
            throw error;
        }
    }

    /**
     * Downloads an asset and returns it as a Blob.
     * @param {string} url 
     */
    async downloadBlob(url) {
        EventBus.emit('download.started', { severity: 'Info', source: 'DownloadService', message: `Downloading blob from ${url}` });
        try {
            const blob = await this.networkService.fetchBlob(url);
            EventBus.emit('download.completed', { severity: 'Info', source: 'DownloadService', message: `Downloaded blob from ${url}` });
            return blob;
        } catch (error) {
            EventBus.emit('download.failed', { severity: 'Error', source: 'DownloadService', message: `Download failed: ${url}` });
            throw error;
        }
    }
}
