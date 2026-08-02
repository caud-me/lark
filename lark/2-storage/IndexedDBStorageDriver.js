import { EventBus } from '../1-kernel/SystemEventBus.js';

/**
 * IndexedDBStorageDriver
 *
 * Responsibility:
 * Implements high-capacity virtual disk storage backed by the browser IndexedDB API.
 *
 * Does NOT:
 * - Understand file structures or LRFS directory trees
 */
export class IndexedDBStorageDriver {
    constructor(dbName = 'lde27_indexeddb_disk', storeName = 'disk_store') {
        this.type = 'IndexedDB';
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = null;
        this.disk = this._createEmptyDisk();
    }

    async init() {
        return new Promise((resolve) => {
            if (!window.indexedDB) {
                EventBus.emit('storage:error', { severity: 'Error', source: 'IndexedDBStorageDriver', message: 'IndexedDB is not supported in this browser runtime.' });
                resolve(false);
                return;
            }

            const request = indexedDB.open(this.dbName);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };

            request.onsuccess = async (e) => {
                const db = e.target.result;
                // Auto-detect existing store names
                if (db.objectStoreNames.contains('disk_blocks')) {
                    this.storeName = 'disk_blocks';
                } else if (db.objectStoreNames.contains('disk_store')) {
                    this.storeName = 'disk_store';
                }

                if (!db.objectStoreNames.contains(this.storeName)) {
                    const currentVersion = db.version;
                    db.close();
                    const upgradeReq = indexedDB.open(this.dbName, currentVersion + 1);
                    upgradeReq.onupgradeneeded = (upEv) => {
                        const upDb = upEv.target.result;
                        if (!upDb.objectStoreNames.contains(this.storeName)) {
                            upDb.createObjectStore(this.storeName);
                        }
                    };
                    upgradeReq.onsuccess = async (upEv) => {
                        this.db = upEv.target.result;
                        await this._loadDisk();
                        await this._detectBrowserQuota();
                        resolve(true);
                    };
                    upgradeReq.onerror = () => resolve(false);
                } else {
                    this.db = db;
                    await this._loadDisk();
                    await this._detectBrowserQuota();
                    resolve(true);
                }
            };

            request.onerror = (e) => {
                EventBus.emit('storage:error', { severity: 'Error', source: 'IndexedDBStorageDriver', message: `Failed to open IndexedDB: ${e.target.error}` });
                resolve(false);
            };
        });
    }

    async _detectBrowserQuota() {
        if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                if (estimate && typeof estimate.quota === 'number' && estimate.quota > 0) {
                    this.detectedBrowserQuotaBytes = estimate.quota;
                }
            } catch (e) {
                this.detectedBrowserQuotaBytes = null;
            }
        }
    }

    async _loadDisk() {
        return new Promise((resolve) => {
            if (!this.db || !this.db.objectStoreNames.contains(this.storeName)) {
                this.disk = this._createEmptyDisk();
                return resolve(false);
            }
            try {
                const tx = this.db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const request = store.get('disk_image');

                request.onsuccess = () => {
                    if (request.result) {
                        try {
                            this.disk = JSON.parse(request.result);
                        } catch (err) {
                            this.disk = this._createEmptyDisk();
                        }
                    } else {
                        this.disk = this._createEmptyDisk();
                    }
                    resolve(true);
                };

                request.onerror = () => {
                    this.disk = this._createEmptyDisk();
                    resolve(false);
                };
            } catch (err) {
                this.disk = this._createEmptyDisk();
                resolve(false);
            }
        });
    }

    _createEmptyDisk() {
        return {
            version: 1,
            metadata: {},
            data: {}
        };
    }

    async _saveDisk() {
        return new Promise((resolve) => {
            if (!this.db || !this.db.objectStoreNames.contains(this.storeName)) {
                return resolve(false);
            }
            try {
                const tx = this.db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                const request = store.put(JSON.stringify(this.disk), 'disk_image');

                request.onsuccess = () => resolve(true);
                request.onerror = (e) => {
                    EventBus.emit('storage:error', { severity: 'Error', source: 'IndexedDBStorageDriver', message: `Write failed: ${e.target.error}` });
                    resolve(false);
                };
            } catch (err) {
                resolve(false);
            }
        });
    }

    getMetadata() {
        return (this.disk && this.disk.metadata) ? this.disk.metadata : {};
    }

    async setMetadata(metadata) {
        if (!this.disk) this.disk = this._createEmptyDisk();
        this.disk.metadata = metadata;
        await this._saveDisk();
    }

    getName() {
        if (this.disk && this.disk.metadata && this.disk.metadata.name) {
            return this.disk.metadata.name;
        }
        return this.dbName || 'IndexedDB Storage';
    }

    async getCapabilities() {
        // Usage: measure the in-memory disk image size.
        let usageBytes = 0;
        if (this.disk) {
            try {
                usageBytes = new Blob([JSON.stringify(this.disk)]).size;
            } catch (e) {
                console.warn('[IndexedDBStorageDriver] Failed to estimate usage blob size:', e.message);
            }
        }

        const name = this.getName();
        const label = (this.disk && this.disk.metadata && this.disk.metadata.label)
            ? this.disk.metadata.label
            : 'IndexedDB Storage';

        return {
            type: this.type,
            label,
            name,
            usageBytes,
            capacityBytes: this.getCapacity()
        };
    }

    getCapacity() {
        if (this.disk && this.disk.metadata && typeof this.disk.metadata.capacity === 'number' && this.disk.metadata.capacity > 0) {
            return this.disk.metadata.capacity;
        }
        if (typeof this.detectedBrowserQuotaBytes === 'number' && this.detectedBrowserQuotaBytes > 0) {
            return this.detectedBrowserQuotaBytes;
        }
        return null;
    }

    getLabel() {
        if (this.disk && this.disk.metadata && this.disk.metadata.label) {
            return this.disk.metadata.label;
        }
        return 'IndexedDB Storage';
    }

    getVersion() {
        return (this.disk && this.disk.version) ? this.disk.version : 1;
    }

    read(key) {
        if (!this.disk || !this.disk.data) return null;
        return this.disk.data.hasOwnProperty(key) ? this.disk.data[key] : null;
    }

    async write(key, value) {
        if (!this.disk) this.disk = this._createEmptyDisk();
        if (!this.disk.data) this.disk.data = {};
        this.disk.data[key] = value;
        return await this._saveDisk();
    }

    async remove(key) {
        if (this.disk && this.disk.data && this.disk.data.hasOwnProperty(key)) {
            delete this.disk.data[key];
            await this._saveDisk();
        }
    }

    keys() {
        if (!this.disk || !this.disk.data) return [];
        return Object.keys(this.disk.data);
    }

    /**
     * Returns true if the IndexedDB store has a previously written disk image.
     * Used by the kernel boot probe to distinguish a real provisioned volume
     * from a freshly auto-created empty database.
     */
    async hasExistingData() {
        if (!this.db || !this.db.objectStoreNames.contains(this.storeName)) {
            return false;
        }
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const req = store.getKey('disk_image');
                req.onsuccess = () => resolve(req.result !== undefined);
                req.onerror = () => resolve(false);
            } catch (e) {
                resolve(false);
            }
        });
    }

    /**
     * Closes the active IndexedDB connection.
     * Conforms to StorageDriver contract lifecycle.
     */
    close() {
        if (!this.db) return;
        this.db.close();
        this.db = null;
    }
}
