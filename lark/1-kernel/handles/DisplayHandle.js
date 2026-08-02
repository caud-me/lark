/**
 * DisplayHandle
 * 
 * Layer: 1-kernel/handles
 * Responsibility:
 * Abstract kernel device handle representing a display surface contract.
 * Prevents platform subsystems from accessing raw driver or host DOM objects directly.
 */

export class DisplayHandle {
    constructor(driver) {
        this.driver = driver;
        this.handleId = `hnd.display.${Date.now().toString(36)}`;
    }

    getInformation() {
        return this.driver ? this.driver.getDisplayInformation() : null;
    }

    supportsTransparency() {
        return this.driver ? this.driver.supportsTransparency() : true;
    }

    supportsAnimations() {
        return this.driver ? this.driver.supportsAnimations() : true;
    }

    createSurface(id, width, height) {
        return this.driver ? this.driver.createSurface(id, width, height) : { id, width, height, status: 'MOCK' };
    }
}
