/**
 * virtualDiskCreatedStep.js
 * Confirmation step when a virtual disk has been successfully created.
 */
export const virtualDiskCreatedStep = {
    id: 'virtualDiskCreated',
    render: (ctx) => {
        const drive = ctx.createdDrive || { name: 'Lark', backend: 'LocalStorage' };
        const caps = ctx.storageCapabilities;
        return `
            <div class="shell-extras-icon-design">
                <i>&#xE73E;</i>
            </div>
            <h1>Virtual Disk created</h1>
            <p>You are using a ${caps.browserName} browser, capable of using up to ${typeof caps.estimatedQuotaMb === 'number' ? (caps.estimatedQuotaMb > 1024 ? (caps.estimatedQuotaMb / 1024).toFixed(1) + ' GB' : caps.estimatedQuotaMb + ' MB') : 'unspecified browser storage quota'}.</p>
            <div class="omni-card-v" style="align-items: start">
                <div class="layout-h">
                    <div class="to48px">
                        <img src="hdd.webp" alt="Disk">
                    </div>
                    <div class="layout-v">
                        <p><strong>${drive.name}</strong></p>
                        <small>${drive.backend === 'IndexedDB' ? (typeof caps.estimatedQuotaMb === 'number' ? (caps.estimatedQuotaMb > 1024 ? (caps.estimatedQuotaMb / 1024).toFixed(1) + ' GB Quota' : caps.estimatedQuotaMb + ' MB Quota') : 'Quota Unspecified') : 'Local Storage'}</small>
                    </div>
                </div>
            </div>
            <small>For convenience this was implemented, therefore this part no longer simulates the os architecture.</small>
            <button type="button" id="btn-created-proceed">Yes, Proceed</button>
        `;
    },
    bind: (container, ctx, env) => {
        const btn = container.querySelector('#btn-created-proceed');
        if (btn) {
            btn.onclick = () => env.jumpToStep('diskCheck');
        }
    }
};
