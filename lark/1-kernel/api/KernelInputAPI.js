import { InputHandle } from '../handles/InputHandle.js';

/**
 * KernelInputAPI
 * 
 * Layer: 1-kernel/api
 * Responsibility:
 * Stable public Kernel API for keyboard and pointer input capability queries.
 */

export class KernelInputAPI {
    constructor(driverManager) {
        this.driverManager = driverManager;
    }

    _getHandle() {
        const kbd = this.driverManager ? this.driverManager.getDriver('dev.input.keyboard') || this.driverManager.getDriver('input') : null;
        const ptr = this.driverManager ? this.driverManager.getDriver('dev.input.pointer') : null;
        return new InputHandle(kbd, ptr);
    }

    isKeyboardAvailable() {
        return this._getHandle().isKeyboardAvailable();
    }

    isPointerAvailable() {
        return this._getHandle().isPointerAvailable();
    }

    supportsShortcutKeys() {
        return this._getHandle().supportsShortcutKeys();
    }

    supportsDragAndDrop() {
        return this._getHandle().supportsDragAndDrop();
    }
}
