import { EventBus } from '../kernel/SystemEventBus.js';

/**
 * DiskService
 *
 * Responsibility:
 * Exposes a public API for disk operations and snapshot management.
 *
 * Does NOT:
 * - Directly manipulate the filesystem structure
 */
export class DiskService {
    constructor(diskManager) {
        this.diskManager = diskManager;
    }

    getDiskInfo() {
        const info = this.diskManager.getDiskInfo();
        EventBus.emit('disk.info.requested', { severity: 'Info', source: 'DiskService', message: 'Disk information requested' });
        return info;
    }

    getVersion() {
        return this.diskManager.getDiskInfo().version;
    }

    getSnapshots() {
        return this.diskManager.getSnapshots();
    }

    createSnapshot(label) {
        const snap = this.diskManager.createSnapshot(label);
        EventBus.emit('disk.snapshot.created', { 
            severity: 'Info', 
            source: 'DiskService', 
            message: `Snapshot created: ${snap.id} (${snap.label})`
        });
        return snap;
    }
}
