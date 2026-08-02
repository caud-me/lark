import { EventBus } from '../../../../1-kernel/SystemEventBus.js';

/**
 * setupCompleteStep.js
 * OOBE Step 5: Final completion step emitting system.setup.completed event.
 */
export const setupCompleteStep = {
    id: 'setupComplete',
    onEnter: async (ctx, env) => {
        const registry = env ? env.registry : null;
        const fileService = registry ? registry.get('FileService') : null;
        if (fileService) {
            try {
                const systemContext = { identity: 'system', role: 'SYSTEM' };
                const rawInst = fileService.readFile('/system/installation.json', { context: systemContext });
                if (rawInst) {
                    const instData = JSON.parse(rawInst);
                    if (instData && instData.disk) {
                        ctx.selectedDisk = instData.disk;
                    }
                }
            } catch (e) {
                console.warn('[setupCompleteStep] Installation metadata parse note:', e.message);
            }
        }
    },
    render: (ctx, env) => {
        let storageEngine = 'LocalStorage';
        let diskName = 'Virtual Drive';

        const registry = env ? env.registry : null;
        const fileService = registry ? registry.get('FileService') : null;
        if (fileService && fileService.lrfs && fileService.lrfs.driver) {
            if (fileService.lrfs.driver.constructor.name === 'IndexedDBStorageDriver') {
                storageEngine = 'IndexedDB';
            }
        }

        if (ctx.selectedDisk) {
            storageEngine = ctx.selectedDisk.type || ctx.selectedDisk.backend || storageEngine;
            diskName = ctx.selectedDisk.name || diskName;
        }

        return `
            <div class="shell-extras-icon-design">
                <i>&#xE73E;</i>
            </div>
            <h1>Setup Complete</h1>
            <p>Setup is complete! Restart your device to start using Lark OS.</p>

            <button type="button" id="btn-setup-finish">Restart</button>
        `;
    },
    bind: (container, ctx, env) => {
        const btn = container.querySelector('#btn-setup-finish');
        if (btn) {
            btn.onclick = async () => {
                const registry = env ? env.registry : null;
                const userService = registry ? registry.get('UserService') : null;
                // User creation is handled by BootOrchestrator via the system.setup.completed event.

                EventBus.emit('system.setup.completed', {
                    severity: 'Info',
                    source: 'SetupEnvironment',
                    message: 'Setup completed successfully.',
                    data: {
                        account: ctx.userAccount,
                        disk: ctx.selectedDisk || ctx.createdDrive,
                        visualEffectsEnabled: Boolean(ctx.visualEffectsEnabled)
                    }
                });
            };
        }
    }
};
