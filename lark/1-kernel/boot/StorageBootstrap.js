import { BootLogger } from './BootLogger.js';
import { LocalStorageDriver } from '../../2-storage/LocalStorageDriver.js';
import { IndexedDBStorageDriver } from '../../2-storage/IndexedDBStorageDriver.js';
import { LRFS } from '../../2-storage/LRFS.js';

/**
 * StorageBootstrap
 * 
 * Layer: 1-kernel/boot
 * Responsibility:
 * Detects active physical disk volume format (IndexedDB / LocalStorage) and mounts
 * the LRFS virtual filesystem.
 */
export class StorageBootstrap {
    static async run(ctx) {
        let activeDriver = null;

        // 1. Check persisted active volume configuration
        try {
            const activeVolStr = localStorage.getItem('lde27_active_volume');
            if (activeVolStr) {
                const activeVol = JSON.parse(activeVolStr);
                if (activeVol && activeVol.type === 'IndexedDB' && window.indexedDB) {
                    const idbDriver = new IndexedDBStorageDriver(activeVol.id || 'lde27_indexeddb_disk');
                    const ok = await idbDriver.init();
                    if (ok) {
                        activeDriver = idbDriver;
                    }
                } else if (activeVol && activeVol.type === 'LocalStorage') {
                    const lsDriver = new LocalStorageDriver(activeVol.id || 'lde27_lark_disk');
                    activeDriver = lsDriver;
                }
            }
        } catch (e) {
            BootLogger.warning(`StorageBootstrap volume probe note: ${e.message}`);
        }

        // 2. Probe IndexedDB for existing formatted disk
        if (!activeDriver && window.indexedDB) {
            try {
                const idbDriver = new IndexedDBStorageDriver('lde27_indexeddb_disk');
                const ok = await idbDriver.init();
                if (ok && idbDriver.db && await idbDriver.hasExistingData()) {
                    activeDriver = idbDriver;
                } else if (idbDriver.db) {
                    idbDriver.close();
                }
            } catch (e) {
                BootLogger.warning(`StorageBootstrap IndexedDB probe note: ${e.message}`);
            }
        }

        // 3. Probe LocalStorage keys for existing formatted metadata
        if (!activeDriver) {
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (!k || k === 'lde27_active_volume') continue;
                    const val = localStorage.getItem(k);
                    if (!val || typeof val !== 'string' || !val.trim().startsWith('{')) continue;
                    try {
                        const parsed = JSON.parse(val);
                        if (parsed && parsed.metadata && (parsed.metadata.formatted || parsed.metadata.name)) {
                            activeDriver = new LocalStorageDriver(k);
                            break;
                        }
                    } catch (err) {
                        BootLogger.warning(`StorageBootstrap JSON parse note for key ${k}: ${err.message}`);
                    }
                }
            } catch (e) {
                BootLogger.warning(`StorageBootstrap LocalStorage probe note: ${e.message}`);
            }
        }

        // 4. Default fallback
        if (!activeDriver) {
            activeDriver = new LocalStorageDriver('lde27_lark_disk');
        }

        ctx.lrfs = new LRFS(activeDriver);
        await ctx.lrfs.mount();
        BootLogger.success('Storage subsystem mounted.');
    }
}
