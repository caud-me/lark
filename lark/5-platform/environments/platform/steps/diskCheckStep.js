/**
 * diskCheckStep.js
 * Installation disk selection step with radio buttons, remove disk confirmation, and target disk activation.
 */
export const diskCheckStep = {
    id: 'diskCheck',
    onEnter: async (ctx, env) => {
        const registry = env ? env.registry : null;
        const storageDiscovery = registry ? registry.get('StorageDiscoveryService') : null;
        if (storageDiscovery) {
            ctx.availableDisks = await storageDiscovery.discoverDisks();
        } else {
            ctx.availableDisks = [];
        }

        // Surface all pending unprovisioned disks configured in the wizard.
        ctx.pendingDisks = ctx.pendingDisks || (ctx.pendingDisk ? [ctx.pendingDisk] : []);
        ctx.pendingDisks.forEach(pDisk => {
            if (!ctx.availableDisks.some(d => (d.id === pDisk.id && d.id !== null) || (d.name === pDisk.name && d.type === pDisk.type))) {
                ctx.availableDisks.unshift({ ...pDisk, id: null, freeSpace: 'Pending — not yet provisioned' });
            }
        });

        if (ctx.availableDisks.length > 0) {
            if (!ctx.selectedDisk || !ctx.availableDisks.some(d => d.id === ctx.selectedDisk.id && d.name === ctx.selectedDisk.name)) {
                ctx.selectedDisk = ctx.availableDisks[0];
            }
        } else {
            ctx.selectedDisk = null;
        }
    },
    render: (ctx) => {
        const hasDisks = ctx.availableDisks && ctx.availableDisks.length > 0;
        let radioOptionsHtml = '';

        if (hasDisks) {
            radioOptionsHtml = `
                <div class="radio">
                    ${ctx.availableDisks.map((d, idx) => {
                        const optKey = (d.id !== null && d.id !== undefined) ? String(d.id) : `pending-${d.name}-${d.type}`;
                        const isChecked = ctx.selectedDisk && ((d.id && ctx.selectedDisk.id === d.id) || (ctx.selectedDisk.name === d.name && ctx.selectedDisk.type === d.type)) ? 'checked' : '';
                        return `
                            <div class="layout-h">
                                <input type="radio" id="disk-opt-${idx}" name="selectedDiskOpt" value="${optKey}" ${isChecked}>
                                <div class="layout-v">
                                    <label for="disk-opt-${idx}"><strong>${d.name}</strong> (${d.type})</label>
                                    <small>${d.freeSpace}</small>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else {
            radioOptionsHtml = `
                <small>No active virtual drives found in storage.</small>
            `;
        }

        return `
            <div class="shell-extras-icon-design">
                <i>&#xE75C;</i>
            </div>
            <h1>Is this the right installation disk?</h1>
            <p>Based from Lark's core indexing, if no virtual drives are present, click 'Create new virtual disk...'</p>
            <h3>Virtual Disks</h3>
            <div class="omni-card-v">
                ${radioOptionsHtml}
            </div>
            <div class="layout-h">
                <button type="button" class="btn-create-disk-option">Create new virtual disk...</button>
                ${hasDisks && ctx.selectedDisk ? '<button type="button" id="btn-remove-disk">Remove disk</button>' : ''}
            </div>
            ${hasDisks ? '<button type="button" id="btn-disk-proceed" style="margin-top: 12px;">Yes, Proceed</button>' : ''}
        `;
    },
    bind: (container, ctx, env) => {
        const radioGroup = container.querySelectorAll('input[name="selectedDiskOpt"]');
        radioGroup.forEach(radio => {
            radio.onchange = (e) => {
                const selectedKey = e.target.value;
                ctx.selectedDisk = ctx.availableDisks.find(d => {
                    const key = (d.id !== null && d.id !== undefined) ? String(d.id) : `pending-${d.name}-${d.type}`;
                    return key === selectedKey;
                }) || ctx.selectedDisk;
                env._notifyStepChanged();
            };
        });

        const createBtn = container.querySelector('.btn-create-disk-option');
        if (createBtn) {
            createBtn.onclick = () => env.jumpToStep('createDiskWizard');
        }

        const removeBtn = container.querySelector('#btn-remove-disk');
        if (removeBtn) {
            removeBtn.onclick = async () => {
                if (!ctx.selectedDisk) return;
                const registry = env.registry;
                const dialogService = registry ? registry.get('DialogService') : null;
                const virtualDiskService = registry ? registry.get('VirtualDiskService') : null;

                let confirmDelete = true;
                if (dialogService) {
                    try {
                        confirmDelete = await dialogService.confirm(
                            `Are you sure you want to remove virtual disk "${ctx.selectedDisk.name}" (${ctx.selectedDisk.type})? All data on this drive will be permanently lost.`,
                            'Remove Virtual Disk Warning'
                        );
                    } catch (e) {
                        confirmDelete = true;
                    }
                }

                if (!confirmDelete) return;

                if (ctx.selectedDisk.id) {
                    if (virtualDiskService) {
                        const wipeResult = await virtualDiskService.wipeDisk(ctx.selectedDisk.id);
                        if (wipeResult && wipeResult.status !== 'success') {
                            if (dialogService) {
                                if (wipeResult.status === 'blocked') {
                                    await dialogService.alert(
                                        `Virtual disk "${ctx.selectedDisk.name}" is currently in use by another open browser tab or inspector connection. Please close other connections and try again.`,
                                        'Disk In Use'
                                    );
                                } else {
                                    await dialogService.alert(`Failed to remove virtual disk "${ctx.selectedDisk.name}".`, 'Deletion Error');
                                }
                            }
                            return;
                        }
                    }
                } else {
                    // Pending unprovisioned disk removed
                    ctx.pendingDisk = null;
                    ctx.createdDrive = null;
                }

                ctx.selectedDisk = null;
                const storageDiscovery = registry ? registry.get('StorageDiscoveryService') : null;
                if (storageDiscovery) {
                    ctx.availableDisks = await storageDiscovery.discoverDisks();
                }
                env._notifyStepChanged();
            };
        }

        const proceedBtn = container.querySelector('#btn-disk-proceed');
        if (proceedBtn) {
            proceedBtn.onclick = async () => {
                if (!ctx.selectedDisk) return;
                const registry = env.registry;
                const dialogService = registry ? registry.get('DialogService') : null;
                const virtualDiskService = registry ? registry.get('VirtualDiskService') : null;
                const fileService = registry ? registry.get('FileService') : null;

                let confirmWipe = true;
                if (dialogService) {
                    try {
                        confirmWipe = await dialogService.confirm(
                            `Installing Lark OS on "${ctx.selectedDisk.name}" (${ctx.selectedDisk.type}) will format the disk and write system files. Continue?`,
                            'Install Lark OS Warning'
                        );
                    } catch (e) {
                        confirmWipe = true;
                    }
                }

                if (!confirmWipe) return;

                try {
                    if (virtualDiskService) {
                        const isPending = !ctx.selectedDisk.id;

                        if (!isPending) {
                            // Existing disk: wipe it first so installation starts clean
                            const wipeResult = await virtualDiskService.wipeDisk(ctx.selectedDisk.id);
                            if (wipeResult && wipeResult.status === 'blocked' && dialogService) {
                                await dialogService.alert(
                                    `Formatting disk "${ctx.selectedDisk.name}" was blocked by an open connection. Please close other browser tabs/inspectors and try again.`,
                                    'Format Blocked'
                                );
                                return;
                            }
                        }

                        // Provision a fresh volume and activate it using the real new ID.
                        const provisionResult = await virtualDiskService.provisionVolume({
                            name: ctx.selectedDisk.name,
                            type: ctx.selectedDisk.type
                        });
                        if (!provisionResult || !provisionResult.success) {
                            console.error('[diskCheckStep] Failed to provision new volume:', provisionResult);
                            return;
                        }
                        await virtualDiskService.activateVolume(provisionResult.data);
                        // Update ctx with the real provisioned disk (has its id now)
                        ctx.selectedDisk = provisionResult.data;
                        ctx.pendingDisk = null;
                    }

                    if (fileService) {
                        const systemContext = { identity: 'system', role: 'SYSTEM' };
                        try {
                            if (!fileService.exists('/system', { context: systemContext })) {
                                await fileService.createDirectory('/system', { context: systemContext });
                            }
                        } catch (e) {
                            console.warn('[diskCheckStep] System directory creation note:', e.message);
                        }

                        try {
                            fileService.writeFile('/system/installation.json', JSON.stringify({
                                installed: true,
                                oobeCompleted: false,
                                setupCompleted: false,
                                disk: ctx.selectedDisk
                            }), { context: systemContext });
                        } catch (e) {
                            console.error('[diskCheckStep] Error writing installation file:', e);
                        }
                    }
                } catch (err) {
                    console.error('[diskCheckStep] Installation preparation error:', err);
                }

                await env.jumpToStep('installedConfirmation');
            };
        }
    }
};
