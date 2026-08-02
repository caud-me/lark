import { SYSTEM_INFO } from '../../3-system/SystemVersion.js';
import { BootMode } from '../../3-system/BootMode.js';
import { 
    omni_card, 
    omni_preferenceItem, 
    omni_preferenceItem2,
    omni_imagelistItem,
    omni_listItem, 
    omni_searchbar, 
    omni_selectbox, 
    omni_input, 
    omni_sidebarTab,
    omni_button,
    omni_group
} from '../../5-platform/settings/SettingsComponents.js';

/**
 * Settings Application
 *
 * Responsibility:
 * Provides a unified preference panel for Lark OS.
 * Uses strict 2-panel architecture with a maximum 512px viewport footprint and no inline styles.
 */
export default {
    run: async (registry) => {
        // ========================================
        // Service Retrieval & Verification
        // ========================================
        const WindowService = registry.get('WindowService');
        const SettingsService = registry.get('SettingsService');
        const ThemeService = registry.get('ThemeService');
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
        const StartupApplicationService = registry.get('StartupApplicationOrchestrator');
        const DialogService = registry.get('DialogService');
        const SystemInformationService = registry.get('SystemInformationService');
        const UserSettingsService = registry.get('UserSettingsService');
        const PresentationEffectsService = registry.get('PresentationEffectsService');

        if (!WindowService) {
            console.error('[Settings] Essential WindowService is missing.');
            return;
        }

        const win = WindowService.createWindow({
            title: 'Settings',
            width: 1080,
            height: 720
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
                    { id: 'info', label: 'System Information', icon: '&#xE946;' },
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
                        'Right-click anywhere to access contextual actions. Apps like Finder have rich context menus!'
                    ) +
                    omni_listItem(
                        'Workspaces',
                        `Workspaces help organize what's on your screen, click on the plus icon to add a workspace. then right click to remove a workspace.`
                    )
                )}
            `;
        };

        // --- COMBINED SYSTEM (General + About + Storage + Recovery) ---
        const renderSystem = async () => {
            // General Settings
            const devicename = SettingsService ? (SettingsService.getSetting('system.devicename') || 'LDE-PC') : 'LDE-PC';
            let generalHtml = `<h3>System Preferences</h3>` + 
            omni_card(
                omni_preferenceItem(
                    'Device Name',
                    'How this computer appears on a network',
                    '',
                    omni_input('settings-devicename', devicename)
                )
            );

            // About OS Specifications
            const osVersion = SYSTEM_INFO ? SYSTEM_INFO.version : '1.0.0';
            const frameworkVersion = 'pre.1.1';
            let aboutHtml = `<h3>About Lark OS</h3>` + 
            omni_card(
                omni_listItem('OS Version', osVersion, '') +
                omni_listItem('Omni Framework Version', frameworkVersion, '') +
                omni_preferenceItem(
                    'System Specifications',
                    'View detailed virtual machine identity, firmware specs, and hardware inventory',
                    '',
                    omni_button('btn-goto-sysinfo', '&#xE946;', 'View...', 'primary')
                )
            );

            // // Disk & Storage Info
            // let storageHtml = '';
            // if (FileService) {
            //     const storageContract = FileService.getStorageInfo ? await FileService.getStorageInfo() : null;
            //     const info = (storageContract && storageContract.success) ? storageContract.data : null;
            //     if (info) {
            //         const diskName = info.diskName;
            //         const subtitleText = info.percentUsed !== null ? `${info.driverLabel} • ${info.percentUsed}% used` : info.driverLabel;
            //         const usageText = `${info.formattedUsage} / ${info.formattedCapacity}`;
            //         const progressHtml = info.percentUsed !== null ? `<progress max="100" value="${info.percentUsed}"></progress>` : '';

            //         storageHtml = `<h3>Storage & Disk</h3>` + 
            //         omni_card(
            //             omni_imagelistItem(
            //                 'hdd.webp',
            //                 diskName,
            //                 subtitleText,
            //                 usageText,
            //                 progressHtml
            //             ) +
            //             (DiskService ? omni_listItem(
            //                 'Disk Version',
            //                 'LRFS Virtual File System format version',
            //                 `v${DiskService.getDiskInfo().version}`
            //             ) : '') +
            //             (DiskService ? omni_listItem(
            //                 'Snapshots',
            //                 'Total historical checkpoints',
            // Disk & Storage Info
            let storageHtml = '';
            if (FileService) {
                try {
                    let info = null;
                    if (typeof FileService.getStorageInfo === 'function') {
                        const storageContract = await FileService.getStorageInfo();
                        info = (storageContract && storageContract.success) ? storageContract.data : null;
                    }

                    if (!info && typeof FileService.getUsage === 'function') {
                        const usage = FileService.getUsage() || 0;
                        const cap = FileService.getCapacity() || 5242880;
                        const pct = Math.min(100, Math.round((usage / cap) * 100));
                        info = {
                            diskName: 'Lark System Disk',
                            driverLabel: 'Virtual Storage Volume',
                            formattedUsage: `${(usage / 1024).toFixed(1)} KB`,
                            formattedCapacity: `${(cap / (1024 * 1024)).toFixed(2)} MB`,
                            percentUsed: pct
                        };
                    }

                    if (info) {
                        const diskName = info.diskName || 'Lark System Disk';
                        const percentUsed = typeof info.percentUsed === 'number' ? info.percentUsed : 0;
                        const subtitleText = `${info.driverLabel || 'Storage'} • ${percentUsed}% used`;
                        const usageText = `${info.formattedUsage || '0 B'} / ${info.formattedCapacity || '5.00 MB'}`;
                        const progressHtml = `<progress max="100" value="${percentUsed}"></progress>`;

                        storageHtml = `<h3>Storage & Disk</h3>` + 
                        omni_card(
                            omni_imagelistItem(
                                'hdd.webp',
                                diskName,
                                subtitleText,
                                usageText,
                                progressHtml
                            ) +
                            (DiskService ? omni_listItem(
                                'Disk Version',
                                'LRFS Virtual File System format version',
                                `v${DiskService.getDiskInfo().version}`
                            ) : '') +
                            (DiskService ? omni_listItem(
                                'Snapshots',
                                'Total historical checkpoints',
                                `${DiskService.getDiskInfo().snapshotCount}`
                            ) : '')
                        );
                    }
                } catch (e) {
                    console.warn('[Settings] Storage section render error:', e);
                }
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
                btnRecovery.onclick = async () => {
                    let confirmed = true;
                    if (DialogService) {
                        confirmed = await DialogService.confirm(
                            'Your device will restart into Recovery Mode to access diagnostics, data reset, and system repair tools. Proceed?',
                            'Restart into Recovery Mode'
                        );
                    }
                    if (confirmed) {
                        PowerService.reboot({ mode: BootMode.RECOVERY });
                    }
                };
            }
            if (btnSafe && PowerService) {
                btnSafe.onclick = async () => {
                    let confirmed = true;
                    if (DialogService) {
                        confirmed = await DialogService.confirm(
                            'Your device will restart into Safe Mode with only core system services loaded. Proceed?',
                            'Restart into Safe Mode'
                        );
                    }
                    if (confirmed) {
                        PowerService.reboot({ mode: BootMode.SAFE_MODE });
                    }
                };
            }
            const btnSysInfo = container.querySelector('#btn-goto-sysinfo');
            if (btnSysInfo) {
                btnSysInfo.onclick = () => {
                    activeTabId = 'info';
                    updateSidebar();
                    triggerRefresh();
                };
            }
        };

        // --- DEDICATED SYSTEM INFORMATION ---
        const renderInfo = () => {
            const sysInfo = SystemInformationService ? SystemInformationService.getSystemInfo() : {
                name: SYSTEM_INFO.name,
                version: SYSTEM_INFO.version,
                codename: SYSTEM_INFO.codename,
                architecture: SYSTEM_INFO.architecture,
                build: SYSTEM_INFO.build,
                channel: SYSTEM_INFO.channel
            };

            const firmwareInfo = SystemInformationService ? SystemInformationService.getFirmwareInfo() : {
                machineId: 'LARK-VM-UNAVAILABLE',
                vmModel: 'Lark Virtual Machine v27',
                vendor: 'Lark Technologies Inc.',
                firmwareVersion: '27.8.8-firmware',
                postStatus: 'PASSED',
                devices: []
            };

            const storageInfo = SystemInformationService ? SystemInformationService.getStorageOverview() : {
                driverLabel: 'Local Storage Used',
                formattedUsage: '0 B',
                formattedCapacity: '5.00 MB',
                percentUsed: 0
            };

            const bootState = SystemInformationService ? SystemInformationService.getBootState() : { identity: 'system', role: 'SYSTEM' };

            // 1. Operating System Identity Card
            let osCardHtml = `<h3>Operating System</h3>` +
            omni_card(
                omni_listItem('System Name', sysInfo.name, '') +
                omni_listItem('OS Version', `v${sysInfo.version}`, '') +
                omni_listItem('Release Series', `${sysInfo.architecture} (Codename: ${sysInfo.codename})`, '') +
                omni_listItem('Build Channel', `${sysInfo.channel} • Build ${sysInfo.build}`, '')
            );

            // 2. Virtual Machine & Firmware Identity Card
            let firmwareCardHtml = `<h3>Firmware & Virtual Machine</h3>` +
            omni_card(
                omni_listItem('Machine Identity (UUID)', firmwareInfo.machineId, '') +
                omni_listItem('Virtual Machine Model', firmwareInfo.vmModel, '') +
                omni_listItem('Firmware Vendor', firmwareInfo.vendor, '') +
                omni_listItem('Firmware Revision', firmwareInfo.firmwareVersion, '') +
                omni_listItem('POST Diagnostics Status', firmwareInfo.postStatus, '')
            );

            // 3. Virtual Hardware Inventory Card
            let devicesListHtml = '';
            const devices = firmwareInfo.devices || [];
            for (let i = 0; i < devices.length; i++) {
                const dev = devices[i];
                const badgeClass = dev.status === 'ONLINE' ? 'success' : 'warning';
                const tagLabel = `<span class="tag ${badgeClass}">${dev.status}</span>`;
                devicesListHtml += omni_listItem(
                    dev.name,
                    `${dev.model || dev.id} • ${dev.vendor || 'Lark Technologies'} (v${dev.version || '1.0'})`,
                    tagLabel
                );
            }

            let hardwareCardHtml = `<h3>Virtual Hardware Inventory</h3>` +
            omni_card(devicesListHtml || omni_listItem('No hardware devices enumerated.', '', ''));

            // 4. Kernel Driver Framework Card
            const driverList = SystemInformationService ? SystemInformationService.getDriverInfo() : [];
            let driversListHtml = '';
            for (let i = 0; i < driverList.length; i++) {
                const drv = driverList[i];
                const badgeClass = drv.status === 'LOADED' ? 'success' : (drv.required ? 'danger' : 'warning');
                const reqText = drv.required ? 'Required' : 'Optional';
                const tagLabel = `<span class="tag ${badgeClass}">${drv.status}</span>`;
                driversListHtml += omni_listItem(
                    drv.name,
                    `Target: ${drv.targetDeviceId} • ${reqText} Driver`,
                    tagLabel
                );
            }

            let driverCardHtml = `<h3>Kernel Driver Framework</h3>` +
            omni_card(driversListHtml || omni_listItem('No kernel drivers registered.', '', ''));

            // 5. Kernel Boot Sequence Timeline Card
            const bootTimeline = SystemInformationService && typeof SystemInformationService.getBootTimeline === 'function' 
                ? SystemInformationService.getBootTimeline() 
                : [];
            let bootTimelineHtml = '';
            for (let i = 0; i < bootTimeline.length; i++) {
                const item = bootTimeline[i];
                bootTimelineHtml += omni_listItem(
                    item.name,
                    `Stage ID: ${item.id}`,
                    `<span class="tag success">${item.formattedDuration}</span>`
                );
            }
            let timelineCardHtml = `<h3>Kernel Boot Sequence Timeline</h3>` +
            omni_card(bootTimelineHtml || omni_listItem('No boot timeline recorded.', '', ''));

            // 6. Virtual Storage Overview Card
            let storageCardHtml = `<h3>Virtual Storage Subsystem</h3>` +
            omni_card(
                omni_listItem('Primary Controller', storageInfo.driverLabel || 'Local Storage', '') +
                omni_listItem('Volume Capacity', storageInfo.formattedCapacity || '5.00 MB', '') +
                omni_listItem('Storage Utilization', `${storageInfo.formattedUsage || '0 B'} (${storageInfo.percentUsed || 0}% used)`, '')
            );

            // 7. Active Runtime Session
            let runtimeCardHtml = `<h3>Active Session & Context</h3>` +
            omni_card(
                omni_listItem('Session User', bootState.identity || 'system', '') +
                omni_listItem('Privilege Role', bootState.role || 'SYSTEM', '')
            );

            return osCardHtml + firmwareCardHtml + hardwareCardHtml + driverCardHtml + timelineCardHtml + storageCardHtml + runtimeCardHtml;
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

            const presentationEffectsService = registry ? registry.get('PresentationEffectsService') : null;
            const resolvedPolicy = (presentationEffectsService && typeof presentationEffectsService.getResolvedPolicy === 'function')
                ? presentationEffectsService.getResolvedPolicy()
                : null;

            const visualEffectsEnabled = resolvedPolicy && resolvedPolicy.motion && resolvedPolicy.motion.general
                ? Boolean(resolvedPolicy.motion.general.enabled)
                : false;

            const hwAccelSupported = Boolean(resolvedPolicy && !resolvedPolicy.reducedMotion);

            const visualEffectsDescription = hwAccelSupported
                ? 'Enable window animations and glass translucent blur effects (performance depends on your graphics driver)'
                : 'Disabled: Hardware acceleration is not active on your browser or graphics driver.';

            const visualEffectsOptionsHtml = `
                <option value="true" ${visualEffectsEnabled ? 'selected' : ''}>Enabled</option>
                <option value="false" ${!visualEffectsEnabled ? 'selected' : ''}>Disabled</option>
            `;

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
                    'Choose an image for your desktop',
                    '',
                    `<div class="layout-h flex-gap-8">
                        <input type="file" id="settings-wallpaper-upload" accept="image/png, image/jpeg, image/webp" style="display: none">
                        ${omni_button('settings-wallpaper-browse', '&#xE10B;', 'Browse Image...', 'primary')}
                    </div>`
                )
            ) +
            `<h3>Presentation Effects</h3>` +
            omni_card(
                omni_preferenceItem(
                    'Enable Visual Effects',
                    visualEffectsDescription,
                    '',
                    omni_selectbox('settings-visual-effects-select', visualEffectsOptionsHtml, !hwAccelSupported)
                )
            );

            let widgetsHtml = '';
            if (WidgetService) {
                const availableWidgets = WidgetService.getAvailableWidgets();
                const activeWidgets = WidgetService.getWidgets();

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

            const visualSelect = container.querySelector('#settings-visual-effects-select');
            if (visualSelect && UserSettingsService) {
                visualSelect.onchange = (e) => {
                    const val = e.target.value === 'true';
                    UserSettingsService.setSetting('appearance.visualEffectsEnabled', val);
                };
            }

            const browseBtn = container.querySelector('#settings-wallpaper-browse');
            const fileInput = container.querySelector('#settings-wallpaper-upload');
            const WallpaperService = registry.get('WallpaperService');
            
            if (browseBtn && fileInput && WallpaperService) {
                browseBtn.onclick = () => {
                    fileInput.click();
                };
                fileInput.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    browseBtn.innerHTML = 'Applying...';
                    browseBtn.disabled = true;
                    
                    try {
                        await WallpaperService.setWallpaper(file);
                    } catch (err) {
                        if (DialogService) {
                            DialogService.alert(`Failed to set wallpaper: ${err.message}`, 'Error');
                        } else {
                            console.error('Wallpaper error:', err);
                        }
                    } finally {
                        browseBtn.innerHTML = 'Browse Image...';
                        browseBtn.disabled = false;
                        fileInput.value = '';
                    }
                };
            }

            if (WidgetService) {
                const availableWidgets = WidgetService.getAvailableWidgets();
                const activeWidgets = WidgetService.getWidgets();

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
            const devOskEnabled = SettingsService.getSetting('dev.oskEnabled') || false;
            const devDesktopEnv = SettingsService.getSetting('dev.desktopEnvironment') || 'lde';

            return `<h3>Developer Options</h3>` + 
            omni_card(
                omni_preferenceItem(
                    'Enable On-Screen Keyboard (Experimental)',
                    'Show floating software keyboard for text input fields and touch devices',
                    '',
                    `<input type="checkbox" id="settings-dev-osk" ${devOskEnabled ? 'checked' : ''}>`
                ) +
                omni_preferenceItem2(
                    'Desktop Environment',
                    'Choose the active shell implementation',
                    '',
                    `<div class="layout-v flex-gap-8">
                        <label class="comp-radio text-small-gap">
                            <input type="radio" name="dev-desktop" value="lde" ${devDesktopEnv === 'lde' ? 'checked' : ''}>
                            <span>LDE Desktop</span>
                        </label>
                        <label class="comp-radio text-small-gap">
                            <input type="radio" name="dev-desktop" value="minimal" ${devDesktopEnv === 'minimal' ? 'checked' : ''}>
                            <span>Minimal Desktop</span>
                        </label>
                    </div>`
                ) +
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
            const launchAvaBtn = container.querySelector('#btn-launch-ava');
            if (launchAvaBtn) {
                launchAvaBtn.onclick = () => {
                    const processService = registry.get('ProcessService');
                    if (processService) {
                        processService.startProcess('sys.guardian');
                    }
                };
            }

            const attachSetting = (selectorId, key) => {
                const el = container.querySelector(selectorId);
                if (el && SettingsService) {
                    el.onchange = (e) => {
                        SettingsService.setSetting(key, e.target.checked);
                    };
                }
            };

            attachSetting('#settings-dev-osk', 'dev.oskEnabled');
            attachSetting('#settings-dev-bounds', 'dev.showBounds');
            attachSetting('#settings-dev-animations', 'dev.disableAnimations');
            attachSetting('#settings-dev-fps', 'dev.showFPS');
            attachSetting('#settings-dev-events', 'dev.logEvents');
            attachSetting('#settings-dev-layout', 'dev.debugLayout');

            const desktopRadios = container.querySelectorAll('input[name="dev-desktop"]');
            if (desktopRadios && SettingsService) {
                desktopRadios.forEach(radio => {
                    radio.onchange = (e) => {
                        if (e.target.checked) {
                            SettingsService.setSetting('dev.desktopEnvironment', e.target.value);
                            if (DialogService) {
                                DialogService.alert('Desktop Environment changed. A session restart is required for changes to take effect.', 'Developer Options');
                            }
                        }
                    };
                });
            }
        };

        
        // --- STARTUP APPS ---
        const renderStartupApps = () => {
            if (!StartupApplicationService) {
                return `<h3>Startup Applications</h3>` + omni_card(omni_listItem('Startup application service is currently unavailable.', '', ''));
            }

            const startupApps = StartupApplicationService.getStartupApplications();
            
            if (startupApps.length === 0) {
                return `<h3>Startup Applications</h3>` + omni_card(omni_listItem('No applications are currently registered to start automatically.', '', ''));
            }

            return `
                <h3>Startup Applications</h3>
                <p style="margin-bottom: 1rem; color: var(--lde-text); opacity: 0.8; font-size: 0.9em;">
                    These applications have requested to launch automatically when you log in.
                </p>
                <div class="startup-apps-card-container"></div>
            `;
        };

        const bindStartupApps = (container) => {
            if (!StartupApplicationService) return;

            const cardContainer = container.querySelector('.startup-apps-card-container');
            if (!cardContainer) return;

            const startupApps = StartupApplicationService.getStartupApplications();

            const cardElement = document.createElement('div');
            cardElement.className = 'comp-card';

            startupApps.forEach(app => {
                const item = document.createElement('div');
                item.className = 'layout-h flex-align-center flex-gap-16';

                const contentDiv = document.createElement('div');
                contentDiv.className = 'layout-v flex-1 flex-gap-2';
                
                const titleDiv = document.createElement('p');
                titleDiv.textContent = app.title; // Safe text
                contentDiv.appendChild(titleDiv);

                const descDiv = document.createElement('small');
                descDiv.textContent = app.reason; // Safe text
                contentDiv.appendChild(descDiv);

                item.appendChild(contentDiv);

                // Build toggle input programmatically
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'startup-toggle';
                input.setAttribute('data-id', app.id);
                input.checked = app.isEnabled;
                input.addEventListener('change', async (e) => {
                    const appId = e.target.getAttribute('data-id');
                    const isEnabled = e.target.checked;
                    await StartupApplicationService.setStartupEnabled(appId, isEnabled);
                });

                const toggleContainer = document.createElement('div');
                toggleContainer.appendChild(input);
                
                item.appendChild(toggleContainer);
                cardElement.appendChild(item);
            });

            cardContainer.appendChild(cardElement);
        };

        // --- APPLICATIONS ---
        const renderApplications = () => {
            if (!ApplicationService) {
                return `<h3>Installed Applications</h3>` + omni_card(omni_listItem('Application service is currently unavailable.', '', ''));
            }
            const TrustService = registry.get('TrustService');
            const installedApps = ApplicationService.getInstalledApplications();
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

                const secondaryLabel = `v${app.version || '1.0.0'} Ã¢â‚¬Â¢ <span class="tag ${statusBadgeClass}">${statusText}</span>`;
                
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
                ${renderStartupApps()}
            `;
        };

        const bindApplications = (container) => {
            bindStartupApps(container);
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

                    try {
                        UserProfileService.updateProfile(session.user.username, {
                            displayName: newName || session.user.username
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
            
            const desc = document.createElement('div');
            desc.className = "dialog-description";
            desc.textContent = `Are you sure you want to delete the user account "${username}"?`;
            form.appendChild(desc);

            const labelKeep = document.createElement('label');
            labelKeep.className = "dialog-radio-option";
            
            const radioKeep = document.createElement('input');
            radioKeep.type = "radio";
            radioKeep.name = "del-home";
            radioKeep.value = "keep";
            radioKeep.checked = true;
            
            labelKeep.appendChild(radioKeep);
            labelKeep.appendChild(document.createTextNode(' Keep Home Folder'));
            form.appendChild(labelKeep);

            const labelDelete = document.createElement('label');
            labelDelete.className = "dialog-radio-option";

            const radioDelete = document.createElement('input');
            radioDelete.type = "radio";
            radioDelete.name = "del-home";
            radioDelete.value = "delete";

            labelDelete.appendChild(radioDelete);
            labelDelete.appendChild(document.createTextNode(' Delete Home Folder'));
            form.appendChild(labelDelete);

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

        const triggerRefresh = async () => {
            const viewport = win.contentElement.querySelector(`#settings-content-viewport-${win.id}`);
            if (!viewport) return;

            let contentHtml = '';
            let binderFn = null;

            switch (activeTabId) {
                case 'home':
                    contentHtml = renderHome();
                    break;
                case 'system':
                    contentHtml = await renderSystem();
                    binderFn = bindSystem;
                    break;
                case 'info':
                    contentHtml = renderInfo();
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
                    'info': 'info',
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
        if (ProcessService) {
            ProcessService.registerInstance({
                handleIntent: async (intent) => {
                    await executeIntent(intent);
                }
            });
        }

        const launchContext = registry.getLaunchContext();
        if (launchContext && launchContext.intent) {
            await executeIntent(launchContext.intent);
        }

        // ========================================
        // Application Initialization & Startup
        // ========================================
        renderShell();
        updateSidebar();
        triggerRefresh();
    },

    onIntent: async (registry, intent) => {
        const ProcessService = registry.get('ProcessService');
        if (!ProcessService) return;
        const appInstance = ProcessService.getInstance();
        if (appInstance && typeof appInstance.handleIntent === 'function') {
            await appInstance.handleIntent(intent);
        }
    }
};