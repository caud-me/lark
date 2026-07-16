import { SYSTEM_INFO } from '../../../system/SystemVersion.js';
import { EventBus } from '../../../kernel/SystemEventBus.js';

/**
 * Login Environment UI
 *
 * Responsibility:
 * Provides the user authentication interface and handles session initiation.
 * Listens for semantic user events to refresh dynamically.
 */
export default {
    run: async (registry) => {
        const UserService = registry.get('UserService');
        const SessionService = registry.get('SessionService');
        const UserProfileService = registry.get('UserProfileService');
        const ApplicationService = registry.get('ApplicationService');
        const DialogService = registry.get('DialogService');
        const RecoveryService = registry.get('RecoveryService');

        if (!UserService || !SessionService || !ApplicationService || !DialogService) {
            console.error('[Login] Required services missing.');
            return;
        }

        const container = document.getElementById('platform-host');
        const loginEl = document.createElement('div');
        loginEl.id = 'login-container';
        loginEl.className = 'lde-shell';

        container.appendChild(loginEl);

        const card = document.createElement('div');
        card.className = 'lde-card lde-centered-layout';
        card.style.padding = '48px';
        card.style.width = '400px';
        card.style.height = '480px';

        loginEl.appendChild(card);

        const onUsersChanged = () => { renderUI(); };

        const cleanup = () => {
            EventBus.off('user.created', onUsersChanged);
            EventBus.off('user.deleted', onUsersChanged);
            EventBus.off('user.profile.changed', onUsersChanged);
            loginEl.remove();
        };

        const renderUI = () => {
            const users = UserService.getUsers();

            if (users.length === 0) {
                card.innerHTML = `
                    <div style="text-align: center; margin-bottom: 32px;">
                        <div style="font-size: 3.5rem; margin-bottom: 16px;">👤</div>
                        <h2 style="font-size: 1.5rem; font-weight: 600; color: var(--lde-text-primary); margin-bottom: 8px;">Welcome to ${SYSTEM_INFO.name}</h2>
                        <div style="color: var(--lde-text-secondary); font-size: 12px;">Create your first local account to begin.</div>
                    </div>
                    <div style="width: 100%; max-width: 300px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px;">
                        <input type="text" id="login-username-input" class="lde-input" placeholder="Username" style="text-align: center;" />
                        <button id="login-create-btn" class="lde-btn lde-btn-primary" style="padding: 12px;">Create Account & Login</button>
                    </div>
                `;

                card.querySelector('#login-create-btn').onclick = async () => {
                    const input = card.querySelector('#login-username-input');
                    const username = input.value.trim();
                    if (username) {
                        try {
                            UserService.createUser(username, username);
                            SessionService.login(username);
                            cleanup();
                        } catch (e) {
                            await DialogService.alert(e.message, 'Login Error');
                        }
                    }
                };
            } else {
                card.innerHTML = `
                    <div style="text-align: center; margin-bottom: 32px;">
                        <div style="font-size: 3.5rem; margin-bottom: 16px;">🔐</div>
                        <h2 style="font-size: 1.5rem; font-weight: 600; color: var(--lde-text-primary); margin-bottom: 8px;">Authentication</h2>
                        <div style="color: var(--lde-text-secondary); font-size: 12px;">Select an account to log in</div>
                    </div>
                    <div id="login-user-list" style="width: 100%; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; padding-right: 4px;">
                    </div>
                `;

                const listContainer = card.querySelector('#login-user-list');
                const sessions = SessionService.getSessions ? SessionService.getSessions() : [];
                
                const lastActiveUser = SessionService.getLastActiveUser ? SessionService.getLastActiveUser() : null;
                const sortedUsers = [...users].sort((a, b) => {
                    if (a.username === lastActiveUser) return -1;
                    if (b.username === lastActiveUser) return 1;
                    return 0;
                });
                
                sortedUsers.forEach(u => {
                    if (u.username === 'system') return;

                    const profile = UserProfileService ? UserProfileService.getProfile(u.username) : null;
                    const displayName = profile ? profile.displayName : (u.displayName || u.username);
                    
                    const existingSession = sessions.find(s => s.user.username === u.username);
                    const isSuspended = existingSession && existingSession.status === 'SUSPENDED';
                    
                    const avatar = (profile && profile.avatar) ? profile.avatar : '👤';

                    const btn = document.createElement('button');
                    btn.className = 'lde-btn';
                    btn.style.display = 'flex';
                    btn.style.justifyContent = 'space-between';
                    btn.style.alignItems = 'center';
                    btn.style.padding = '12px 16px';
                    
                    const signedInIndicator = isSuspended ? '<span style="font-size: 11px; color: var(--lde-success); font-weight: bold;">Signed In</span>' : '';

                    btn.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 16px;">${avatar}</span>
                            <span style="font-weight: 500;">${displayName}</span>
                        </div>
                        ${signedInIndicator}
                    `;

                    btn.onclick = async () => {
                        try {
                            const userRecord = UserService.getUser(u.username);
                            if (userRecord && userRecord.passwordInitialized && userRecord.passwordHash) {
                                const password = await DialogService.prompt('Enter your password:', '', 'Login Required', 'password');
                                if (password === null) return; // User cancelled
                                if (password !== userRecord.passwordHash) {
                                    await DialogService.alert('Incorrect password.', 'Login Error');
                                    return;
                                }
                            }

                            SessionService.login(u.username);
                            cleanup();
                        } catch (e) {
                            await DialogService.alert(e.message, 'Login Error');
                        }
                    };
                    listContainer.appendChild(btn);
                });
            }
        };

        renderUI();

        EventBus.on('user.created', onUsersChanged);
        EventBus.on('user.deleted', onUsersChanged);
        EventBus.on('user.profile.changed', onUsersChanged);
    }
};
