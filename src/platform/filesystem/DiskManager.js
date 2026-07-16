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
    constructor() {
        this.info = {
            version: '1.0.0',
            usage: 0,
            capacity: 0,
            snapshotCount: 0
        };
        this.snapshots = [];
    }

    setInfo(info) {
        this.info = info;
    }

    getInfo() {
        return this.info;
    }

    setSnapshots(snapshots) {
        this.snapshots = snapshots;
    }

    getSnapshots() {
        return this.snapshots;
    }

    addSnapshot(snapshot) {
        this.snapshots.push(snapshot);
        this.info.snapshotCount = this.snapshots.length;
    }
}
