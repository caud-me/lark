/**
 * GuardianValidationRegistry
 *
 * Responsibility:
 * Central registry for pluggable Guardian validation modules.
 * Enforces the Open/Closed Principle (OCP) by discovering registered validators.
 */
export class GuardianValidationRegistry {
    constructor() {
        this.modules = new Map();
    }

    /**
     * Registers a validation module.
     * @param {Object} module - Object implementing ValidationModule interface
     */
    register(module) {
        if (module && module.id) {
            this.modules.set(module.id, module);
        }
    }

    /**
     * Retrieves all registered validation modules.
     * @returns {Array} List of validation modules
     */
    getModules() {
        return Array.from(this.modules.values());
    }

    /**
     * Retrieves modules matching a specific scan type.
     * @param {string} scanType ('STARTUP' | 'QUICK' | 'FULL')
     * @returns {Array} Filtered validation modules
     */
    getModulesForScanType(scanType) {
        const allModules = this.getModules();
        return allModules.filter(m => {
            if (!m.supportedScanTypes || m.supportedScanTypes.includes(scanType) || m.supportedScanTypes.includes('ALL')) {
                return true;
            }
            return false;
        });
    }
}
