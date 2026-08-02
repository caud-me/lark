/**
 * installedConfirmationStep.js
 * Installation completed confirmation step asking user to restart.
 */
export const installedConfirmationStep = {
    id: 'installedConfirmation',
    render: (ctx) => {
        const disk = ctx.selectedDisk || { name: 'LRFS Disk', type: 'LocalStorage' };
        return `
            <div class="shell-extras-icon-design">
                <i>&#xE73E;</i>
            </div>
            <h1>Lark OS installed on this disk</h1>
            <p>System installation files have been successfully written to <strong>${disk.name}</strong> (${disk.type}).</p>

            <button type="button" id="btn-restart-now" style="margin-top: 16px;">Restart now</button>
        `;
    },
    bind: (container) => {
        const btn = container.querySelector('#btn-restart-now');
        if (btn) {
            btn.onclick = () => {
                window.location.reload();
            };
        }
    }
};
