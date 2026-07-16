import { SYSTEM_INFO } from '../../../system/SystemVersion.js';

/**
 * Welcome (User Initialization) Environment
 *
 * Responsibility:
 * Guides a newly created user through personalizing their account
 * on their very first login.
 *
 * Does NOT:
 * - Run as a standard process or inside a window frame.
 */
export default {
    run: async (registry, username) => {
        return new Promise(async (resolve) => {
            const UserService = registry.get('UserService');
            const UserProfileService = registry.get('UserProfileService');
            const UserSettingsService = registry.get('UserSettingsService');
            const DialogService = registry.get('DialogService');

            const container = document.getElementById('platform-host');
            const welcomeEl = document.createElement('div');
            welcomeEl.id = 'welcome-container';
            welcomeEl.style.position = 'absolute';
            welcomeEl.style.top = '0';
            welcomeEl.style.left = '0';
            welcomeEl.style.width = '100%';
            welcomeEl.style.height = '100%';
            welcomeEl.style.zIndex = '9999';
            welcomeEl.style.backgroundColor = 'var(--lde-bg-base)';
            welcomeEl.style.display = 'flex';
            welcomeEl.style.alignItems = 'center';
            welcomeEl.style.justifyContent = 'center';
            welcomeEl.style.padding = '48px';
            welcomeEl.style.boxSizing = 'border-box';

            container.appendChild(welcomeEl);

            // Centered Card Container
            const card = document.createElement('div');
            card.style.width = '600px';
            card.style.height = '420px';
            card.style.borderRadius = '12px';
            card.style.boxShadow = 'var(--lde-shadow-window-active)';
            card.style.backgroundColor = 'var(--lde-bg-surface)';
            card.style.border = '1px solid var(--lde-border)';
            card.style.overflow = 'hidden';
            card.style.display = 'flex';
            card.style.flexDirection = 'row';

            welcomeEl.appendChild(card);

            let currentStep = 0;
            const steps = [
                { id: 'welcome', label: 'Welcome' },
                { id: 'profile', label: 'Profile' },
                { id: 'summary', label: 'Done' }
            ];

            // Setup state
            let setupDisplayName = username;
            let setupAvatar = '👤';
            let setupHint = '';
            
            const avatars = ['👤', '🦊', '🐯', '🐼', '🐨', '🐙', '🦖', '🦄', '👽', '🤖'];

            const renderWizard = () => {
                const sidebar = `
                    <div style="width: 180px; background: var(--lde-bg-surface-elevated); border-right: 1px solid var(--lde-border); padding: 24px; display: flex; flex-direction: column; gap: 16px; box-sizing: border-box;">
                        <div style="font-size: 2rem; margin-bottom: 24px;">👋</div>
                        ${steps.map((s, i) => `
                            <div style="color: ${i === currentStep ? 'var(--lde-text-primary)' : 'var(--lde-text-tertiary)'}; font-weight: ${i === currentStep ? '600' : '400'}; font-size: 13px;">
                                ${s.label}
                            </div>
                        `).join('')}
                    </div>
                `;

                let content = '';
                if (currentStep === 0) { // Welcome
                    content = `
                        <h2 style="margin: 0 0 8px 0; font-size: 24px;">Welcome, ${username}!</h2>
                        <p style="color: var(--lde-text-secondary); margin: 0 0 24px 0; font-size: 13px;">Let's customize your profile settings.</p>
                        <p style="margin: 0 0 16px 0; line-height: 1.5; font-size: 14px;">This quick wizard will customize your personal settings before loading your desktop environment.</p>
                        <div style="flex-grow:1;"></div>
                        <div style="display:flex; justify-content:flex-end;">
                            <button id="welcome-next" class="lde-btn lde-btn-primary" style="padding: 8px 16px;">Next</button>
                        </div>
                    `;
                } else if (currentStep === 1) { // Profile Setup
                    content = `
                        <h2 style="margin: 0 0 8px 0; font-size: 24px;">Profile Customization</h2>
                        <p style="color: var(--lde-text-secondary); margin: 0 0 16px 0; font-size: 13px;">Choose your avatar and display name.</p>
                        
                        <div style="display: flex; flex-direction: column; gap: 12px; flex-grow: 1;">
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; padding: 8px; background: var(--lde-bg-surface-elevated); border: 1px solid var(--lde-border); border-radius: 6px;">
                                ${avatars.map(a => `
                                    <button class="avatar-select-btn" data-avatar="${a}" style="font-size: 24px; padding: 6px; border: ${a === setupAvatar ? '2px solid var(--lde-accent)' : '2px solid transparent'}; border-radius: 6px; background: transparent; cursor: pointer; outline: none;">${a}</button>
                                `).join('')}
                            </div>
                            <input type="text" id="welcome-displayname" class="lde-input w-full" placeholder="Display Name" value="${setupDisplayName}"/>
                            <input type="text" id="welcome-hint" class="lde-input w-full" placeholder="Password Hint" value="${setupHint}"/>
                        </div>
                        
                        <div style="display:flex; justify-content:space-between; margin-top: 16px;">
                            <button id="welcome-back" class="lde-btn" style="padding: 8px 16px;">Back</button>
                            <button id="welcome-next" class="lde-btn lde-btn-primary" style="padding: 8px 16px;">Next</button>
                        </div>
                    `;
                } else if (currentStep === 2) { // Summary / Finish
                    content = `
                        <h2 style="margin: 0 0 8px 0; font-size: 24px;">All Ready!</h2>
                        <p style="color: var(--lde-text-secondary); margin: 0 0 24px 0; font-size: 13px;">Review before loading your desktop.</p>
                        
                        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding: 12px; border: 1px solid var(--lde-border); border-radius: 8px; background: var(--lde-bg-surface-elevated);">
                            <div style="font-size: 48px;">${setupAvatar}</div>
                            <div>
                                <div style="font-weight: 600; font-size: 18px;">${setupDisplayName}</div>
                                <div style="color: var(--lde-text-secondary); font-size: 13px;">@${username}</div>
                            </div>
                        </div>
                        
                        <div style="flex-grow:1;"></div>
                        <div style="display:flex; justify-content:space-between; margin-top: 16px;">
                            <button id="welcome-back" class="lde-btn" style="padding: 8px 16px;">Back</button>
                            <button id="welcome-finish" class="lde-btn lde-btn-primary" style="padding: 8px 16px;">Go to Desktop</button>
                        </div>
                    `;
                }

                card.innerHTML = `
                    ${sidebar}
                    <div style="flex: 1; padding: 32px; display: flex; flex-direction: column; overflow-y: auto; box-sizing: border-box;">
                        ${content}
                    </div>
                `;

                // Avatar Click Handlers
                if (currentStep === 1) {
                    card.querySelectorAll('.avatar-select-btn').forEach(btn => {
                        btn.onclick = () => {
                            setupAvatar = btn.getAttribute('data-avatar');
                            card.querySelectorAll('.avatar-select-btn').forEach(b => {
                                b.style.border = b.getAttribute('data-avatar') === setupAvatar ? '2px solid var(--lde-accent)' : '2px solid transparent';
                            });
                        };
                    });
                }

                // Navigation Bindings
                const nextBtn = card.querySelector('#welcome-next');
                const backBtn = card.querySelector('#welcome-back');
                const finishBtn = card.querySelector('#welcome-finish');

                if (backBtn) {
                    backBtn.onclick = () => {
                        currentStep--;
                        renderWizard();
                    };
                }

                if (nextBtn) {
                    nextBtn.onclick = async () => {
                        if (currentStep === 1) {
                            const nameIn = card.querySelector('#welcome-displayname').value.trim();
                            const hintIn = card.querySelector('#welcome-hint').value.trim();
                            if (!nameIn) {
                                await DialogService.alert('Display Name is required.', 'Profile Error');
                                return;
                            }
                            setupDisplayName = nameIn;
                            setupHint = hintIn;
                        }
                        currentStep++;
                        renderWizard();
                    };
                }

                if (finishBtn) {
                    finishBtn.onclick = async () => {
                        // Persist preferences & finalize profile
                        try {
                            const systemContext = { identity: 'system', role: 'SYSTEM' };

                            // 1. Update user credentials and initialization flag
                            if (UserService) {
                                await UserService.updateUser(username, {
                                    displayName: setupDisplayName,
                                    passwordHint: setupHint,
                                    profileInitialized: true
                                }, { context: systemContext });
                            }

                            // 2. Set profile avatar in UserProfileService
                            if (UserProfileService) {
                                await UserProfileService.updateProfile(username, {
                                    displayName: setupDisplayName,
                                    avatar: setupAvatar
                                }, { context: systemContext });
                            }

                            // 3. Save default user settings
                            if (UserSettingsService) {
                                await UserSettingsService.restore(username);
                                await UserSettingsService.setSetting('desktop.theme', 'dark');
                            }
                        } catch (e) {
                            console.error('[Welcome] Failed to save profile setup:', e);
                        }

                        // Remove overlay and resolve promise
                        welcomeEl.remove();
                        resolve();
                    };
                }
            };

            renderWizard();
        });
    }
};
