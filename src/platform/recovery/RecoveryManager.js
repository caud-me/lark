import { BootMode } from '../../system/BootMode.js';

/**
 * RecoveryManager
 * 
 * Responsibility:
 * Owns the system recovery state. Determines the boot mode during initialization
 * by reading from the external bootloader state (localStorage), and immediately
 * clears it to prevent boot loops.
 */
export class RecoveryManager {
    constructor() {
        // Read the requested boot mode from the environment outside the virtual filesystem
        this.bootMode = localStorage.getItem('lde_boot_mode') || BootMode.NORMAL;
        
        // Clear the flag so subsequent reboots default back to NORMAL unless explicitly requested
        localStorage.removeItem('lde_boot_mode');

        this.recoveryReason = null;
        this.lastBootStatus = 'UNKNOWN';
        this.repairHistory = [];
    }

    getBootMode() {
        return this.bootMode;
    }

    setRecoveryReason(reason) {
        this.recoveryReason = reason;
    }

    getRecoveryReason() {
        return this.recoveryReason;
    }

    setLastBootStatus(status) {
        this.lastBootStatus = status;
    }

    getLastBootStatus() {
        return this.lastBootStatus;
    }

    addRepairRecord(record) {
        this.repairHistory.push({
            timestamp: Date.now(),
            ...record
        });
    }

    getRepairHistory() {
        return [...this.repairHistory];
    }
}
