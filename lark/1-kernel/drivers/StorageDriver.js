import { BaseDriver } from './BaseDriver.js';

/**
 * StorageDriver
 * 
 * Layer: 1-kernel/drivers
 * Responsibility:
 * Kernel driver for primary storage controller (dev.storage.primary).
 * Critical required driver: Failure to initialize triggers Kernel Panic.
 */

export class StorageDriver extends BaseDriver {
    constructor() {
        super('Lark Virtual NVMe Storage Driver', 'storage', 'dev.storage.primary', true);
        this.mounted = false;
    }

    async initialize(deviceMetadata) {
        if (!deviceMetadata || (!deviceMetadata.localStorageAvailable && !deviceMetadata.indexedDBAvailable)) {
            this.status = 'FAILED';
            this.error = 'Storage hardware check failed: Storage I/O bus unavailable.';
            return false;
        }

        this.device = deviceMetadata;
        this.status = 'LOADED';
        this.mounted = true;
        this.error = null;
        console.log(`[Kernel:Driver] ${this.name} successfully bound to ${deviceMetadata.name}`);
        return true;
    }

    mount() {
        if (!this.isLoaded()) {
            throw new Error(`[StorageDriver] Cannot mount volume: Driver not loaded.`);
        }
        this.mounted = true;
        return { success: true, status: 'MOUNTED' };
    }

    unmount() {
        this.mounted = false;
        return { success: true, status: 'UNMOUNTED' };
    }

    getCapacity() {
        return (this.device && typeof this.device.capacityBytes === 'number') ? this.device.capacityBytes : null;
    }

    getUsage() {
        let bytes = 0;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                bytes += (k ? k.length : 0) + (localStorage.getItem(k) || '').length;
            }
        } catch (e) {
            bytes = 0;
        }
        return bytes;
    }
}
