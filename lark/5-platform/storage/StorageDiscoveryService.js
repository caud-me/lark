/**
 * StorageDiscoveryService
 *
 * Responsibility:
 * Exposes a read-only platform API for discovering available virtual disks and probing browser storage capabilities.
 *
 * Does NOT:
 * - Mutate, format, or wipe virtual disks (handled by VirtualDiskService)
 */
export class StorageDiscoveryService {
    constructor(serviceRegistry = null) {
        this.serviceRegistry = serviceRegistry;
    }

    /**
     * Inspects browser storage mechanisms to discover active LRFS virtual disks.
     * Only returns explicitly provisioned disks (containing valid metadata with a name or formatted flag).
     * @returns {Promise<Array<{ id: string, name: string, type: string, freeSpace: string, capacity: string }>>}
     */
    async discoverDisks() {
        const discovered = [];
        const seenIds = new Set();

        try {
            // Scan all localStorage keys
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;

                const val = localStorage.getItem(key);
                if (!val) continue;

                try {
                    const parsed = JSON.parse(val);
                    // Only recognize disks that have explicit provisioned metadata
                    if (parsed && typeof parsed === 'object' && parsed.metadata && (parsed.metadata.name || parsed.metadata.formatted)) {
                        const diskName = parsed.metadata.name || key;
                        const sizeBytes = new Blob([val]).size;
                        const capacityBytes = typeof parsed.metadata.capacity === 'number' ? parsed.metadata.capacity : null;
                        
                        let freeSpaceStr = 'Unspecified';
                        let capacityStr = 'Unknown';
                        
                        if (capacityBytes) {
                            const freeBytes = Math.max(0, capacityBytes - sizeBytes);
                            freeSpaceStr = `${(freeBytes / (1024 * 1024)).toFixed(2)} MB Free`;
                            capacityStr = `${(capacityBytes / (1024 * 1024)).toFixed(2)} MB`;
                        }

                        if (!seenIds.has(key)) {
                            seenIds.add(key);
                            discovered.push({
                                id: key,
                                name: diskName,
                                type: 'LocalStorage',
                                freeSpace: freeSpaceStr,
                                capacity: capacityStr
                            });
                        }
                    }
                } catch (e) {
                    // Ignore non-disk keys
                }
            }
        } catch (e) {
            console.error('[StorageDiscoveryService] Error discovering localStorage disks:', e);
        }

        // Scan IndexedDB Disks
        if (window.indexedDB) {
            try {
                const meta = await this._readIndexedDBMetadata('lde27_indexeddb_disk');
                if (meta && (meta.name || meta.formatted) && !seenIds.has('lde27_indexeddb_disk')) {
                    seenIds.add('lde27_indexeddb_disk');
                    const capBytes = typeof meta.capacity === 'number' ? meta.capacity : null;
                    discovered.push({
                        id: 'lde27_indexeddb_disk',
                        name: meta.name || 'IndexedDB Storage',
                        type: 'IndexedDB',
                        freeSpace: capBytes ? `${(capBytes / (1024 * 1024 * 1024)).toFixed(2)} GB Quota` : 'Quota Unspecified',
                        capacity: capBytes ? `${(capBytes / (1024 * 1024 * 1024)).toFixed(2)} GB` : 'Unknown'
                    });
                }
            } catch (e) {
                // No IndexedDB disk found
            }
        }

        return discovered;
    }

    _readIndexedDBMetadata(dbName) {
        return new Promise((resolve) => {
            try {
                const req = indexedDB.open(dbName);
                req.onsuccess = (e) => {
                    const db = e.target.result;
                    if (!db || !db.objectStoreNames) {
                        if (db && typeof db.close === 'function') db.close();
                        return resolve(null);
                    }
                    const targetStore = db.objectStoreNames.contains('disk_store') 
                        ? 'disk_store' 
                        : (db.objectStoreNames.contains('disk_blocks') ? 'disk_blocks' : null);

                    if (!targetStore) {
                        if (db && typeof db.close === 'function') db.close();
                        return resolve(null);
                    }
                    try {
                        const tx = db.transaction(targetStore, 'readonly');
                        const store = tx.objectStore(targetStore);
                        const getReq = store.get('disk_image');
                        getReq.onsuccess = () => {
                            db.close();
                            if (getReq.result) {
                                try {
                                    const parsed = JSON.parse(getReq.result);
                                    if (parsed && parsed.metadata && (parsed.metadata.name || parsed.metadata.formatted)) {
                                        resolve(parsed.metadata);
                                    } else {
                                        resolve(null);
                                    }
                                } catch (err) {
                                    resolve(null);
                                }
                            } else {
                                resolve(null);
                            }
                        };
                        getReq.onerror = () => {
                            db.close();
                            resolve(null);
                        };
                    } catch (txErr) {
                        if (db && typeof db.close === 'function') db.close();
                        resolve(null);
                    }
                };
                req.onerror = () => resolve(null);
            } catch (err) {
                resolve(null);
            }
        });
    }

    /**
     * Probes browser runtime capabilities to estimate storage quotas and engine availability.
     * @returns {Promise<{ hasIndexedDB: boolean, estimatedQuotaMb: number, browserName: string }>}
     */
    async estimateCapabilities() {
        const userAgent = navigator.userAgent;
        let browserName = 'Browser';
        if (userAgent.includes('Firefox')) browserName = 'Firefox';
        else if (userAgent.includes('Edg')) browserName = 'Edge';
        else if (userAgent.includes('Chrome')) browserName = 'Chrome';
        else if (userAgent.includes('Safari')) browserName = 'Safari';

        const hasIndexedDB = !!window.indexedDB;
        let estimatedQuotaMb = null;

        if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                if (estimate && estimate.quota) {
                    estimatedQuotaMb = Math.round(estimate.quota / (1024 * 1024));
                }
            } catch (e) {
                // Return null if browser storage estimation fails
            }
        }

        return {
            hasIndexedDB,
            estimatedQuotaMb,
            browserName
        };
    }
}
