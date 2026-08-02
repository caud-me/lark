/**
 * NetworkHandle
 * 
 * Layer: 1-kernel/handles
 * Responsibility:
 * Abstract kernel device handle representing a network interface contract.
 */

export class NetworkHandle {
    constructor(driver) {
        this.driver = driver;
        this.handleId = `hnd.network.${Date.now().toString(36)}`;
    }

    isOnline() {
        return this.driver ? this.driver.isOnline() : false;
    }

    async download(url, options = {}) {
        if (!this.driver) throw new Error('[NetworkHandle] No driver bound.');
        return this.driver.download(url, options);
    }
}
