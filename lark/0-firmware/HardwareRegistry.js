import { DisplayAdapter } from './adapters/DisplayAdapter.js';
import { StorageAdapter } from './adapters/StorageAdapter.js';
import { KeyboardAdapter } from './adapters/KeyboardAdapter.js';
import { PointerAdapter } from './adapters/PointerAdapter.js';
import { NetworkAdapter } from './adapters/NetworkAdapter.js';
import { AudioAdapter } from './adapters/AudioAdapter.js';

/**
 * HardwareRegistry
 * 
 * Layer: 0-firmware
 * Responsibility:
 * Central owner of virtual hardware inventory and machine identity.
 * Discovers, enumerates, and validates virtual hardware capabilities (Display, Storage, Input, Network, Audio)
 * during Power-On Self-Test (POST) before kernel initialization.
 * 
 * Does NOT:
 * - Manage OS application processes or services
 * - Perform user authorization or policy evaluations
 */

export class HardwareRegistry {
    static devices = new Map();
    static postPassed = false;
    static machineId = null;

    /**
     * Retrieves or generates a persistent Virtual Machine Identity (e.g. "LARK-VM-7F2A91").
     * @returns {string}
     */
    static getMachineIdentity() {
        if (this.machineId) return this.machineId;

        const STORAGE_KEY = 'lde27_firmware_machine_id';
        try {
            let existing = localStorage.getItem(STORAGE_KEY);
            if (!existing) {
                const randSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
                existing = `LARK-VM-${randSuffix}`;
                localStorage.setItem(STORAGE_KEY, existing);
            }
            this.machineId = existing;
        } catch (e) {
            this.machineId = 'LARK-VM-EPHEMERAL';
        }
        return this.machineId;
    }

    /**
     * Executes Power-On Self-Test (POST) to probe all host environment virtual hardware adapters.
     * @returns {Object} POST summary report
     */
    static probeAll() {
        const machineId = this.getMachineIdentity();

        const report = {
            timestamp: Date.now(),
            machineId,
            vmModel: 'Lark Virtual Machine v27',
            vendor: 'Lark Technologies Inc.',
            firmwareVersion: '27.9.1-firmware',
            passed: true,
            devices: {}
        };

        const adapters = [
            DisplayAdapter.getMetadata(),
            StorageAdapter.getMetadata(),
            KeyboardAdapter.getMetadata(),
            PointerAdapter.getMetadata(),
            NetworkAdapter.getMetadata(),
            AudioAdapter.getMetadata()
        ];

        this.devices.clear();
        adapters.forEach(dev => {
            this.devices.set(dev.id, dev);
            report.devices[dev.type] = dev;
            if (dev.status === 'FAILED') {
                report.passed = false;
            }
        });

        this.postPassed = report.passed;
        console.log(`[Firmware:POST] Machine Identity [${machineId}] Hardware enumeration complete:`, report.devices);
        return report;
    }

    /**
     * Returns device info by device ID.
     * @param {string} id 
     * @returns {Object|null}
     */
    static getDevice(id) {
        return this.devices.get(id) || null;
    }

    /**
     * Returns all discovered virtual hardware devices.
     * @returns {Array<Object>}
     */
    static getDevices() {
        return Array.from(this.devices.values());
    }

    /**
     * Returns firmware identity and system hardware summary for kernel/service consumption.
     * @returns {Object}
     */
    static getSystemMetadata() {
        return {
            machineId: this.getMachineIdentity(),
            vmModel: 'Lark Virtual Machine v27',
            vendor: 'Lark Technologies Inc.',
            firmwareVersion: '27.9.1-firmware',
            postStatus: this.postPassed ? 'PASSED' : 'PENDING',
            deviceCount: this.devices.size,
            devices: this.getDevices()
        };
    }
}
