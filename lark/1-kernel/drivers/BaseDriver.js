/**
 * BaseDriver
 * 
 * Layer: 1-kernel/drivers
 * Responsibility:
 * Base abstract class for all Lark OS Kernel Drivers. Defines standard lifecycle contract,
 * binding context to virtual hardware devices exposed by 0-firmware.
 * 
 * Does NOT:
 * - Direct DOM manipulation or presentation rendering
 */

export class BaseDriver {
    /**
     * @param {string} name Human-readable driver name
     * @param {string} type Device type category ('display', 'storage', 'input', 'network', 'audio')
     * @param {string} targetDeviceId Virtual hardware device ID matched from Firmware
     * @param {boolean} required Criticality flag (if true, initialization failure triggers Kernel Panic)
     */
    constructor(name, type, targetDeviceId, required = false) {
        this.name = name;
        this.type = type;
        this.targetDeviceId = targetDeviceId;
        this.required = required;
        this.status = 'UNLOADED';
        this.device = null;
        this.error = null;
    }

    /**
     * Binds driver to virtual hardware device metadata and initializes contract capabilities.
     * Must be overridden by subclasses.
     * @param {Object} deviceMetadata 
     * @returns {Promise<boolean>}
     */
    async initialize(deviceMetadata) {
        throw new Error(`[BaseDriver] Abstract method initialize() not implemented on ${this.name}`);
    }

    /**
     * Returns driver status snapshot.
     */
    getStatus() {
        return {
            name: this.name,
            type: this.type,
            targetDeviceId: this.targetDeviceId,
            required: this.required,
            status: this.status,
            error: this.error,
            device: this.device
        };
    }

    isLoaded() {
        return this.status === 'LOADED';
    }

    isRequired() {
        return this.required;
    }
}
