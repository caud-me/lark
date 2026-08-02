import { EventBus } from '../../1-kernel/SystemEventBus.js';

/**
 * VirtualDiskService
 *
 * Responsibility:
 * Exposes high-level operating system volume capabilities (provisionVolume, activateVolume, destroyVolume, deactivateVolume).
 * Standardizes return contracts across all operations to canonical Result Objects:
 * { success: boolean, code: string|null, message: string|null, data: any|null }
 *
 * Does NOT:
 * - Discover storage quotas (handled by StorageDiscoveryService)
 */
export class VirtualDiskService {
    constructor(serviceRegistry = null) {
        this.serviceRegistry = serviceRegistry;
    }

    /**
     * OS Capability: Provisions a new virtual storage volume.
     * @param {{ name: string, type?: 'LocalStorage'|'IndexedDB' }} config 
     */
    async provisionVolume(config = {}) {
        const nameToUse = config.name || 'Virtuoso';
        const storageBackend = config.type || 'LocalStorage';

        const diskImage = {
            version: 1,
            metadata: {
                name: nameToUse,
                formatted: true,
                created: new Date().toISOString(),
                backend: storageBackend
            },
            data: {}
        };

        if (storageBackend === 'LocalStorage') {
            try {
                const diskId = `lde27_disk_${Date.now()}`;
                localStorage.setItem(diskId, JSON.stringify(diskImage));
                EventBus.emit('system.disk.created', { severity: 'Info', source: 'VirtualDiskService', message: `Virtual volume '${nameToUse}' provisioned via LocalStorage.` });
                return {
                    success: true,
                    code: null,
                    message: null,
                    data: { id: diskId, name: nameToUse, type: storageBackend }
                };
            } catch (e) {
                EventBus.emit('storage:error', { severity: 'Error', source: 'VirtualDiskService', message: `Failed to provision LocalStorage volume: ${e.message}` });
                return {
                    success: false,
                    code: 'PROVISION_FAILED',
                    message: `Failed to provision LocalStorage volume: ${e.message}`,
                    data: null
                };
            }
        } else if (storageBackend === 'IndexedDB') {
            try {
                const { IndexedDBStorageDriver } = await import('../../2-storage/IndexedDBStorageDriver.js');
                const driver = new IndexedDBStorageDriver('lde27_indexeddb_disk');
                const initialized = await driver.init();
                if (initialized) {
                    await driver.setMetadata(diskImage.metadata);
                    EventBus.emit('system.disk.created', { severity: 'Info', source: 'VirtualDiskService', message: `Virtual volume '${nameToUse}' provisioned via IndexedDB.` });
                    return {
                        success: true,
                        code: null,
                        message: null,
                        data: { id: 'lde27_indexeddb_disk', name: nameToUse, type: storageBackend }
                    };
                }
            } catch (e) {
                EventBus.emit('storage:error', { severity: 'Error', source: 'VirtualDiskService', message: `Failed to provision IndexedDB volume: ${e.message}` });
                return {
                    success: false,
                    code: 'PROVISION_FAILED',
                    message: `Failed to provision IndexedDB volume: ${e.message}`,
                    data: null
                };
            }
        }

        return {
            success: false,
            code: 'UNSUPPORTED_BACKEND',
            message: `Unsupported storage backend '${storageBackend}'.`,
            data: null
        };
    }

