/**
 * InputHandle
 * 
 * Layer: 1-kernel/handles
 * Responsibility:
 * Abstract kernel device handle representing input (keyboard / pointer) contracts.
 */

export class InputHandle {
    constructor(kbdDriver, ptrDriver) {
        this.kbdDriver = kbdDriver;
        this.ptrDriver = ptrDriver;
        this.handleId = `hnd.input.${Date.now().toString(36)}`;
    }

    isKeyboardAvailable() {
        return this.kbdDriver ? (this.kbdDriver.isLoaded() && this.kbdDriver.status !== 'DISABLED') : false;
    }

    isPointerAvailable() {
        return this.ptrDriver ? (this.ptrDriver.isLoaded() && this.ptrDriver.status !== 'DISABLED') : false;
    }

    supportsShortcutKeys() {
        return this.kbdDriver ? this.kbdDriver.supportsShortcutKeys() : false;
    }

    supportsDragAndDrop() {
        return this.ptrDriver ? this.ptrDriver.supportsDragAndDrop() : false;
    }
}
