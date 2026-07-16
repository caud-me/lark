import { SYSTEM_INFO } from '../../system/SystemVersion.js';
import { BootMode } from '../../system/BootMode.js';
import { 
    omni_card, 
    omni_preferenceItem, 
    omni_imagelistItem,
    omni_listItem, 
    omni_searchbar, 
    omni_selectbox, 
    omni_input, 
    omni_sidebarTab,
    omni_button,
    omni_group
} from '../../platform/settings/SettingsComponents.js';

/**
 * Settings Application
 *
 * Responsibility:
 * Provides a unified preference panel for Lark OS.
 * Uses strict 2-panel architecture with a maximum 512px viewport footprint and no inline styles.
 */
export default {
    run: async (registry, pid, options = {}) => {
        // ========================================
        // Service Retrieval & Verification
        // ========================================
        const WindowService = registry.get('WindowService');
        const SettingsService = registry.get('SettingsService');
        const ThemeService = registry.get('ThemeService');
        const UserSettingsService = registry.get('UserSettingsService');
        const PowerService = registry.get('PowerService');
        const FileService = registry.get('FileService');
        const DiskService = registry.get('DiskService');
        const SessionService = registry.get('SessionService');
        const UserProfileService = registry.get('UserProfileService');
        const SecurityService = registry.get('SecurityService');
        const SecurityPolicy = registry.get('SecurityPolicy');
        const UserService = registry.get('UserService');
        const WidgetService = registry.get('WidgetService');
        const ApplicationService = registry.get('ApplicationService');
        const DialogService = registry.get('DialogService');

        if (!WindowService) {
            console.error('[Settings] Essential WindowService is missing.');
            return;
        }

        const win = WindowService.createWindow({
            title: 'Settings',
            width: 1080,
            height: 720,
            pid
        });

        // ========================================
        // Local Application State
        // ========================================
        let activeTabId = 'home';
        let appsSearchQuery = '';

        const sidebarGroups = [
            {
                label: 'General',
                items: [
                    { id: 'home', label: 'Home', icon: '&#xE80F;' }
                ]
            },
            {
                label: 'System',
                items: [
                    { id: 'system', label: 'System', icon: '&#xE713;' },
                    { id: 'users', label: 'Accounts', icon: '&#xE77B;', policy: 'canManageUsers' },
                    { id: 'developer', label: 'Developer', icon: '&#xE90F;', policy: 'canManageDeveloper' }
                ]
            },
            {
                label: 'Desktop',
                items: [
                    { id: 'personalization', label: 'Personalization', icon: '&#xE771;' },
                    { id: 'apps', label: 'Applications', icon: '&#xE71D;' }
                ]
            }
        ];

        // ========================================
        // Security & Permission Helpers
        // ========================================
        const getFilteredSidebarGroups = () => {
            const sessionContext = SecurityService ? SecurityService.getSessionContext() : null;
            if (!SecurityPolicy || !sessionContext) {
                return sidebarGroups;
            }

            const filteredGroups = [];

            for (let i = 0; i < sidebarGroups.length; i++) {
                const currentGroup = sidebarGroups[i];
                const allowedItems = [];

                for (let j = 0; j < currentGroup.items.length; j++) {
                    const currentItem = currentGroup.items[j];

                    if (!currentItem.policy) {
                        allowedItems.push(currentItem);
                    } else {
                        const evaluationResult = SecurityPolicy[currentItem.policy](sessionContext);
                        if (evaluationResult === 'ALLOW') {
                            allowedItems.push(currentItem);
                        }
                    }
                }

                if (allowedItems.length > 0) {
                    filteredGroups.push({
                        label: currentGroup.label,
                        items: allowedItems
                    });
                }
            }

            return filteredGroups;
        };

        // ========================================
        // Dynamic Panel Renderers & Event Binders
        // ========================================

        // --- HOME (Tips & Tricks) ---
        const renderHome = () => {
            return `
                <h3>Welcome to Lark OS</h3>
                <p>
                    Get started with your new environment. Here are a few features you might not know exist:
                </p>
                ${omni_card(
                    omni_listItem(
                        'Spotlight search',
                        'Press CTRL + SPACE from anywhere to instantly search apps, files, and settings.'
                    ) +
                    omni_listItem(
                        'Context menus',
                        'Right-click anywhere to access contextual actions. Apps like File Manager have rich context menus!'
                    )
                )}
            `;
        };

        // --- COMBINED SYSTEM (General + About + Storage + Recovery) ---
        const renderSystem = () => {
            // General Settings
            const devicename = SettingsService ? (SettingsService.getSetting('system.devicename') || 'LDE-PC') : 'LDE-PC';
            let generalHtml = `<h3>System Preferences</h3>` + 
            omni_card(
                omni_preferenceItem(
                    'Device Name',
                    'How this computer appears on a network',
                    '',
                    omni_input('settings-devicename', devicename)
                ) +
                omni_preferenceItem(
                    'System Language',
                    'Primary language for apps and UI',
                    '',
                    omni_selectbox('settings-language', `<option>English (US)</option>`, true)
                )
            );

            // About OS Specifications
            const osVersion = SYSTEM_INFO ? SYSTEM_INFO.version : '1.0.0';
            const frameworkVersion = 'pre.1.1';
            let aboutHtml = `<h3>About Lark OS</h3>` + 
            omni_card(
                omni_listItem('OS Version', osVersion, '') +
                omni_listItem('Omni Framework Version', frameworkVersion, '')
            );

            // Disk & Storage Info
            let storageHtml = '';
            if (FileService && DiskService) {
                const usage = FileService.getUsage();
                const capacity = FileService.getCapacity();
                const usagePercent = Math.min(100, Math.round((usage / capacity) * 100));

                const formatBytes = (bytes) => {
                    if (bytes < 1024) return bytes + ' B';
                    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
                    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
                };
                const diskInfo = DiskService.getDiskInfo();

                storageHtml = `<h3>Storage & Disk</h3>` + 
                omni_card(
                    omni_imagelistItem(
                        'hdd.webp',
                        'Local Storage Used',
                        `${usagePercent}% of quota`,
                        `${formatBytes(usage)} / ${formatBytes(capacity)}`,
                        `<progress max="100" value="${usagePercent}"></progress>`
                    ) +
                    omni_listItem(
                        'Disk Version',
                        'LRFS Virtual File System format version',
                        `v${diskInfo.version}`
                    ) +
                    omni_listItem(
                        'Snapshots',
                        'Total historical checkpoints',
                        `${diskInfo.snapshotCount}`
                    )
                );
            }

            // Advanced Startup Diagnostics
            let recoveryHtml = '';
            const sessionContext = SecurityService ? SecurityService.getSessionContext() : null;
            const canAccessRecovery = SecurityPolicy && sessionContext 
                ? (SecurityPolicy.canAccessRecovery(sessionContext) === 'ALLOW') 
                : true;

            if (canAccessRecovery) {
                recoveryHtml = `<h3>Advanced Startup</h3>` + 
                omni_card(
                    omni_preferenceItem(
                        'Restart into recovery mode', 
                        'Access diagnostics, boot logs, and filesystem tools.', 
                        '', 
                        omni_button('btn-reboot-recovery', '&#xE117;', 'Restart Now', 'danger')
                    ) +
                    omni_preferenceItem(
                        'Restart into safe mode', 
                        'Start LDE with only core services enabled.', 
                        '', 
                        omni_button('btn-reboot-safe', '&#xE7F4;', 'Restart Now')
                    )
                );
            }

            return generalHtml + aboutHtml + storageHtml + recoveryHtml;
        };

        const bindSystem = (container) => {
            const deviceInput = container.querySelector('#settings-devicename');
            if (deviceInput && SettingsService) {
                deviceInput.onchange = (e) => {
                    SettingsService.setSetting('system.devicename', e.target.value.trim());
                };
            }

            const btnRecovery = container.querySelector('#btn-reboot-recovery');
            const btnSafe = container.querySelector('#btn-reboot-safe');

            if (btnRecovery && PowerService) {
                btnRecovery.onclick = () => {
                    PowerService.reboot({ mode: BootMode.RECOVERY });
                };
            }
            if (btnSafe && PowerService) {
                btnSafe.onclick = () => {
                    PowerService.reboot({ mode: BootMode.SAFE_MODE });
                };
            }
        };

        // --- COMBINED PERSONALIZATION (Theme + Widgets) ---
        const renderPersonalization = () => {
            const activeThemeId = ThemeService ? ThemeService.getActiveThemeId() : 'dark';
            const themes = ThemeService ? ThemeService.getAvailableThemes() : [];
            
            let themeOptionsHtml = '';
            for (let i = 0; i < themes.length; i++) {
                const currentTheme = themes[i];
                const themeId = currentTheme.id;
                const themeTitle = currentTheme.title || themeId;
                const isSelected = themeId === activeThemeId ? 'selected' : '';
                themeOptionsHtml += `<option value="${themeId}" ${isSelected}>${themeTitle}</option>`;
            }

            const wallpaperColor = UserSettingsService ? (UserSettingsService.getSetting('desktop.wallpaper') || '#0f0f0f') : '#0f0f0f';

            let themeHtml = `<h3>Personalization</h3>` + 
            omni_card(
                omni_preferenceItem(
                    'Color Theme',
                    'Choose your system-wide color scheme',
                    '',
                    omni_selectbox('settings-theme-select', themeOptionsHtml)
                ) +
                omni_preferenceItem(
                    'Desktop Background',
                    'Solid color behind your windows',
                    '',
                    `<div class="layout-h flex-gap-8">
                        <input type="color" id="settings-wallpaper-color" class="comp-color-input" value="${wallpaperColor}">
                        ${omni_button('settings-wallpaper-apply', '&#xE10B;', 'Apply', 'primary')}
                    </div>`
                )
            );

            let widgetsHtml = '';
            if (WidgetService) {
                const availableWidgets = WidgetService.getAvailableWidgets() || [];
                const activeWidgets = WidgetService.getWidgets() || [];

                let availableHtml = '';
                if (availableWidgets.length > 0) {
                    for (let i = 0; i < availableWidgets.length; i++) {
                        const currentWidget = availableWidgets[i];
                        let activeCount = 0;
                        
                        for (let j = 0; j < activeWidgets.length; j++) {
                            if (activeWidgets[j].widgetId === currentWidget.id) {
                                activeCount++;
                            }
                        }

                        const activeStatusText = activeCount > 0 ? `${activeCount} active` : '';
                        const actionButton = omni_button(`btn-add-widget-${currentWidget.id.replace(/\./g, '-')}`, '&#xE109;', 'Add', 'primary');

                        availableHtml += omni_preferenceItem(
                            currentWidget.name,
                            currentWidget.description,
                            activeStatusText,
                            actionButton
                        );
                    }
                } else {
                    availableHtml = omni_listItem('No widgets available', '', '');
                }

                let activeHtml = '';
                if (activeWidgets.length > 0) {
                    for (let i = 0; i < activeWidgets.length; i++) {
                        const activeWidget = activeWidgets[i];
                        let foundWidgetDefinition = null;

                        for (let j = 0; j < availableWidgets.length; j++) {
                            if (availableWidgets[j].id === activeWidget.widgetId) {
                                foundWidgetDefinition = availableWidgets[j];
                                break;
                            }
                        }

                        const widgetName = foundWidgetDefinition ? foundWidgetDefinition.name : activeWidget.widgetId;
                        const actionButton = omni_button(`btn-remove-widget-${activeWidget.instanceId.replace(/\./g, '-')}`, '&#xE10A;', 'Remove', 'danger');

                        activeHtml += omni_preferenceItem(
                            widgetName,
                            `Instance ID: ${activeWidget.instanceId}`,
                            '',
                            actionButton
                        );
                    }
                } else {
                    activeHtml = omni_listItem('No active widgets found.', 'Add a widget from the options above to place it here.', '');
                }

                widgetsHtml = `<h3>Available Widgets</h3>` + 
                omni_card(availableHtml) + 
                `<h3>Active Widgets</h3>` + 
                omni_card(activeHtml);
            }

            return themeHtml + widgetsHtml;
        };

        const bindPersonalization = (container) => {
            const themeSelect = container.querySelector('#settings-theme-select');
            if (themeSelect && ThemeService) {
                themeSelect.onchange = (e) => {
                    ThemeService.setActiveThemeId(e.target.value);
                };
            }

            const applyBtn = container.querySelector('#settings-wallpaper-apply');
            if (applyBtn && UserSettingsService) {
                applyBtn.onclick = () => {
                    const color = container.querySelector('#settings-wallpaper-color').value;
                    UserSettingsService.setSetting('desktop.wallpaper', color);
                };
            }

            if (WidgetService) {
                const availableWidgets = WidgetService.getAvailableWidgets() || [];
                const activeWidgets = WidgetService.getWidgets() || [];

                for (const w of availableWidgets) {
                    const btn = container.querySelector(`#btn-add-widget-${w.id.replace(/\./g, '-')}`);
                    if (btn) {
                        btn.onclick = () => {
                            WidgetService.addWidget(w.id, 100, 100, w.defaultWidth || 200, w.defaultHeight || 100);
                            triggerRefresh();
                        };
                    }
                }

                for (const aw of activeWidgets) {
                    const btn = container.querySelector(`#btn-remove-widget-${aw.instanceId.replace(/\./g, '-')}`);
                    if (btn) {
                        btn.onclick = () => {
                            WidgetService.removeWidget(aw.instanceId);
                            triggerRefresh();
                        };
                    }
                }
            }
        };

        // --- DEVELOPER ---
        const renderDeveloper = () => {
            if (!SettingsService) {
                return `<h3>Developer Settings</h3>` + omni_card(omni_listItem('Developer settings are currently unavailable.', '', ''));
            }

            const devShowBounds = SettingsService.getSetting('dev.showBounds') || false;
            const devDisableAnimations = SettingsService.getSetting('dev.disableAnimations') || false;
            const devShowFPS = SettingsService.getSetting('dev.showFPS') || false;
            const devLogEvents = SettingsService.getSetting('dev.logEvents') || false;
            const devDebugLayout = SettingsService.getSetting('dev.debugLayout') || false;

            return `<h3>Developer</h3>` + 
            omni_card(
                omni_preferenceItem(
                    'Show Window Bounds',
                    'Draw outlines around all compositor elements',
                    '',
                    `<input type="checkbox" id="settings-dev-bounds" ${devShowBounds ? 'checked' : ''}>`
                ) +
                omni_preferenceItem(
                    'Disable Animations',
                    'Turn off all CSS transitions and animations globally',
                    '',
                    `<input type="checkbox" id="settings-dev-animations" ${devDisableAnimations ? 'checked' : ''}>`
                ) +
                omni_preferenceItem(
                    'Show FPS',
                    'Display an FPS counter in the top right corner',
                    '',
                    `<input type="checkbox" id="settings-dev-fps" ${devShowFPS ? 'checked' : ''}>`
                ) +
                omni_preferenceItem(
                    'Log Events',
                    'Log all SystemEventBus events to the browser console',
                    '',
                    `<input type="checkbox" id="settings-dev-events" ${devLogEvents ? 'checked' : ''}>`
                ) +
                omni_preferenceItem(
                    'Debug Layout',
                    'Highlight background of all elements for layout debugging',
                    '',
                    `<input type="checkbox" id="settings-dev-layout" ${devDebugLayout ? 'checked' : ''}>`
                )
            ) + `<small>Changes may come into effect when you restart.</small>`;
        };

        const bindDeveloper = (container) => {
            const attachSetting = (selectorId, key) => {
                const el = container.querySelector(selectorId);
                if (el && SettingsService) {
                    el.onchange = (e) => {
                        SettingsService.setSetting(key, e.target.checked);
                    };
                }
            };

            attachSetting('#settings-dev-bounds', 'dev.showBounds');
            attachSetting('#settings-dev-animations', 'dev.disableAnimations');
            attachSetting('#settings-dev-fps', 'dev.showFPS');
            attachSetting('#settings-dev-events', 'dev.logEvents');
            attachSetting('#settings-dev-layout', 'dev.debugLayout');
        };

        // --- APPLICATIONS ---
        const renderApplications = () => {
            if (!ApplicationService) {
                return `<h3>Installed Applications</h3>` + omni_card(omni_listItem('Application service is currently unavailable.', '', ''));
            }
            const TrustService = registry.get('TrustService');
            const installedApps = ApplicationService.getInstalledApplications() || [];
            let cardsHtml = '';
            let processingCount = 0;

            for (let i = 0; i < installedApps.length; i++) {
                const app = installedApps[i];
                const appTitle = app.name || app.id;
                const appDescription = app.description || 'No description information provided.';

                const matchesSearch = !appsSearchQuery || 
                    appTitle.toLowerCase().includes(appsSearchQuery) || 
                    appDescription.toLowerCase().includes(appsSearchQuery);

                if (!matchesSearch) continue;
                processingCount++;

                const trustMeta = TrustService ? TrustService.getTrustMetadata(app.id) : null;
                const isDeletable = !trustMeta || trustMeta.state !== 'BUILT_IN';

                let statusBadgeClass = 'secondary';
                let statusText = 'User Package';
                
                if (trustMeta) {
                    if (trustMeta.state === 'BUILT_IN') {
                        statusBadgeClass = 'info';
                        statusText = 'System Core';
                    } else if (trustMeta.state === 'TRUSTED') {
                        statusBadgeClass = 'success';
                        statusText = 'Trusted Source';
                    } else {
                        statusBadgeClass = 'warning';
                        statusText = 'Untrusted Source';
                    }
                }

                const secondaryLabel = `v${app.version || '1.0.0'} • <span class="tag ${statusBadgeClass}">${statusText}</span>`;
                
                let actionBtnHtml = '';
                if (isDeletable) {
                    actionBtnHtml = omni_button('', '&#xE74D;', 'Uninstall', 'danger', 'uninstall-action-btn');
                } else {
                    actionBtnHtml = omni_button('', '&#xE72E;', 'System Locked', '', '', true);
                }

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = actionBtnHtml;
                tempDiv.querySelectorAll('button').forEach(btn => {
                    btn.dataset.id = app.id;
                });

                cardsHtml += omni_preferenceItem(
                    appTitle,
                    appDescription,
                    secondaryLabel,
                    tempDiv.innerHTML
                );
            }

            if (processingCount === 0) {
                cardsHtml = omni_listItem('No locally installed applications matched your query.', '', '');
            }

            return `
                <h3>Installed Applications</h3>
                ${omni_searchbar('settings-apps-search', 'Search installed applications...', appsSearchQuery)}
                ${omni_card(cardsHtml)}
            `;
        };

        const bindApplications = (container) => {
            const searchInput = container.querySelector('#settings-apps-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    appsSearchQuery = e.target.value.toLowerCase();
                    triggerRefresh();
                    
                    // Maintain focus
                    setTimeout(() => {
                        const newSearchInput = win.contentElement.querySelector('#settings-apps-search');
                        if (newSearchInput) {
                            newSearchInput.focus();
                            const val = newSearchInput.value;
                            newSearchInput.value = '';
                            newSearchInput.value = val;
                        }
                    }, 0);
                });
            }

            container.addEventListener('click', async (e) => {
                const uninstallBtn = e.target.closest('.uninstall-action-btn');
                if (uninstallBtn) {
                    const appId = uninstallBtn.dataset.id;
                    const PackageService = registry.get('PackageService');
                    
                    if (DialogService) {
                        const confirmed = await DialogService.confirm(
                            `Are you sure you want to completely remove ${appId}?`, 
                            'Uninstall Application'
                        );
                        if (confirmed) {
                            try {
                                uninstallBtn.innerHTML = 'Uninstalling...';
                                uninstallBtn.disabled = true;
                                await PackageService.uninstallPackage(appId);
                                DialogService.alert('Uninstallation completed successfully!', 'Settings');
                                triggerRefresh();
                            } catch (err) {
                                DialogService.alert(`Failed to uninstall: ${err.message}`, 'Error');
                                triggerRefresh();
                            }
                        }
                    }
                }
            });
        };

        // --- ACCOUNTS & USERS ---
        const renderUsers = () => {
            if (!SessionService || !UserProfileService) {
                return `<h3>My Profile</h3>` + omni_card(omni_listItem('Session or User services are currently unavailable.', '', ''));
            }

            const session = SessionService.getCurrentSession();
            const profile = UserProfileService.getCurrentProfile();

            if (!session || !profile) {
                return `<h3>My Profile</h3>` + omni_card(omni_listItem('Failed to resolve active profile session.', '', ''));
            }

            let myProfileHtml = `<h3>My Profile</h3>` + 
            omni_card(
                omni_preferenceItem(
                    'Account Status',
                    'The user currently logged in',
                    session.user.username,
                    omni_input('settings-username', session.user.username, true)
                ) +
                omni_preferenceItem(
                    'Account Role',
                    'Permissions level',
                    '',
                    omni_selectbox('', `<option>${session.user.role === 'ADMINISTRATOR' ? 'Administrator' : 'Standard User'}</option>`, true)
                ) +
                omni_preferenceItem(
                    'Display Name',
                    'How your name appears in the system',
                    '',
                    omni_input('settings-display-name', profile.displayName || session.user.username)
                ) +
                omni_preferenceItem(
                    'Avatar URL',
                    'Link to your profile picture',
                    '',
                    omni_input('settings-avatar', profile.avatar || '', false, 'https://...')
                ) +
                `<div class="card-footer text-right">
                    ${omni_button('btn-save-profile', '&#xE105;', 'Save Profile', 'primary')}
                </div>`
            );

            // Session-based layout wrapping using Omni Group component
            let adminHtml = '';
            if (SecurityService && SecurityService.isAdministrator(SecurityService.getSessionContext())) {
                adminHtml = omni_group('Accounts', '', 'admin-users-section-container', 'layout-v flex-gap-8');
            }

            return myProfileHtml + adminHtml;
        };

        const bindUsers = (container) => {
            if (!SessionService || !UserProfileService) return;

            const session = SessionService.getCurrentSession();
            if (!session) return;

            const saveBtn = container.querySelector('#btn-save-profile');
            if (saveBtn) {
                saveBtn.onclick = () => {
                    const newName = container.querySelector('#settings-display-name').value.trim();
                    const newAvatar = container.querySelector('#settings-avatar').value.trim();

                    try {
                        UserProfileService.updateProfile(session.user.username, {
                            displayName: newName || session.user.username,
                            avatar: newAvatar || null
                        });
                        if (DialogService) {
                            DialogService.alert('Profile successfully updated.', 'Accounts');
                        }
                    } catch (e) {
                        if (DialogService) {
                            DialogService.alert(`Failed to save profile: ${e.message}`, 'Error');
                        }
                    }
                };
            }

            if (SecurityService && SecurityService.isAdministrator(SecurityService.getSessionContext())) {
                renderAdminUsersSection(container);
            }
        };

        const renderAdminUsersSection = (container) => {
            const adminWrapper = container.querySelector('#admin-users-section-container');
            if (!adminWrapper || !UserService) return;

            const users = UserService.getUsers().filter(u => u.username !== 'system');
            let usersHtml = '';

            for (let i = 0; i < users.length; i++) {
                const currentUser = users[i];
                const isUserAdmin = currentUser.role === 'ADMINISTRATOR';
                const roleLabel = isUserAdmin ? 'Administrator' : 'Standard';

                const actionButtons = `
                    <div class="layout-h flex-gap-8">
                        ${omni_button('', '&#xE8AC;', 'Reset Password&hellip;', '', 'btn-reset-password', false)}
                        ${omni_button('', '&#xE74D;', 'Delete User&hellip;', '', 'btn-delete-user', false)}
                    </div>
                `;

                const tempContainer = document.createElement('div');
                tempContainer.innerHTML = actionButtons;
                tempContainer.querySelectorAll('button').forEach(b => b.dataset.username = currentUser.username);

                usersHtml += omni_preferenceItem(
                    currentUser.displayName || currentUser.username,
                    `${roleLabel} &bull; ${currentUser.username}`,
                    '',
                    tempContainer.innerHTML
                );
            }

            adminWrapper.innerHTML = omni_card(
                usersHtml +
                `<div class="card-footer text-center">
                    ${omni_button('btn-add-user', '&#xE109;', 'Add User&hellip;', 'primary')}
                </div>`
            );

            adminWrapper.querySelectorAll('.btn-reset-password').forEach(btn => {
                btn.onclick = () => showResetPasswordDialog(btn.dataset.username);
            });

            adminWrapper.querySelectorAll('.btn-delete-user').forEach(btn => {
                btn.onclick = () => showDeleteUserDialog(btn.dataset.username);
            });

            const addUserBtn = adminWrapper.querySelector('#btn-add-user');
            if (addUserBtn) {
                addUserBtn.onclick = () => showAddUserDialog();
            }
        };

        // --- ACCOUNT MANAGEMENT DIALOGS ---
        const showAddUserDialog = async () => {
            if (!DialogService || !UserService) return;

            const form = document.createElement('div');
            form.className = "layout-v flex-gap-16";
            form.innerHTML = `
                <div class="form-label-small">Username</div>
                ${omni_input('dlg-username', '', false, 'e.g. jdoe')}
                <div class="form-label-small">Display Name (Optional)</div>
                ${omni_input('dlg-display', '', false, 'John Doe')}
                <div class="form-label-small">Password</div>
                ${omni_input('dlg-pass1', '', false, '', 'password')}
                <div class="form-label-small">Confirm Password</div>
                ${omni_input('dlg-pass2', '', false, '', 'password')}
                <label class="comp-checkbox text-small-gap">
                    <input type="checkbox" id="dlg-show-pass">
                    <span>Show Password</span>
                </label>
            `;

            form.querySelector('#dlg-show-pass').onchange = (e) => {
                const type = e.target.checked ? 'text' : 'password';
                form.querySelector('#dlg-pass1').type = type;
                form.querySelector('#dlg-pass2').type = type;
            };

            const result = await DialogService.show({
                title: 'Create User',
                contentElement: form,
                modal: true,
                buttons: [
                    { label: 'Cancel', result: null },
                    { label: 'Create User', result: 'SUBMIT', primary: true }
                ]
            });

            if (result === 'SUBMIT') {
                const username = form.querySelector('#dlg-username').value.trim().toLowerCase();
                const displayName = form.querySelector('#dlg-display').value.trim();
                const pass1 = form.querySelector('#dlg-pass1').value;
                const pass2 = form.querySelector('#dlg-pass2').value;

                if (!username) {
                    DialogService.alert('Username is required.', 'Error');
                    return;
                }
                if (pass1 !== pass2) {
                    DialogService.alert('Passwords do not match.', 'Error');
                    return;
                }

                try {
                    UserService.createUser(username, displayName || username, pass1);
                    triggerRefresh();
                } catch (e) {
                    DialogService.alert(`Error creating user: ${e.message}`, 'Error');
                }
            }
        };

        const showResetPasswordDialog = async (username) => {
            if (!DialogService || !UserService) return;

            const form = document.createElement('div');
            form.className = "layout-v flex-gap-16";
            form.innerHTML = `
                <div class="form-label-small">New Password</div>
                ${omni_input('dlg-pass1', '', false, '', 'password')}
                <div class="form-label-small">Confirm Password</div>
                ${omni_input('dlg-pass2', '', false, '', 'password')}
                <label class="comp-checkbox text-small-gap">
                    <input type="checkbox" id="dlg-show-pass">
                    <span>Show Password</span>
                </label>
            `;

            form.querySelector('#dlg-show-pass').onchange = (e) => {
                const type = e.target.checked ? 'text' : 'password';
                form.querySelector('#dlg-pass1').type = type;
                form.querySelector('#dlg-pass2').type = type;
            };

            const result = await DialogService.show({
                title: `Reset Password for ${username}`,
                contentElement: form,
                modal: true,
                buttons: [
                    { label: 'Cancel', result: null },
                    { label: 'Save', result: 'SUBMIT', primary: true }
                ]
            });

            if (result === 'SUBMIT') {
                const pass1 = form.querySelector('#dlg-pass1').value;
                const pass2 = form.querySelector('#dlg-pass2').value;

                if (pass1 !== pass2) {
                    DialogService.alert('Passwords do not match.', 'Error');
                    return;
                }

                try {
                    UserService.resetPassword(username, pass1);
                    DialogService.alert(`Password reset for ${username}.`, 'Success');
                } catch (e) {
                    DialogService.alert(`Error: ${e.message}`, 'Error');
                }
            }
        };

        const showDeleteUserDialog = async (username) => {
            if (!DialogService || !UserService) return;

            const form = document.createElement('div');
            form.className = "layout-v flex-gap-16";
            form.innerHTML = `
                <div class="dialog-description">Are you sure you want to delete the user account "${username}"?</div>
                <label class="dialog-radio-option">
                    <input type="radio" name="del-home" value="keep" checked> Keep Home Folder
                </label>
                <label class="dialog-radio-option">
                    <input type="radio" name="del-home" value="delete"> Delete Home Folder
                </label>
            `;

            const result = await DialogService.show({
                title: `Delete User "${username}"`,
                contentElement: form,
                modal: true,
                buttons: [
                    { label: 'Cancel', result: null },
                    { label: 'Delete User', result: 'SUBMIT', primary: true }
                ]
            });

            if (result === 'SUBMIT') {
                const deleteHome = form.querySelector('input[name="del-home"]:checked').value === 'delete';
                try {
                    UserService.deleteUser(username, { deleteHome });
                    triggerRefresh();
                } catch (e) {
                    DialogService.alert(`Error deleting user: ${e.message}`, 'Error');
                }
            }
        };

        // ========================================
        // Orchestration & Presentation Layer
        // ========================================
        const renderShell = () => {
            const container = document.createElement('div');
            container.className = 'omni-layout-row';

            container.innerHTML = `
                <!-- Left Panel: Sidebar Nav -->
                <div id="settings-sidebar-${win.id}" class="omni-panel-1">
                    <!-- Dynamic navigation renders here -->
                </div>

                <!-- Right Panel: Preference Content Viewport -->
                <div class="omni-panel-2">
                    <div class="layout-max-w-512px">
                        <div id="settings-content-viewport-${win.id}" class="layout-v flex-gap-8">
                            <!-- Active component outputs render here -->
                        </div>
                    </div>
                </div>
            `;

            win.contentElement.appendChild(container);
        };

        const updateSidebar = () => {
            const sidebarEl = win.contentElement.querySelector(`#settings-sidebar-${win.id}`);
            if (!sidebarEl) return;

            sidebarEl.innerHTML = '';
            sidebarEl.innerHTML += omni_searchbar(`settings-search-${win.id}`, 'Search settings...');

            const activeGroups = getFilteredSidebarGroups();

            for (let i = 0; i < activeGroups.length; i++) {
                const group = activeGroups[i];
                let itemsHtml = '';

                for (let j = 0; j < group.items.length; j++) {
                    const item = group.items[j];
                    const isActive = activeTabId === item.id;
                    itemsHtml += omni_sidebarTab(item.id, isActive, item.icon, item.label);
                }

                sidebarEl.innerHTML += omni_group(group.label, itemsHtml);
            }

            // Bind click tracking directly to standard <a> tabs
            sidebarEl.querySelectorAll('.comp-sidebartab').forEach(tab => {
                tab.onclick = () => {
                    activeTabId = tab.dataset.id;
                    updateSidebar();
                    triggerRefresh();
                };
            });
        };

        const triggerRefresh = () => {
            const viewport = win.contentElement.querySelector(`#settings-content-viewport-${win.id}`);
            if (!viewport) return;

            let contentHtml = '';
            let binderFn = null;

            switch (activeTabId) {
                case 'home':
                    contentHtml = renderHome();
                    break;
                case 'system':
                    contentHtml = renderSystem();
                    binderFn = bindSystem;
                    break;
                case 'users':
                    contentHtml = renderUsers();
                    binderFn = bindUsers;
                    break;
                case 'developer':
                    contentHtml = renderDeveloper();
                    binderFn = bindDeveloper;
                    break;
                case 'personalization':
                    contentHtml = renderPersonalization();
                    binderFn = bindPersonalization;
                    break;
                case 'apps':
                    contentHtml = renderApplications();
                    binderFn = bindApplications;
                    break;
                default:
                    contentHtml = `<h3>Not Found</h3>` + omni_card(omni_listItem('The selected settings panel is unavailable.', '', ''));
            }

            viewport.innerHTML = contentHtml;
            if (binderFn) {
                binderFn(viewport);
            }
        };

        // ========================================
        // Intent Handling
        // ========================================
        const executeIntent = async (intent) => {
            if (intent && intent.type === 'settings.openPage' && intent.payload && intent.payload.page) {
                const pageMap = {
                    'appearance': 'personalization',
                    'personalization': 'personalization',
                    'system': 'system',
                    'users': 'users',
                    'developer': 'developer',
                    'apps': 'apps'
                };
                const mappedTab = pageMap[intent.payload.page];
                if (mappedTab) {
                    activeTabId = mappedTab;
                    updateSidebar();
                    triggerRefresh();
                }
            }
        };

        const ProcessService = registry.get('ProcessService');
        const proc = ProcessService ? ProcessService.getProcess(pid) : null;
        if (proc) {
            proc.handleIntent = async (intent) => {
                await executeIntent(intent);
            };
        }

        if (options.intent) {
            await executeIntent(options.intent);
        }

        // ========================================
        // Application Initialization & Startup
        // ========================================
        renderShell();
        updateSidebar();
        triggerRefresh();
    },

    onIntent: async (registry, pid, intent) => {
        const ProcessService = registry.get('ProcessService');
        if (!ProcessService) return;
        
        const proc = ProcessService.getProcess(pid);
        if (proc && typeof proc.handleIntent === 'function') {
            await proc.handleIntent(intent);
        }
    }
};