    /**
     * OS Capability: Safely unmounts and destroys a virtual storage volume.
     * @param {string} volumeId 
     */
    async destroyVolume(volumeId) {
        const fileService = this.serviceRegistry ? this.serviceRegistry.get('FileService') : null;
        if (fileService && fileService.lrfs && fileService.lrfs.driver) {
            fileService.lrfs.driver.close();
            await this.deactivateVolume();
        }

        try {
            if (volumeId === 'lde27_indexeddb_disk') {
                if (!window.indexedDB || !window.indexedDB.deleteDatabase) {
                    return {
                        success: false,
                        code: 'NOT_SUPPORTED',
                        message: 'IndexedDB database deletion API is not supported in this browser.',
                        data: null
                    };
                }
                return await new Promise((resolve) => {
                    let finished = false;
                    const complete = (result) => {
                        if (!finished) {
                            finished = true;
                            resolve(result);
                        }
                    };
                    try {
                        const req = indexedDB.deleteDatabase('lde27_indexeddb_disk');
                        req.onsuccess = () => {
                            try { localStorage.removeItem('lde27_active_volume'); } catch (e) { console.warn('[VirtualDiskService] active_volume removal note:', e.message); }
                            EventBus.emit('system.disk.wiped', { severity: 'Info', source: 'VirtualDiskService', message: `IndexedDB volume '${volumeId}' destroyed.` });
                            complete({
                                success: true,
                                code: null,
                                message: null,
                                data: { volumeId }
                            });
                        };
                        req.onerror = (e) => {
                            complete({
                                success: false,
                                code: 'DESTROY_FAILED',
                                message: `Failed to delete IndexedDB database: ${e.target ? e.target.error : 'Unknown error'}`,
                                data: null
                            });
                        };
                        req.onblocked = () => {
                            console.warn('[VirtualDiskService] IndexedDB delete blocked by an open connection.');
                            complete({
                                success: false,
                                code: 'DISK_BLOCKED',
                                message: 'Volume destruction blocked by open database connections.',
                                data: null
                            });
                        };
                    } catch (e) {
                        complete({
                            success: false,
                            code: 'DESTROY_FAILED',
                            message: e.message || 'IndexedDB deletion threw an exception.',
                            data: null
                        });
                    }
                    setTimeout(() => complete({
                        success: false,
                        code: 'DISK_BLOCKED',
                        message: 'Volume destruction timed out due to blocked database connections.',
                        data: null
                    }), 300);
                });
            } else {
                localStorage.removeItem(volumeId);
                if (volumeId === 'lde27_lark_disk') {
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const k = localStorage.key(i);
                        if (k && (k.startsWith('lde27_lrfs_') || k.startsWith('lde27_disk_'))) {
                            keysToRemove.push(k);
                        }
                    }
                    keysToRemove.forEach(k => localStorage.removeItem(k));
                }
                try { localStorage.removeItem('lde27_active_volume'); } catch (e) { console.warn('[VirtualDiskService] active_volume removal note:', e.message); }
                EventBus.emit('system.disk.wiped', { severity: 'Info', source: 'VirtualDiskService', message: `LocalStorage volume '${volumeId}' destroyed.` });
                return {
                    success: true,
                    code: null,
                    message: null,
                    data: { volumeId }
                };
            }
        } catch (e) {
            EventBus.emit('storage:error', { severity: 'Error', source: 'VirtualDiskService', message: `Failed to destroy volume: ${e.message}` });
            return {
                success: false,
                code: 'DESTROY_FAILED',
                message: e.message,
                data: null
            };
        }
    }

    /**
     * OS Capability: Activates target storage volume and mounts it to LRFS.
     * @param {Object} disk 
     */
    async activateVolume(disk) {
        if (!disk || !disk.type) {
            EventBus.emit('storage:error', { severity: 'Error', source: 'VirtualDiskService', message: 'Invalid volume configuration provided to activateVolume.' });
            return {
                success: false,
                code: 'INVALID_CONFIG',
                message: 'Invalid volume configuration provided.',
                data: null
            };
        }

        const fileService = this.serviceRegistry ? this.serviceRegistry.get('FileService') : null;
        if (!fileService || !fileService.lrfs) {
            EventBus.emit('storage:error', { severity: 'Error', source: 'VirtualDiskService', message: 'FileService unavailable for volume activation.' });
            return {
                success: false,
                code: 'SERVICE_UNAVAILABLE',
                message: 'FileService is unavailable.',
                data: null
            };
        }

        try {
            if (disk.type === 'IndexedDB') {
                const { IndexedDBStorageDriver } = await import('../../2-storage/IndexedDBStorageDriver.js');
                const idbDriver = new IndexedDBStorageDriver(disk.id || 'lde27_indexeddb_disk');
                await idbDriver.init();
                fileService.lrfs.driver = idbDriver;
                await fileService.lrfs.mount();
            } else if (disk.type === 'LocalStorage') {
                const { LocalStorageDriver } = await import('../../2-storage/LocalStorageDriver.js');
                const lsDriver = new LocalStorageDriver(disk.id || 'lde27_lark_disk');
                fileService.lrfs.driver = lsDriver;
                await fileService.lrfs.mount();
            }

            try {
                localStorage.setItem('lde27_active_volume', JSON.stringify({
                    id: disk.id || (disk.type === 'IndexedDB' ? 'lde27_indexeddb_disk' : 'lde27_lark_disk'),
                    name: disk.name || 'Virtuoso',
                    type: disk.type
                }));
            } catch (e) {
                console.warn('[VirtualDiskService] Active volume persistence note:', e.message);
            }

            EventBus.emit('system.disk.activated', { severity: 'Info', source: 'VirtualDiskService', message: `Volume '${disk.name || disk.id}' activated.` });
            return {
                success: true,
                code: null,
                message: null,
                data: { volume: disk }
            };
        } catch (err) {
            EventBus.emit('storage:error', { severity: 'Error', source: 'VirtualDiskService', message: `Failed to activate volume: ${err.message}` });
            return {
                success: false,
                code: 'ACTIVATION_FAILED',
                message: err.message,
                data: null
            };
        }
    }

    /**
     * OS Capability: Deactivates active volume from LRFS.
     */
    async deactivateVolume() {
        const fileService = this.serviceRegistry ? this.serviceRegistry.get('FileService') : null;
        if (!fileService || !fileService.lrfs) {
            return {
                success: false,
                code: 'SERVICE_UNAVAILABLE',
                message: 'FileService unavailable.',
                data: null
            };
        }
        try {
            const { LocalStorageDriver } = await import('../../2-storage/LocalStorageDriver.js');
            fileService.lrfs.driver = new LocalStorageDriver('lde27_lark_disk');
            await fileService.lrfs.mount();
            try { localStorage.removeItem('lde27_active_volume'); } catch (e) { console.warn('[VirtualDiskService] Active volume removal note:', e.message); }
            return {
                success: true,
                code: null,
                message: null,
                data: null
            };
        } catch (e) {
            return {
                success: false,
                code: 'DEACTIVATION_FAILED',
                message: e.message,
                data: null
            };
        }
    }

    // Backward Compatibility Wrappers
    async createDisk(name, type) {
        const res = await this.provisionVolume({ name, type });
        return res.success;
    }

    async wipeDisk(driveId) {
        const res = await this.destroyVolume(driveId);
        return {
            status: res.success ? 'success' : (res.code === 'DISK_BLOCKED' ? 'blocked' : 'failed'),
            error: res.message
        };
    }

    async activateDisk(disk) {
        const res = await this.activateVolume(disk);
        return res.success;
    }

    async unmountCurrentDisk() {
        const res = await this.deactivateVolume();
        return res.success;
    }
}
