/**
 * Lock Screen Platform Environment
 *
 * Responsibility:
 * Displays a fullscreen overlay to prevent interaction until authentication succeeds.
 */
export default {
    run: async (registry) => {
        const PowerService = registry.get('PowerService');
        const SessionService = registry.get('SessionService');

        const session = SessionService.getCurrentSession();
        const username = session ? session.user.username : 'Unknown';

        const container = document.getElementById('platform-host');
        const lockEl = document.createElement('div');
        lockEl.id = 'lock-container';
        lockEl.className = 'lde-shell';

        container.appendChild(lockEl);

        const card = document.createElement('div');
        card.className = 'lde-card lde-centered-layout';
        card.style.width = '350px';

        const cleanup = () => {
            lockEl.remove();
        };

        const title = document.createElement('h3');
        title.textContent = `Locked by ${username}`;
        title.style.marginBottom = '20px';

        const unlockBtn = document.createElement('button');
        unlockBtn.textContent = 'Unlock Session';
        unlockBtn.className = 'lde-btn lde-btn-primary mb-8';
        unlockBtn.style.width = '100%';

        const switchBtn = document.createElement('button');
        switchBtn.textContent = 'Switch User';
        switchBtn.className = 'lde-btn mb-8';
        switchBtn.style.width = '100%';

        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Log Out';
        logoutBtn.className = 'lde-btn lde-btn-danger';
        logoutBtn.style.width = '100%';

        unlockBtn.onclick = () => {
            const unlocked = PowerService.unlock();
            if (unlocked) {
                cleanup();
            }
        };

        switchBtn.onclick = () => {
            const sessionService = registry.get('SessionService');
            if (sessionService) {
                sessionService.suspendActiveSession();
                cleanup();
            }
        };

        logoutBtn.onclick = async () => {
            const DialogService = registry.get('DialogService');
            if (DialogService) {
                const confirm = await DialogService.confirm('Are you sure you want to log out? Unsaved work will be lost.', 'Confirm Logout');
                if (confirm) {
                    PowerService.logout();
                    cleanup();
                }
            } else {
                PowerService.logout();
                cleanup();
            }
        };

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'v-layout flex-gap-8 w-full';

        buttonContainer.appendChild(unlockBtn);
        buttonContainer.appendChild(switchBtn);
        buttonContainer.appendChild(logoutBtn);

        card.appendChild(title);
        card.appendChild(buttonContainer);

        lockEl.appendChild(card);
    }
};
