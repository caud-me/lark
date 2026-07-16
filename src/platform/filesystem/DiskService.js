import { EventBus } from '../../kernel/SystemEventBus.js';

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
    constructor(diskManager, lrfs) {
        this.diskManager = diskManager;
        this.lrfs = lrfs;
    }

    /**
     * Initializes the service by reading disk state into the manager.
     */
    initialize() {
        this._syncState();
    }

    _syncState() {
        const meta = this.lrfs.getDiskMetadata();
        const snapshots = meta.snapshots || [];
        this.diskManager.setSnapshots(snapshots);

        this.diskManager.setInfo({
            version: this.lrfs.getDiskVersion(),
            usage: this.lrfs.getUsage(),
            capacity: this.lrfs.getCapacity(),
            snapshotCount: snapshots.length
        });
    }

    getDiskInfo() {
        this._syncState(); // ensure fresh data
        const info = this.diskManager.getInfo();
        EventBus.emit('disk.info.requested', { severity: 'Info', source: 'DiskService', message: 'Disk information requested' });
        return info;
    }

    getVersion() {
        this._syncState();
        return this.diskManager.getInfo().version;
    }

    getSnapshots() {
        this._syncState();
        return this.diskManager.getSnapshots();
    }

    createSnapshot(label) {
        const meta = this.lrfs.getDiskMetadata();
        if (!meta.snapshots) meta.snapshots = [];

        const snap = {
            id: `snap_${Date.now()}`,
            timestamp: new Date().toISOString(),
            label: label || 'Manual Snapshot',
            size: this.lrfs.getUsage(),
            diskVersion: this.lrfs.getDiskVersion()
        };

        meta.snapshots.push(snap);
        this.lrfs.setDiskMetadata(meta);

        this.diskManager.addSnapshot(snap);

        EventBus.emit('disk.snapshot.created', { 
            severity: 'Info', 
            source: 'DiskService', 
            message: `Snapshot created: ${snap.id} (${snap.label})`
        });
        return snap;
    }
}
