import { BaseDriver } from './BaseDriver.js';

/**
 * KeyboardDriver
 * 
 * Layer: 1-kernel/drivers
 * Responsibility:
 * Kernel driver for virtual keyboard controller (dev.input.keyboard).
 * Optional driver: Failure to initialize degrades gracefully.
 */

export class KeyboardDriver extends BaseDriver {
    constructor() {
        super('Lark Virtual Keyboard Driver', 'input', 'dev.input.keyboard', false);
    }

    async initialize(deviceMetadata) {
        if (!deviceMetadata || deviceMetadata.keyboardSupported === false) {
            this.status = 'DISABLED';
            this.error = 'Keyboard hardware bus not detected.';
            return false;
        }

        this.device = deviceMetadata;
        this.status = 'LOADED';
        this.error = null;
        console.log(`[Kernel:Driver] ${this.name} successfully bound to ${deviceMetadata.name}`);
        return true;
    }

    dispatchKeyEvent(event) {
        if (!this.isLoaded()) return false;
        return true;
    }

    supportsShortcutKeys() {
        return true;
    }
}
