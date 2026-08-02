/**
 * RestorePolicy
 * 
 * Responsibility:
 * Determines if specific restore or snapshot operations are permitted.
 * Delegates to SecurityService for role-based and contextual evaluations.
 */
export class RestorePolicy {
    constructor(securityService) {
        this.securityService = securityService;
    }

    canRestore(context) {
        // Must have SYSTEM level authority to trigger a system restore
        return this.securityService.hasPrivilege(context, 'system.restore');
    }

    canCreateSnapshot(context) {
        // Can be triggered by SYSTEM or an admin context
        return this.securityService.hasPrivilege(context, 'system.snapshot.create');
    }

    canRestoreSystem(context) {
        // Highest level privilege needed for full OS state rollback
        return this.securityService.hasPrivilege(context, 'system.restore.full');
    }
}
