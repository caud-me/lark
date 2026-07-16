import { BootMode } from '../../system/BootMode.js';
import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * RecoveryService
 * 
 * Responsibility:
 * Public API for querying boot mode and executing recovery diagnostics.
 */
export class RecoveryService {
    constructor(recoveryManager, serviceRegistry) {
        this.recoveryManager = recoveryManager;
        this.serviceRegistry = serviceRegistry;
    }

    isRecoveryMode() {
        return this.recoveryManager.getBootMode() === BootMode.RECOVERY;
    }

    isSafeMode() {
        return this.recoveryManager.getBootMode() === BootMode.SAFE_MODE;
    }

    listRecoveryTools() {
        return [
            { id: 'bootlog', name: 'Boot Log Viewer', description: 'View the timeline of the last boot sequence.' }
        ];
    }
}
