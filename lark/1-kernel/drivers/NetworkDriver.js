import { BaseDriver } from './BaseDriver.js';

/**
 * NetworkDriver
 * 
 * Layer: 1-kernel/drivers
 * Responsibility:
 * Kernel driver for virtual ethernet network interface (dev.network.veth0).
 * Optional driver: Failure to initialize degrades network services gracefully.
 */

export class NetworkDriver extends BaseDriver {
    constructor() {
        super('Lark Virtual Gigabit Network Driver', 'network', 'dev.network.veth0', false);
    }

    async initialize(deviceMetadata) {
        if (!deviceMetadata) {
            this.status = 'DISABLED';
            this.error = 'Network adapter not detected.';
            return false;
        }

        this.device = deviceMetadata;
        this.status = deviceMetadata.online ? 'LOADED' : 'DEGRADED';
        this.error = deviceMetadata.online ? null : 'Network cable disconnected.';
        console.log(`[Kernel:Driver] ${this.name} successfully bound to ${deviceMetadata.name}`);
        return true;
    }

    isOnline() {
        return this.isLoaded() && (this.device ? this.device.online : false);
    }

    async download(url) {
        if (!this.isOnline()) {
            throw new Error(`[NetworkDriver] Download failed: Network interface offline.`);
        }
        const res = await fetch(url);
        return res;
    }
}
