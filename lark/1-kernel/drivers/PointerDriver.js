import { BaseDriver } from './BaseDriver.js';

/**
 * PointerDriver
 * 
 * Layer: 1-kernel/drivers
 * Responsibility:
 * Kernel driver for precision pointer controller (dev.input.pointer).
 * Optional driver: Failure to initialize degrades gracefully.
 */

export class PointerDriver extends BaseDriver {
    constructor() {
        super('Lark Precision Pointer Driver', 'input', 'dev.input.pointer', false);
    }

    async initialize(deviceMetadata) {
        if (!deviceMetadata) {
            this.status = 'DISABLED';
            this.error = 'Pointer device metadata unavailable.';
            return false;
        }

        this.device = deviceMetadata;
        this.status = 'LOADED';
        this.error = null;
        console.log(`[Kernel:Driver] ${this.name} successfully bound to ${deviceMetadata.name}`);
        return true;
    }

    dispatchPointerEvent(event) {
        if (!this.isLoaded()) return false;
        return true;
    }

    supportsDragAndDrop() {
        return true;
    }
}
