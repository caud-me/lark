/**
 * DiskManager
 *
 * Responsibility:
 * Manages low-level virtual disk state, including snapshots and capacity tracking.
 *
 * Does NOT:
 * - Provide a user-facing file API
 */
export class DiskManager {
    constructor(lrfs) {
        this.lrfs = lrfs;
    }

    getDiskInfo() {
        return {
            version: this.lrfs.getDiskVersion(),
            usage: this.lrfs.getUsage(),
            capacity: this.lrfs.getCapacity(),
            snapshotCount: this.getSnapshots().length
        };
    }

    getSnapshots() {
        const meta = this.lrfs.getDiskMetadata();
        return meta.snapshots || [];
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

        return snap;
    }
}
