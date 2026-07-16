import { SYSTEM_INFO } from '../../../system/SystemVersion.js';

/**
 * OOBE (Out of Box Experience) Boot Environment
 *
 * Responsibility:
 * Guides the user through initial machine configuration and customizes the
 * pre-created Administrator account.
 *
 * Does NOT:
 * - Run as a standard process or inside a window frame.
 * - Manage active sessions.
 */
export default {
    run: async (registry) => {
        return new Promise(async (resolve) => {
            const FileService = registry.get('FileService');
            const UserService = registry.get('UserService');
            const UserProfileService = registry.get('UserProfileService');
            const DialogService = registry.get('DialogService');

            const container = document.getElementById('platform-host');
            const oobeEl = document.createElement('div');
            oobeEl.id = 'oobe-container';
            oobeEl.className = 'lde-shell';

            container.appendChild(oobeEl);

            // Centered Card Container
            const card = document.createElement('div');
            card.className = 'lde-card p-0';
            card.style.width = '800px';
            card.style.height = '600px';
            card.style.overflow = 'hidden';
            card.style.display = 'flex';
            card.style.flexDirection = 'row';

            oobeEl.appendChild(card);

            let currentStep = 0;
            const steps = [
                { id: 'welcome', label: 'Welcome' },
                { id: 'account', label: 'Administrator' },
                { id: 'avatar', label: 'Avatar' },
                { id: 'personalize', label: 'Personalization' },
                { id: 'summary', label: 'Summary' },
                { id: 'finish', label: 'Finish' }
            ];

            // Setup state
            let setupUsername = 'admin';
            let setupDisplayName = 'Administrator';
            let setupPassword = '';
            let setupHint = '';
            let setupAvatar = '👤';
            let selectedTheme = 'dark';

            const avatars = ['👤', '🦊', '🐯', '🐼', '🐨', '🐙', '🦖', '🦄', '👽', '🤖'];

            const renderWizard = () => {
                const sidebar = `
                    <div style="width: 200px; background: var(--lde-bg-surface); border-right: 1px solid var(--lde-border); padding: 24px; display: flex; flex-direction: column; gap: 16px; box-sizing: border-box;">
                        <div style="font-size: 2rem; margin-bottom: 24px;">🌌</div>
                        ${steps.map((s, i) => `
                            <div style="color: ${i === currentStep ? 'var(--lde-text-primary)' : 'var(--lde-text-tertiary)'}; font-weight: ${i === currentStep ? '600' : '400'}; font-size: 13px;">
                                ${i + 1}. ${s.label}
                            </div>
                        `).join('')}
                    </div>
                `;

                let content = '';
                if (currentStep === 0) { // Welcome
                    content = `
                        <h2 style="margin: 0 0 8px 0; font-size: 48px;">hello</h2>
                        <p style="color: var(--lde-text-secondary); margin: 0 0 24px 0; font-size: 13px;">Version ${SYSTEM_INFO.version} (Codename: ${SYSTEM_INFO.codename})</p>
                        <p style="margin: 0 0 16px 0; line-height: 1.5; font-size: 14px;">This setup assistant will guide you through personalizing your Lark Desktop Environment.</p>
                        <div style="flex-grow:1;"></div>
                        <div style="display:flex; justify-content:flex-end;">
                            <button id="oobe-next" class="lde-btn lde-btn-primary" style="padding: 8px 16px;">Next</button>
                        </div>
                    `;
                } else if (currentStep === 1) { // Administrator Account
                    content = `
                        <h2 style="margin: 0 0 8px 0; font-size: 24px;">Setup Administrator</h2>
                        <p style="color: var(--lde-text-secondary); margin: 0 0 16px 0; font-size: 13px;">Configure the default admin account details.</p>
                        
                        <div style="display: flex; flex-direction: column; gap: 10px; flex-grow: 1; overflow-y: auto; padding-right: 4px;">
                            <input type="text" id="oobe-username" class="lde-input w-full" placeholder="Username" value="${setupUsername}"/>
                            <input type="text" id="oobe-displayname" class="lde-input w-full" placeholder="Display Name" value="${setupDisplayName}"/>
                            <input type="password" id="oobe-password" class="lde-input w-full" placeholder="Password"/>
                            <input type="password" id="oobe-confirm" class="lde-input w-full" placeholder="Confirm Password"/>
                            <input type="text" id="oobe-hint" class="lde-input w-full" placeholder="Password Hint (Optional)" value="${setupHint}"/>
                        </div>
                        
                        <div style="display:flex; justify-content:space-between; margin-top: 16px;">
                            <button id="oobe-back" class="lde-btn" style="padding: 8px 16px;">Back</button>
                            <button id="oobe-next" class="lde-btn lde-btn-primary" style="padding: 8px 16px;">Next</button>
                        </div>
                    `;
                } else if (currentStep === 2) { // Avatar
                    content = `
                        <h2 style="margin: 0 0 8px 0; font-size: 24px;">Choose Avatar</h2>
                        <p style="color: var(--lde-text-secondary); margin: 0 0 16px 0; font-size: 13px;">Select a profile picture for the administrator.</p>
                        
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; padding: 12px; background: var(--lde-bg-surface-elevated); border: 1px solid var(--lde-border); border-radius: 6px; flex-grow: 1; align-content: center;">
                            ${avatars.map(a => `
                                <button class="avatar-select-btn" data-avatar="${a}" style="font-size: 28px; padding: 8px; border: ${a === setupAvatar ? '2px solid var(--lde-accent)' : '2px solid transparent'}; border-radius: 6px; background: transparent; cursor: pointer; outline: none;">${a}</button>
                            `).join('')}
                        </div>
                        
                        <div style="display:flex; justify-content:space-between; margin-top: 16px;">
                            <button id="oobe-back" class="lde-btn" style="padding: 8px 16px;">Back</button>
                            <button id="oobe-next" class="lde-btn lde-btn-primary" style="padding: 8px 16px;">Next</button>
                        </div>
                    `;
                } else if (currentStep === 3) { // Personalization
                    content = `
                        <h2 style="margin: 0 0 8px 0; font-size: 24px;">Personalization</h2>
                        <p style="color: var(--lde-text-secondary); margin: 0 0 24px 0; font-size: 13px;">Choose how your system looks.</p>
                        
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; border: 1px solid var(--lde-border); border-radius: 6px; background: var(--lde-bg-surface-elevated);">
                                <input type="radio" name="theme" value="dark" ${selectedTheme === 'dark' ? 'checked' : ''}>
                                <div>
                                    <div style="font-weight: 600; font-size: 14px;">Dark Mode</div>
                                    <div style="color: var(--lde-text-secondary); font-size: 12px;">Classic dark environment (Recommended).</div>
                                </div>
                            </label>
                            
                            <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; border: 1px solid var(--lde-border); border-radius: 6px; background: var(--lde-bg-surface-elevated);">
                                <input type="radio" name="theme" value="light" ${selectedTheme === 'light' ? 'checked' : ''}>
                                <div>
                                    <div style="font-weight: 600; font-size: 14px;">Light Mode</div>
                                    <div style="color: var(--lde-text-secondary); font-size: 12px;">Clean, light environment look.</div>
                                </div>
                            </label>
                        </div>
                        
                        <div style="flex-grow:1;"></div>
                        <div style="display:flex; justify-content:space-between; margin-top: 16px;">
                            <button id="oobe-back" class="lde-btn" style="padding: 8px 16px;">Back</button>
                            <button id="oobe-next" class="lde-btn lde-btn-primary" style="padding: 8px 16px;">Next</button>
                        </div>
                    `;
                } else if (currentStep === 4) { // Summary
                    content = `
                        <h2 style="margin: 0 0 8px 0; font-size: 24px;">Summary</h2>
                        <p style="color: var(--lde-text-secondary); margin: 0 0 24px 0; font-size: 13px;">Review details before finishing.</p>
                        
                        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding: 12px; border: 1px solid var(--lde-border); border-radius: 8px; background: var(--lde-bg-surface-elevated);">
                            <div style="font-size: 48px;">${setupAvatar}</div>
                            <div>
                                <div style="font-weight: 600; font-size: 18px;">${setupDisplayName}</div>
                                <div style="color: var(--lde-text-secondary); font-size: 13px;">@${setupUsername}</div>
                            </div>
                        </div>

                        <ul style="list-style: none; padding: 0; margin: 0; line-height: 2; font-size: 14px;">
                            <li><strong>System Name:</strong> ${SYSTEM_INFO.name} ${SYSTEM_INFO.version}</li>
                            <li><strong>Theme Preference:</strong> ${selectedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</li>
                        </ul>
                        
                        <div style="flex-grow:1;"></div>
                        <div style="display:flex; justify-content:space-between; margin-top: 16px;">
                            <button id="oobe-back" class="lde-btn" style="padding: 8px 16px;">Back</button>
                            <button id="oobe-next" class="lde-btn lde-btn-primary" style="padding: 8px 16px;">Finish Setup</button>
                        </div>
                    `;
                } else if (currentStep === 5) { // Finish (Installing)
                    content = `
                        <h2 style="margin: 0 0 8px 0; font-size: 24px;">Completing Installation...</h2>
                        <p style="color: var(--lde-text-secondary); margin: 0 0 16px 0; font-size: 13px;">Applying changes and customizing system profiles...</p>
                        <div id="oobe-log" style="font-family: monospace; font-size: 12px; padding: 12px; background: var(--lde-bg-surface-elevated); border: 1px solid var(--lde-border); border-radius: 6px; height: 160px; overflow-y: auto; white-space: pre-wrap; color: var(--lde-text-secondary);"></div>
                    `;
                }

                card.innerHTML = `
                    ${sidebar}
                    <div style="flex: 1; padding: 32px; display: flex; flex-direction: column; overflow-y: auto; box-sizing: border-box;">
                        ${content}
                    </div>
                `;

                // Bindings
                const nextBtn = card.querySelector('#oobe-next');
                const backBtn = card.querySelector('#oobe-back');

                // Avatar Click Handlers
                if (currentStep === 2) {
                    card.querySelectorAll('.avatar-select-btn').forEach(btn => {
                        btn.onclick = () => {
                            setupAvatar = btn.getAttribute('data-avatar');
                            card.querySelectorAll('.avatar-select-btn').forEach(b => {
                                b.style.border = b.getAttribute('data-avatar') === setupAvatar ? '2px solid var(--lde-accent)' : '2px solid transparent';
                            });
                        };
                    });
                }

                if (backBtn) {
                    backBtn.onclick = () => {
                        currentStep--;
                        renderWizard();
                    };
                }

                if (nextBtn) {
                    nextBtn.onclick = async () => {
                        if (currentStep === 1) { // Account validation
                            const userIn = card.querySelector('#oobe-username').value.trim();
                            const displayIn = card.querySelector('#oobe-displayname').value.trim();
                            const passIn = card.querySelector('#oobe-password').value;
                            const confirmIn = card.querySelector('#oobe-confirm').value;
                            const hintIn = card.querySelector('#oobe-hint').value.trim();

                            if (!userIn || !displayIn) {
                                await DialogService.alert('Username and Display Name are required.', 'Setup Error');
                                return;
                            }
                            if (!passIn) {
                                await DialogService.alert('An administrator password must be set.', 'Setup Error');
                                return;
                            }
                            if (passIn !== confirmIn) {
                                await DialogService.alert('Passwords do not match.', 'Setup Error');
                                return;
                            }

                            setupUsername = userIn;
                            setupDisplayName = displayIn;
                            setupPassword = passIn;
                            setupHint = hintIn;
                        } else if (currentStep === 3) { // Theme selection
                            const activeThemeEl = card.querySelector('input[name="theme"]:checked');
                            selectedTheme = activeThemeEl ? activeThemeEl.value : 'dark';
                        }

                        currentStep++;
                        renderWizard();

                        if (currentStep === 5) {
                            runInstall();
                        }
                    };
                }
            };

            const runInstall = async () => {
                const logEl = card.querySelector('#oobe-log');
                const log = (msg) => {
                    logEl.innerText += `> ${msg}\n`;
                    logEl.scrollTop = logEl.scrollHeight;
                };

                const systemContext = { identity: 'system', role: 'SYSTEM' };

                log('Checking default system accounts...');
                await new Promise(r => setTimeout(r, 300));

                if (UserService) {
                    try {
                        log(`Customizing Administrator account (${setupUsername})...`);
                        
                        // 1. Rename default 'user' to customized username
                        if (setupUsername !== 'user') {
                            await UserService.renameUser('user', setupUsername, { context: systemContext });
                        }

                        // 2. Update password, display name, and initialization flags
                        await UserService.updateUser(setupUsername, {
                            displayName: setupDisplayName,
                            passwordHash: setupPassword, // plaintext hashed placeholder
                            passwordHint: setupHint,
                            passwordInitialized: true,
                            profileInitialized: true
                        }, { context: systemContext });

                        // 2.1 Update profile avatar in UserProfileService
                        if (UserProfileService) {
                            await UserProfileService.updateProfile(setupUsername, {
                                displayName: setupDisplayName,
                                avatar: setupAvatar
                            }, { context: systemContext });
                        }

                        // 3. Save default personalization settings (theme)
                        const settingsDir = `/users/${setupUsername}/Settings`;
                        const settingsPath = `${settingsDir}/settings.json`;
                        const defaultSettings = {
                            'desktop.theme': selectedTheme
                        };
                        if (FileService) {
                            if (!FileService.exists(settingsDir, { context: systemContext })) {
                                FileService.createDirectory(settingsDir, { context: systemContext, ownerOverride: setupUsername });
                            }
                            FileService.writeFile(settingsPath, JSON.stringify(defaultSettings, null, 2), { context: systemContext, ownerOverride: setupUsername });
                        }

                        log('Successfully customized system credentials.');
                    } catch (err) {
                        log(`Error applying user setup: ${err.message}`);
                        console.error(err);
                    }
                }

                log('Finalizing system bootstrap files...');
                await new Promise(r => setTimeout(r, 500));

                log('Setup assistant completed successfully!');
                await new Promise(r => setTimeout(r, 1000));

                // Clean up DOM and resolve back to BootService
                oobeEl.remove();
                resolve();
            };

            renderWizard();
        });
    }
};
