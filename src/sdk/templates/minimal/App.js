export default {
    run: async (registry, pid) => {
        const WindowService = registry.get('WindowService');
        if (!WindowService) return;

        const win = WindowService.createWindow({
            title: 'Minimal App',
            width: 400,
            height: 300,
            pid
        });

        win.contentElement.innerHTML = `
            <div style="padding: 20px; display: flex; align-items: center; justify-content: center; height: 100%;">
                <h1>Hello, Lark OS!</h1>
            </div>
        `;
    }
};
