import { StorageHandle } from '../handles/StorageHandle.js';

/**
 * KernelStorageAPI
 * 
 * Layer: 1-kernel/api
 * Responsibility:
 * Stable public Kernel API for storage volume queries and operations.
 */

export class KernelStorageAPI {
    constructor(driverManager) {
        this.driverManager = driverManager;
    }

    _getHandle() {
        const driver = this.driverManager ? this.driverManager.getDriver('storage') : null;
        return new StorageHandle(driver);
    }

    getCapacity() {
        return this._getHandle().getCapacity();
    }

    getUsage() {
        return this._getHandle().getUsage();
    }

    mountVolume() {
        return this._getHandle().mount();
    }

    unmountVolume() {
        return this._getHandle().unmount();
    }
}
