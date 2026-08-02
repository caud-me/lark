/**
 * StorageAdapter
 * 
 * Layer: 0-firmware
 * Responsibility:
 * Virtual hardware metadata and POST probing for the virtual NVMe storage controller.
 */

export class StorageAdapter {
    static getMetadata() {
        let lsAvailable = false;
        try {
            const testKey = '__firmware_test__';
            localStorage.setItem(testKey, '1');
            localStorage.removeItem(testKey);
            lsAvailable = true;
        } catch (e) {
            lsAvailable = false;
        }

        const hasStorage = lsAvailable || typeof window.indexedDB !== 'undefined';

        return {
            id: 'dev.storage.primary',
            name: 'Lark Virtual NVMe Controller',
            model: 'Lark-NVMe-Express-1TB',
            vendor: 'Lark Technologies Inc.',
            version: '3.1.0',
            type: 'storage',
            localStorageAvailable: lsAvailable,
            indexedDBAvailable: typeof window.indexedDB !== 'undefined',
            status: hasStorage ? (lsAvailable && typeof window.indexedDB !== 'undefined' ? 'ONLINE' : 'DEGRADED') : 'FAILED'
        };
    }
}
