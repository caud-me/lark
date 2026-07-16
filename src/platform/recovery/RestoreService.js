import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * RestoreService
 * 
 * Responsibility:
 * Public API for System Restore functionality.
 * Delegates storage concerns to DiskService.
 */
export class RestoreService {
    constructor(restoreManager, restorePolicy, serviceRegistry) {
        this.restoreManager = restoreManager;
        this.restorePolicy = restorePolicy;
        this.serviceRegistry = serviceRegistry;
    }

    /**
     * Lists available system restore points.
     * Delegates directly to DiskService.
     */
    async listRestorePoints() {
        // DiskService tracks snapshots. 
        // We'll wrap or return them as "Restore Points".
        const diskService = this.serviceRegistry.get('DiskService');
        return diskService ? diskService.getSnapshots() : [];
    }

    /**
     * Creates a new restore point (snapshot).
     * Delegates to DiskService after policy check.
     */
    async createRestorePoint(name, context) {
        if (!this.restorePolicy.canCreateSnapshot(context)) {
            throw new Error('[RestoreService] Access denied: Cannot create snapshot in current context.');
        }

        const diskService = this.serviceRegistry.get('DiskService');
        if (!diskService) throw new Error('[RestoreService] DiskService not available.');
        
        EventBus.emit('restore.snapshot.creating', { severity: 'Info', source: 'RestoreService', message: `Creating restore point: ${name}` });
        const snapshot = await diskService.createSnapshot(name);
        EventBus.emit('restore.snapshot.created', { severity: 'Info', source: 'RestoreService', message: `Restore point created: ${snapshot.id}` });
        return snapshot;
    }

    /**
     * Restores the system to a previous snapshot.
     * DEFERRED implementation.
     */
    async restoreSnapshot(id, context) {
        if (!this.restorePolicy.canRestoreSystem(context)) {
            throw new Error('[RestoreService] Access denied: Cannot restore system in current context.');
        }

        this.restoreManager.setSelectedSnapshotId(id);
        this.restoreManager.setActiveRestoreOperation({ type: 'full_restore', id, status: 'deferred' });
        
        EventBus.emit('restore.operation.deferred', { severity: 'Warning', source: 'RestoreService', message: 'System restore feature is deferred.' });
        
        throw new Error('Feature deferred: System restore mechanics are deferred to a future phase.');
    }

    cancelRestore() {
        if (this.restoreManager.getActiveRestoreOperation()) {
            this.restoreManager.setActiveRestoreOperation(null);
            this.restoreManager.setSelectedSnapshotId(null);
            this.restoreManager.setProgress(0);
            EventBus.emit('restore.operation.cancelled', { severity: 'Info', source: 'RestoreService', message: 'Active restore operation cancelled.' });
        }
    }
}
