export default {
    run: async (registry, pid) => {
        const WindowService = registry.get('WindowService');
        const DialogService = registry.get('DialogService');
        if (!WindowService) return;

        const win = WindowService.createWindow({
            title: 'Dialog Example',
            width: 400,
            height: 200,
            pid
        });

        win.contentElement.innerHTML = `
            <div style="padding: 20px; display: flex; flex-direction: column; gap: 10px;">
                <p>Click below to show a native dialog.</p>
                <button id="btn-alert">Show Alert</button>
                <button id="btn-confirm">Show Confirm</button>
                <div id="result"></div>
            </div>
        `;

        win.contentElement.querySelector('#btn-alert').addEventListener('click', async () => {
            if (DialogService) {
                await DialogService.alert('This is an alert from the system dialog provider.', 'Alert');
            }
        });

        win.contentElement.querySelector('#btn-confirm').addEventListener('click', async () => {
            if (DialogService) {
                const result = await DialogService.confirm('Do you accept the terms?', 'Confirm');
                win.contentElement.querySelector('#result').textContent = `Result: ${result}`;
            }
        });
    }
};
