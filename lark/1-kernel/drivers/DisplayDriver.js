import { BaseDriver } from './BaseDriver.js';

/**
 * DisplayDriver
 * 
 * Layer: 1-kernel/drivers
 * Responsibility:
 * Kernel driver for primary virtual display controller (dev.display.primary).
 * Critical required driver: Failure to initialize triggers Kernel Panic.
 */

export class DisplayDriver extends BaseDriver {
    constructor() {
        super('Lark Virtual Display Driver', 'display', 'dev.display.primary', true);
        this.capabilities = {
            transparency: true,
            animations: true,
            maxResolution: '3840x2160'
        };
    }

    async initialize(deviceMetadata) {
        if (!deviceMetadata || !deviceMetadata.canvasSupported) {
            this.status = 'FAILED';
            this.error = 'Graphics environment check failed: Canvas 2D/WebGL context unavailable.';
            return false;
        }

        this.device = deviceMetadata;
        this.status = 'LOADED';
        this.error = null;
        console.log(`[Kernel:Driver] ${this.name} successfully bound to ${deviceMetadata.name}`);
        return true;
    }

    getDisplayInformation() {
        return {
            driver: this.name,
            model: this.device ? this.device.model : 'Unknown',
            width: this.device ? this.device.width : 1920,
            height: this.device ? this.device.height : 1080,
            pixelRatio: this.device ? this.device.pixelRatio : 1,
            capabilities: this.capabilities
        };
    }

    createSurface(surfaceId, width, height) {
        if (!this.isLoaded()) {
            throw new Error(`[DisplayDriver] Cannot create surface ${surfaceId}: Driver not loaded.`);
        }
        return {
            id: surfaceId,
            width: width || (this.device ? this.device.width : 1920),
            height: height || (this.device ? this.device.height : 1080),
            status: 'INITIALIZED'
        };
    }

    supportsTransparency() {
        return this.capabilities.transparency;
    }

    supportsAnimations() {
        return this.capabilities.animations;
    }
}
