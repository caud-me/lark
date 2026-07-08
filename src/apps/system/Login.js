import { SYSTEM_INFO } from '../../system/SystemVersion.js';

/**
 * Login Application
 *
 * Responsibility:
 * Provides the user authentication interface and handles session initiation.
 *
 * Does NOT:
 * - Validate credentials internally (uses SessionService)
 */
export default {
    run: async (registry, pid) => {
        const WindowService = registry.get('WindowService');
        const UserService = registry.get('UserService');
        const SessionService = registry.get('SessionService');
        const ProcessService = registry.get('ProcessService');
        const AppService = registry.get('AppService');
        const DialogService = registry.get('DialogService');

        if (!WindowService || !UserService || !SessionService || !ProcessService || !AppService || !DialogService) {
            console.error('[Login] Required services missing.');
            return;
        }

        const win = WindowService.createWindow({
            title: `${SYSTEM_INFO.name} Login`,
            width: 450,
            height: 380,
            pid,
            closable: false,
            resizable: false
        });

        win.contentElement.className = 'lde-app-container lde-centered-layout';
        win.contentElement.style.padding = '48px';
        win.contentElement.style.backgroundColor = 'var(--lde-bg-surface-elevated)';

        const users = UserService.getUsers();

        if (users.length === 0) {
            win.contentElement.innerHTML = `
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="font-size: 3.5rem; margin-bottom: 16px;">🌌</div>
                    <h2 style="font-size: 1.5rem; font-weight: 600; color: var(--lde-text-primary); margin-bottom: 8px;">Welcome to ${SYSTEM_INFO.name}</h2>
                    <div style="color: var(--lde-text-secondary); font-size: 0.875rem;">Create your first local account to begin.</div>
                </div>
                <div style="width: 100%; max-width: 300px; display: flex; flex-direction: column; gap: 16px;">
                    <input type="text" id="login-username-input" class="lde-input" placeholder="Username" style="text-align: center;" />
                    <button id="login-create-btn" class="lde-btn lde-btn-primary" style="padding: 12px;">Create Account & Login</button>
                </div>
            `;

            win.contentElement.querySelector('#login-create-btn').onclick = async () => {
                const input = win.contentElement.querySelector('#login-username-input');
                const username = input.value.trim();
                if (username) {
                    try {
                        UserService.createUser(username, username);
                        SessionService.login(username);
                        const startupApps = AppService.getStartupApps();
                        startupApps.forEach(app => ProcessService.startProcess(app.id));
                        ProcessService.terminateProcess(pid);
                    } catch (e) {
                        await DialogService.alert(e.message, 'Login Error');
                    }
                }
            };
        } else {
            win.contentElement.innerHTML = `
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="font-size: 3.5rem; margin-bottom: 16px;">🌌</div>
                    <h2 style="font-size: 1.5rem; font-weight: 600; color: var(--lde-text-primary); margin-bottom: 8px;">Select User</h2>
                    <div style="color: var(--lde-text-secondary); font-size: 0.875rem;">${SYSTEM_INFO.name}</div>
                </div>
                <div id="login-user-list" style="width: 100%; max-width: 300px; display: flex; flex-direction: column; gap: 12px; max-height: 150px; overflow-y: auto; padding: 4px;">
                </div>
            `;

            const listContainer = win.contentElement.querySelector('#login-user-list');
            users.forEach(u => {
                const btn = document.createElement('button');
                btn.textContent = u.displayName || u.username;
                btn.className = 'lde-btn';
                btn.style.padding = '12px';
                btn.style.fontSize = '1rem';
                btn.style.fontWeight = '500';

                btn.onclick = async () => {
                    try {
                        SessionService.login(u.username);
                        const startupApps = AppService.getStartupApps();
                        startupApps.forEach(app => ProcessService.startProcess(app.id));
                        ProcessService.terminateProcess(pid);
                    } catch (e) {
                        await DialogService.alert(e.message, 'Login Error');
                    }
                };
                listContainer.appendChild(btn);
            });
        }
    }
};
