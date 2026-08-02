import { DisplayHandle } from '../handles/DisplayHandle.js';

/**
 * KernelDisplayAPI
 * 
 * Layer: 1-kernel/api
 * Responsibility:
 * Stable public Kernel API for display operations. Platform services interact strictly
 * with this API rather than reaching into DriverManager or raw driver instances.
 */

export class KernelDisplayAPI {
    constructor(driverManager) {
        this.driverManager = driverManager;
    }

    _getHandle() {
        const driver = this.driverManager ? this.driverManager.getDriver('display') : null;
        return new DisplayHandle(driver);
    }

    getDisplayInformation() {
        return this._getHandle().getInformation();
    }

    supportsTransparency() {
        return this._getHandle().supportsTransparency();
    }

    supportsAnimations() {
        return this._getHandle().supportsAnimations();
    }

    createSurface(id, width, height) {
        return this._getHandle().createSurface(id, width, height);
    }

    getGraphicsCapabilities() {
        const graphicsDriver = this.driverManager ? this.driverManager.getDriver('display_graphics') : null;
        if (graphicsDriver && typeof graphicsDriver.getGraphicsCapabilities === 'function') {
            return graphicsDriver.getGraphicsCapabilities();
        }
        return {
            supportsBackdropFilter: false,
            supportsCssAnimations: true,
            supportsWebGL: false,
            supportsHardwareAcceleration: false,
            prefersReducedMotion: false
        };
    }
}
