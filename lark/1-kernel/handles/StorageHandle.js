/**
 * StorageHandle
 * 
 * Layer: 1-kernel/handles
 * Responsibility:
 * Abstract kernel device handle representing a storage volume contract.
 */

export class StorageHandle {
    constructor(driver) {
        this.driver = driver;
        this.handleId = `hnd.storage.${Date.now().toString(36)}`;
    }

    getCapacity() {
        return this.driver ? this.driver.getCapacity() : 5242880;
    }

    getUsage() {
        return this.driver ? this.driver.getUsage() : 0;
    }

    mount() {
        return this.driver ? this.driver.mount() : { success: false };
    }

    unmount() {
        return this.driver ? this.driver.unmount() : { success: false };
    }
}
