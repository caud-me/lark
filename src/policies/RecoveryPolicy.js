/**
 * RecoveryPolicy
 *
 * Responsibility:
 * Centralized policy engine for evaluating if the current context has
 * permission to perform dangerous recovery operations.
 */
export class RecoveryPolicy {
    constructor(securityService) {
        this.securityService = securityService;
    }

    /**
     * Helper to evaluate if the context has administrative privileges.
     * @param {Object} context 
     * @returns {string} 'ALLOW', 'DENY', or 'REQUIRES_ELEVATION'
     */
    _requireAdministrator(context) {
        if (!context) return 'DENY';
        if (context.role === 'SYSTEM' || context.role === 'KERNEL') return 'ALLOW';
        if (context.role === 'ADMINISTRATOR') {
            return context.elevated ? 'ALLOW' : 'REQUIRES_ELEVATION';
        }
        return 'DENY';
    }

    canRepairFilesystem(context) {
        return this._requireAdministrator(context);
    }

    canResetSettings(context) {
        return this._requireAdministrator(context);
    }

    canRestoreDisk(context) {
        return this._requireAdministrator(context);
    }

    canExitRecovery(context) {
        return 'ALLOW'; // Anyone can reboot out of recovery
    }
}
