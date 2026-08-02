/**
 * createDiskWizardStep.js
 * Virtual disk creation wizard for selecting storage backend (LocalStorage vs IndexedDB) and disk name.
 */
export const createDiskWizardStep = {
    id: 'createDiskWizard',
    onEnter: async (ctx, env) => {
        const registry = env ? env.registry : null;
        const storageDiscovery = registry ? registry.get('StorageDiscoveryService') : null;
        if (storageDiscovery) {
            ctx.storageCapabilities = await storageDiscovery.estimateCapabilities();
            ctx.availableDisks = await storageDiscovery.discoverDisks();
        }
    },
    render: (ctx) => {
        const caps = ctx.storageCapabilities || { browserName: 'Browser', estimatedQuotaMb: null };
        const pendingList = ctx.pendingDisks || (ctx.pendingDisk ? [ctx.pendingDisk] : []);
        const hasIDBDisk = (ctx.availableDisks || []).some(d => d.type === 'IndexedDB') || pendingList.some(d => d.type === 'IndexedDB');
        return `
            <div class="shell-extras-icon-design">
                <i>&#xE710;</i>
            </div>
            <h1>Create new virtual disk</h1>
            <p>Configure storage backend and volume parameters for your new virtual disk.</p>
            <h3>Storage Source</h3>
            <div class="radio">
                <div class="layout-h">
                    <input type="radio" id="storage-local" name="storageBackend" value="LocalStorage" checked>
                    <div class="layout-v">
                        <label for="storage-local">Local Storage</label>
                        <small>LocalStorage is a simple, synchronous key-value store meant for tiny amounts of lightweight string data.</small>
                        <small>Capable of storing up to 5MB max, may vary depending on browser and device used.</small>
                    </div>
                </div>
                <div class="layout-h">
                    <input type="radio" id="storage-idb" name="storageBackend" value="IndexedDB" ${hasIDBDisk ? 'disabled' : ''}>
                    <div class="layout-v">
                        <label for="storage-idb">IndexedDB ${hasIDBDisk ? '(1 max limit reached)' : ''}</label>
                        <small>${hasIDBDisk ? 'An IndexedDB virtual drive already exists in disk selection. Remove it to create a new IndexedDB volume.' : 'IndexedDB is a powerful, asynchronous transactional database capable of storing massive datasets.'}</small>
                        <small>You are using ${caps.browserName}, capable of storing up to ${typeof caps.estimatedQuotaMb === 'number' ? (caps.estimatedQuotaMb > 1024 ? (caps.estimatedQuotaMb / 1024).toFixed(1) + ' GB' : caps.estimatedQuotaMb + ' MB') : 'unspecified browser storage quota'}.</small>
                    </div>
                </div>
            </div>
            <input type="text" id="input-drivename" name="drivename" placeholder="Name this virtual drive">

            <small>For convenience this was implemented, therefore this part no longer simulates the os architecture.</small>
            <div class="layout-h">
                <button type="button" id="btn-create-back">Back</button>
                <button type="button" id="btn-create-disk-submit">Yes, Proceed</button>
            </div>
        `;
    },
    bind: (container, ctx, env) => {
        const backBtn = container.querySelector('#btn-create-back');
        if (backBtn) {
            backBtn.onclick = () => env.jumpToStep('diskCheck');
        }

        const submitBtn = container.querySelector('#btn-create-disk-submit');
        if (submitBtn) {
            submitBtn.onclick = async () => {
                const nameInput = container.querySelector('#input-drivename');
                const driveName = nameInput ? nameInput.value.trim() || 'Lark' : 'Lark';
                const selectedRadio = container.querySelector('input[name="storageBackend"]:checked');
                const backend = selectedRadio ? selectedRadio.value : 'LocalStorage';

                const newPendingDisk = { name: driveName, type: backend, id: null };
                ctx.pendingDisks = ctx.pendingDisks || (ctx.pendingDisk ? [ctx.pendingDisk] : []);
                ctx.pendingDisks.push(newPendingDisk);
                ctx.pendingDisk = newPendingDisk;
                ctx.createdDrive = { name: driveName, backend };
                env.jumpToStep('virtualDiskCreated');
            };
        }
    }
};
