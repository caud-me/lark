/**
 * Phase 17: Shutdown App
 * 
 * Responsibility: Displays the windowed shutdown screen.
 */
export default {
    run: async (registry, pid) => {
        const WindowService = registry.get('WindowService');

        const win = WindowService.createWindow({
            title: 'System Halted',
            width: 400,
            height: 200,
            pid,
            closable: false,
            movable: false,
            resizable: false
        });

        win.contentElement.className = 'lde-app-container lde-centered-layout p-32 bg-base';

        const title = document.createElement('h2');
        title.textContent = 'System Powered Off';
        title.className = 'mb-20';

        const text = document.createElement('p');
        text.textContent = 'You may now safely close the browser tab.';
        text.className = 'text-secondary';

        win.contentElement.appendChild(title);
        win.contentElement.appendChild(text);
    }
};
