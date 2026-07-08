/**
 * Lock Screen Application
 *
 * Responsibility:
 * Displays a fullscreen overlay to prevent interaction until authentication succeeds.
 *
 * Does NOT:
 * - Block input globally (handled by InputPolicy)
 */
export default {
    run: async (registry, pid) => {
        const WindowService = registry.get('WindowService');
        const PowerService = registry.get('PowerService');
        const SessionService = registry.get('SessionService');

        const session = SessionService.getCurrentSession();
        const username = session ? session.user.username : 'Unknown';

        const win = WindowService.createWindow({
            title: 'Session Locked',
            width: 350,
            height: 250,
            pid,
            closable: false,
            movable: false,
            resizable: false,
            inputPolicy: 'lockAllowed'
        });

        win.contentElement.className = 'lde-app-container lde-centered-layout p-32 bg-base';

        const title = document.createElement('h3');
        title.textContent = `Locked by ${username}`;
        title.className = 'mb-20';

        const unlockBtn = document.createElement('button');
        unlockBtn.textContent = 'Unlock Session';
        unlockBtn.className = 'lde-btn lde-btn-primary';

        unlockBtn.onclick = () => {
            PowerService.unlock();
            const ProcessService = registry.get('ProcessService');
            if (ProcessService) {
                ProcessService.terminateProcess(pid);
            }
        };

        win.contentElement.appendChild(title);
        win.contentElement.appendChild(unlockBtn);
    }
};
