import { EventBus } from '../kernel/SystemEventBus.js';

/**
 * LocalStorageDriver
 *
 * Responsibility:
 * Implements low-level block storage using the browser's localStorage API.
 *
 * Does NOT:
 * - Understand file structures
 */
export class LocalStorageDriver {
    constructor(diskName = 'lde27_lark_disk', legacyPrefix = 'lde27_lrfs_') {
        this.diskName = diskName;
        this.legacyPrefix = legacyPrefix;
        this.disk = this._loadDisk();
    }

    _loadDisk() {
        try {
            const raw = localStorage.getItem(this.diskName);
            if (raw) {
                return JSON.parse(raw);
            } else {
                // Check for legacy migration
                return this._migrateLegacyDisk();
            }
        } catch (e) {
            EventBus.emit('storage:error', { severity: 'Error', source: 'LocalStorageDriver', message: `Failed to load disk image: ${e.message}` });
            return this._createEmptyDisk();
        }
    }

    _createEmptyDisk() {
        return {
            version: 1,
            metadata: {},
            data: {}
        };
    }

    _migrateLegacyDisk() {
        let needsMigration = false;
        const disk = this._createEmptyDisk();

        // 1. Gather all legacy keys
        const legacyKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(this.legacyPrefix)) {
                legacyKeys.push(k);
                needsMigration = true;
            }
        }

        // 2. Migrate if any exist
        if (needsMigration) {
            EventBus.emit('storage:info', { severity: 'Info', source: 'LocalStorageDriver', message: 'Found legacy storage keys, migrating to virtual disk image...' });
            for (const key of legacyKeys) {
                const logicalKey = key.substring(this.legacyPrefix.length);
                const value = localStorage.getItem(key);
                disk.data[logicalKey] = value;
            }

            // Save the newly formed disk image
            this.disk = disk; // Set temporarily so save works
            if (this._saveDisk()) {
                // 3. Cleanup old keys upon success
                for (const key of legacyKeys) {
                    localStorage.removeItem(key);
                }
                EventBus.emit('storage:info', { severity: 'Info', source: 'LocalStorageDriver', message: 'Migration complete and legacy keys removed.' });
            }
        }

        return disk;
    }

    _saveDisk() {
        try {
            localStorage.setItem(this.diskName, JSON.stringify(this.disk));
            return true;
        } catch (e) {
            EventBus.emit('storage:error', { severity: 'Error', source: 'LocalStorageDriver', message: `Write failed (Quota exceeded?): ${e.message}` });
            return false;
        }
    }

    getMetadata() {
        return this.disk.metadata;
    }

    setMetadata(metadata) {
        this.disk.metadata = metadata;
        this._saveDisk();
    }

    getVersion() {
        return this.disk.version;
    }

    /**
     * Reads a value from storage.
     * @param {string} key 
     * @returns {string|null}
     */
    read(key) {
        return this.disk.data.hasOwnProperty(key) ? this.disk.data[key] : null;
    }

    /**
     * Writes a value to storage.
     * @param {string} key 
     * @param {string} value 
     */
    write(key, value) {
        this.disk.data[key] = value;
        return this._saveDisk();
    }

    /**
     * Removes a value from storage.
     * @param {string} key 
     */
    remove(key) {
        if (this.disk.data.hasOwnProperty(key)) {
            delete this.disk.data[key];
            this._saveDisk();
        }
    }

    /**
     * Gets all keys belonging to this driver.
     * @returns {string[]}
     */
    keys() {
        return Object.keys(this.disk.data);
    }
}
