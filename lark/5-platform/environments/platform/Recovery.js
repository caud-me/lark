import { PlatformEnvironmentSurface } from './PlatformEnvironmentSurface.js';
import { DialogSurface } from '../../desktop/shell/DialogSurface.js';

/**
 * Recovery Platform Environment
 *
 * Responsibility:
 * Provides a safe mode or system recovery interface.
 * Consumes PlatformEnvironmentSurface canonical DOM layout.
 */
export default {
    run: async (registry) => {
        return new Promise((resolve) => {
            const container = document.getElementById('platform-host');
            if (container) {
                const existingPlatformEnv = container.querySelector('.platform-environment');
                if (existingPlatformEnv) existingPlatformEnv.remove();
            }

            // Ensure a fresh, active DialogSurface is mounted and resumed on document.body
            const existingLayer = document.getElementById('lde-dialog-layer');
            if (existingLayer) {
                existingLayer.remove();
            }

            console.log('[Recovery] Initializing active DialogSurface for shell dialogs...');
            const envManager = registry ? registry.get('EnvironmentManager') : null;
            const activeEnv = envManager ? envManager.getActiveEnvironment() : null;
            const dialogSurface = new DialogSurface();
            dialogSurface.initialize(registry, activeEnv);
            dialogSurface.mount(document.body);
            dialogSurface.resume();

            const surface = new PlatformEnvironmentSurface();
            const rootNode = surface.render();
            if (container) {
                container.appendChild(rootNode);
            }

            const viewport = surface.stepContainerElement;

            const cleanup = () => {
                rootNode.remove();
                resolve();
            };

            viewport.innerHTML = `
                <div class="shell-extras-icon-design">
                    <i>&#xE72C;</i>
                </div>
                <h1>System Recovery</h1>
                <p>Select a recovery mode to execute on this device.</p>
                <div class="omni-card-v">
                    <div class="radio">
                        <div class="layout-h">
                            <input type="radio" id="mode-reboot" name="recovery-mode" value="reboot" checked>
                            <div class="layout-v">
                                <label for="mode-reboot">Restart this device</label>
                                <small>Reboots the device normally into the active environment.</small>
                            </div>
                        </div>
                        <div class="layout-h">
                            <input type="radio" id="mode-reset" name="recovery-mode" value="reset">
                            <div class="layout-v">
                                <label for="mode-reset">Reset this PC</label>
                                <small>Permanently erases all user accounts, installed apps, and system files to return to initial setup.</small>
                            </div>
                        </div>
                    </div>
                </div>
                <button type="button" id="btn-recovery-continue">Continue</button>
            `;

            const executeReboot = () => {
                try {
                    const powerService = registry ? registry.get('PowerService') : null;
                    if (powerService && typeof powerService.reboot === 'function') {
                        powerService.reboot({ mode: 'NORMAL' }).catch(() => {
                            window.location.reload();
                        });
                        setTimeout(() => {
                            window.location.reload();
                        }, 300);
                        return;
                    }
                } catch (e) {
                    console.warn('[Recovery] Backup restore note:', e.message);
                }
                window.location.reload();
            };

            const wipeAllStorage = async () => {
                // 1. Close any active file service database handle to unblock IndexedDB deletion
                try {
                    const fileService = registry ? registry.get('FileService') : null;
                    if (fileService && fileService.lrfs && fileService.lrfs.driver && typeof fileService.lrfs.driver.close === 'function') {
                        fileService.lrfs.driver.close();
                    }
                } catch (e) {
                    console.warn('[Recovery] FileService close note:', e.message);
                }

                // 2. Destroy volumes via VirtualDiskService if registered
                try {
                    const vds = registry ? registry.get('VirtualDiskService') : null;
                    if (vds && typeof vds.destroyVolume === 'function') {
                        await vds.destroyVolume('lde27_indexeddb_disk');
                        await vds.destroyVolume('lde_indexeddb_disk');
                    }
                } catch (e) {
                    console.warn('[Recovery] VirtualDiskService destroy note:', e.message);
                }

                // 3. Forcefully delete all IndexedDB databases
                if (window.indexedDB) {
                    const targets = ['lde27_indexeddb_disk', 'lde_indexeddb_disk', 'disk_store'];
                    if (typeof indexedDB.databases === 'function') {
                        try {
                            const dbs = await indexedDB.databases();
                            for (const db of dbs) {
                                if (db && db.name && !targets.includes(db.name)) {
                                    targets.push(db.name);
                                }
                            }
                        } catch (e) {
                            console.warn('[Recovery] IndexedDB databases enumeration note:', e.message);
                        }
                    }

                    for (const dbName of targets) {
                        await new Promise((res) => {
                            try {
                                const req = indexedDB.deleteDatabase(dbName);
                                req.onsuccess = () => res(true);
                                req.onerror = () => res(false);
                                req.onblocked = () => {
                                    console.warn(`[Recovery] IndexedDB delete blocked for database: ${dbName}`);
                                    res(false);
                                };
                                setTimeout(() => res(false), 250);
                            } catch (e) {
                                res(false);
                            }
                        });
                    }
                }

                // 4. Force clear LocalStorage and SessionStorage
                try {
                    localStorage.clear();
                    sessionStorage.clear();
                } catch (e) {
                    console.warn('[Recovery] LocalStorage clear note:', e.message);
                }
            };

            const btn = viewport.querySelector('#btn-recovery-continue');
            if (btn) {
                btn.onclick = async (e) => {
                    if (e) e.preventDefault();
                    const selectedRadio = viewport.querySelector('input[name="recovery-mode"]:checked');
                    const mode = selectedRadio ? selectedRadio.value : 'reboot';

                    console.log(`[Recovery] Continue clicked. Mode selected: ${mode}`);
                    const dialogService = registry ? registry.get('DialogService') : null;

                    if (mode === 'reboot') {
                        console.log('[Recovery] Executing reboot...');
                        executeReboot();
                    } else if (mode === 'reset') {
                        console.log('[Recovery] Prompting reset confirmation via shell dialog...');
                        let confirmed = false;
                        if (dialogService && typeof dialogService.confirm === 'function') {
                            try {
                                confirmed = await dialogService.confirm(
                                    'Resetting this PC will permanently erase all user accounts, installed applications, system settings, and local files. Proceed?',
                                    'Reset PC Confirmation'
                                );
                                console.log('[Recovery] DialogService confirmation result:', confirmed);
                            } catch (err) {
                                console.warn('[Recovery] DialogService.confirm threw error, falling back to window.confirm:', err);
                                confirmed = window.confirm('Resetting this PC will permanently erase all user accounts, installed applications, system settings, and local files. Proceed?');
                            }
                        } else {
                            console.warn('[Recovery] DialogService unavailable, falling back to window.confirm');
                            confirmed = window.confirm('Resetting this PC will permanently erase all user accounts, installed applications, system settings, and local files. Proceed?');
                        }

                        if (confirmed) {
                            console.log('[Recovery] Reset confirmed! Initiating full storage wipe...');
                            await wipeAllStorage();
                            console.log('[Recovery] Storage wipe complete. Executing system reboot...');
                            executeReboot();
                        } else {
                            console.log('[Recovery] Reset cancelled by user.');
                        }
                    }
                };
            }
        });
    }
};
