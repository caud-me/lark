/**
 * DriverRegistry
 * 
 * Layer: 1-kernel
 * Responsibility:
 * Central driver lookup and class registration registry.
 * Enables Open-Closed Principle (OCP) for adding new driver classes (Bluetooth, GPU, USB, etc.)
 * without modifying kernel boot logic.
 * 
 * Does NOT:
 * - Direct device binding or lifecycle initialization (DriverManager owns this)
 */

export class DriverRegistry {
    constructor() {
        this.driverClasses = new Set();
        this.drivers = new Map(); // targetDeviceId -> Driver Instance
    }

    /**
     * Registers a driver class constructor.
     * @param {Function} DriverClass 
     */
    registerDriverClass(DriverClass) {
        if (!DriverClass || typeof DriverClass !== 'function') {
            throw new Error('[DriverRegistry] Invalid DriverClass constructor.');
        }
        this.driverClasses.add(DriverClass);
    }

    /**
     * Returns all registered driver classes.
     * @returns {Array<Function>}
     */
    getDriverClasses() {
        return Array.from(this.driverClasses);
    }

    /**
     * Stores an initialized driver instance in the registry.
     * @param {Object} driverInstance 
     */
    registerDriver(driverInstance) {
        if (!driverInstance || !driverInstance.targetDeviceId) {
            throw new Error('[DriverRegistry] Driver instance missing targetDeviceId.');
        }
        this.drivers.set(driverInstance.targetDeviceId, driverInstance);
    }

    /**
     * Returns a driver instance by target device ID or type category.
     * @param {string} key Device ID or type category
     * @returns {Object|null}
     */
    getDriver(key) {
        if (this.drivers.has(key)) {
            return this.drivers.get(key);
        }
        // Fallback search by driver type category (e.g. 'display', 'storage', 'network')
        for (const driver of this.drivers.values()) {
            if (driver.type === key) {
                return driver;
            }
        }
        return null;
    }

    /**
     * Returns all registered driver instances.
     * @returns {Array<Object>}
     */
    getDrivers() {
        return Array.from(this.drivers.values());
    }
}
