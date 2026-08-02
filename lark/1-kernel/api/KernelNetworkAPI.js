import { NetworkHandle } from '../handles/NetworkHandle.js';

/**
 * KernelNetworkAPI
 * 
 * Layer: 1-kernel/api
 * Responsibility:
 * Stable public Kernel API for network communication and connectivity queries.
 */

export class KernelNetworkAPI {
    constructor(driverManager) {
        this.driverManager = driverManager;
    }

    _getHandle() {
        const driver = this.driverManager ? this.driverManager.getDriver('network') : null;
        return new NetworkHandle(driver);
    }

    isOnline() {
        return this._getHandle().isOnline();
    }

    async download(url, options = {}) {
        return this._getHandle().download(url, options);
    }
}
