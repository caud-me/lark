import { HardwareRegistry } from '../0-firmware/HardwareRegistry.js';
import { DriverRegistry } from './DriverRegistry.js';
import { EventBus } from './SystemEventBus.js';
import { ContractViolationError } from '../3-system/errors/LarkErrors.js';
import { DisplayDriver } from './drivers/DisplayDriver.js';
import { DisplayGraphicsDriver } from './drivers/DisplayGraphicsDriver.js';
import { StorageDriver } from './drivers/StorageDriver.js';
import { KeyboardDriver } from './drivers/KeyboardDriver.js';
import { PointerDriver } from './drivers/PointerDriver.js';
import { NetworkDriver } from './drivers/NetworkDriver.js';
import { AudioDriver } from './drivers/AudioDriver.js';

/**
 * DriverManager
 * 
 * Layer: 1-kernel
 * Responsibility:
 * Owns driver lifecycle, binds drivers to virtual hardware devices exposed by 0-firmware,
 * emits driver lifecycle events over SystemEventBus, and raises structured Kernel Panics for critical driver failures.
 * 
 * Does NOT:
 * - Direct DOM manipulation or application logic
 */

export class DriverManager {
    constructor(driverRegistry) {
        if (!driverRegistry) {
            throw new ContractViolationError('DriverManager requires a valid DriverRegistry instance.');
        }
        this.registry = driverRegistry;
        this.initialized = false;
        this.registerDefaultDriverClasses();
    }

    /**
     * Registers default out-of-the-box kernel driver classes.
     */
    registerDefaultDriverClasses() {
        this.registry.registerDriverClass(DisplayDriver);
        this.registry.registerDriverClass(DisplayGraphicsDriver);
        this.registry.registerDriverClass(StorageDriver);
        this.registry.registerDriverClass(KeyboardDriver);
        this.registry.registerDriverClass(PointerDriver);
        this.registry.registerDriverClass(NetworkDriver);
        this.registry.registerDriverClass(AudioDriver);
    }

    /**
     * Instantiates and initializes kernel drivers against 0-firmware virtual hardware inventory.
     * @returns {Promise<Object>} Initialization report
     */
    async initializeDrivers() {
        console.log('[Kernel:DriverManager] Beginning driver initialization & device binding...');

        const firmwareMeta = HardwareRegistry.getSystemMetadata();
        const devices = firmwareMeta.devices || [];
        const driverClasses = this.registry.getDriverClasses();

        const report = {
            timestamp: Date.now(),
            totalDrivers: driverClasses.length,
            loadedCount: 0,
            failedCount: 0,
            drivers: []
        };

        for (const DriverClass of driverClasses) {
            const driverInstance = new DriverClass();
            const targetDeviceId = driverInstance.targetDeviceId;

            // Find matching device from 0-firmware inventory
            const matchedDevice = devices.find(d => d.id === targetDeviceId || d.type === driverInstance.type) || null;

            try {
                const success = await driverInstance.initialize(matchedDevice);
                this.registry.registerDriver(driverInstance);

                if (success && driverInstance.isLoaded()) {
                    report.loadedCount++;
                    EventBus.emit('driver.loaded', {
                        severity: 'Info',
                        source: 'DriverManager',
                        message: `Driver loaded: ${driverInstance.name}`,
                        data: driverInstance.getStatus()
                    });
                } else {
                    report.failedCount++;
                    EventBus.emit('driver.failed', {
                        severity: driverInstance.isRequired() ? 'Error' : 'Warning',
                        source: 'DriverManager',
                        message: `Driver failed: ${driverInstance.name}`,
                        data: driverInstance.getStatus()
                    });

                    if (driverInstance.isRequired()) {
                        const panicPayload = {
                            stopCode: driverInstance.type === 'display' ? 'LARK_GRAPHICS_FAILURE' : 'LARK_STORAGE_MOUNT_FAILURE',
                            component: driverInstance.name,
                            device: targetDeviceId || driverInstance.type,
                            recovery: 'Recovery Environment Available',
                            timestamp: Date.now()
                        };
                        const panicError = new Error(`KERNEL PANIC: [${panicPayload.stopCode}] ${driverInstance.name} failed initialization.`);
                        panicError.panicPayload = panicPayload;
                        throw panicError;
                    } else {
                        console.warn(`[Kernel:DriverManager] Optional driver [${driverInstance.name}] failed to load (${driverInstance.status}). System will degrade gracefully.`);
                    }
                }
            } catch (err) {
                if (driverInstance.isRequired()) {
                    throw err;
                } else {
                    driverInstance.status = 'FAILED';
                    driverInstance.error = err.message;
                    this.registry.registerDriver(driverInstance);
                    EventBus.emit('driver.failed', {
                        severity: 'Warning',
                        source: 'DriverManager',
                        message: `Driver failed: ${driverInstance.name}`,
                        data: driverInstance.getStatus()
                    });
                    console.warn(`[Kernel:DriverManager] Optional driver [${driverInstance.name}] caught error:`, err.message);
                }
            }

            report.drivers.push(driverInstance.getStatus());
        }

        this.initialized = true;
        console.log(`[Kernel:DriverManager] Driver initialization complete. Loaded: ${report.loadedCount}/${report.totalDrivers}`);
        return report;
    }

    /**
     * Returns driver registry.
     */
    getRegistry() {
        return this.registry;
    }

    /**
     * Returns a specific driver by target device ID or category.
     * @param {string} key 
     */
    getDriver(key) {
        return this.registry.getDriver(key);
    }

    /**
     * Returns driver inventory status list.
     */
    getDriverStatusList() {
        return this.registry.getDrivers().map(d => d.getStatus());
    }
}
