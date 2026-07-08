import { createSettingSection, createSettingGroup, createSettingRow, createSettingInfoCard, createSettingButton, createSettingInput } from '../../ui/SettingsComponents.js';
import { SYSTEM_INFO } from '../../system/SystemVersion.js';

/**
 * Phase 8: Settings System Application (Redesigned)
 * 
 * Responsibility: Configure system settings and view system information.
 */
export default {
    run: async (registry, pid) => {
        const WindowService = registry.get('WindowService');
        const SettingsService = registry.get('SettingsService');
        const FileService = registry.get('FileService');
        const DiskService = registry.get('DiskService');
        const SessionService = registry.get('SessionService');

        if (!WindowService || !SettingsService || !FileService || !DiskService || !SessionService) {
            console.error('[Settings] Required services missing.');
            return;
        }

        const win = WindowService.createWindow({
            title: 'Settings',
            width: 750,
            height: 550,
            pid
        });

        const render = () => {
            const wallpaperColor = SettingsService.getSetting('desktop.wallpaper') || '#0f0f0f';
            const usage = FileService.getUsage();
            const capacity = FileService.getCapacity();
            const usagePercent = Math.min(100, Math.round((usage / capacity) * 100));
            const formatBytes = (bytes) => {
                if (bytes < 1024) return bytes + ' B';
                if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
                return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
            };
            const diskInfo = DiskService.getDiskInfo();
            const session = SessionService.getCurrentSession();
            const username = session ? session.user.username : 'Unknown';

            const sidebarGroups = [
                {
                    label: 'System',
                    items: [
                        { id: 'general', label: 'General', active: true },
                        { id: 'storage', label: 'Storage' },
                        { id: 'users', label: 'Users' },
                        { id: 'about', label: 'About' }
                    ]
                },
                {
                    label: 'Desktop',
                    items: [
                        { id: 'personalization', label: 'Personalization' }
                    ]
                },
                {
                    label: 'Future (Series 2)',
                    items: [
                        { id: 'network', label: 'Network', disabled: true },
                        { id: 'apps', label: 'Applications', disabled: true },
                        { id: 'notifications', label: 'Notifications', disabled: true },
                        { id: 'privacy', label: 'Privacy', disabled: true },
                        { id: 'accessibility', label: 'Accessibility', disabled: true },
                        { id: 'updates', label: 'Updates', disabled: true }
                    ]
                }
            ];

            const sidebarHtml = sidebarGroups.map(group => `
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--lde-text-secondary); margin-bottom: 8px; padding-left: 8px;">${group.label}</div>
                    <div class="v-layout flex-gap-4">
                        ${group.items.map(item => `
                            <button class="lde-btn ${item.active ? 'lde-btn-primary' : ''} settings-nav-btn" data-target="${item.id}" style="text-align: left; justify-content: flex-start; padding-left: 12px; ${item.disabled ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${item.disabled ? 'disabled' : ''}>
                                ${item.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `).join('');

            const generalTab = createSettingSection('General Settings', 'Configure your basic system preferences.', 
                createSettingGroup(
                    createSettingRow('Device Name', 'How this computer appears on a network', createSettingInput('settings-devicename', 'LDE-PC', true)) +
                    createSettingRow('System Language', 'Primary language for apps and UI', `<select class="lde-input" disabled><option>English (US)</option></select>`, true)
                )
            );

            const usersTab = createSettingSection('Users', 'Manage local accounts on this computer.',
                createSettingGroup(
                    createSettingRow('Current Session', 'The user currently logged in', createSettingInput('settings-username', username, true)) +
                    createSettingRow('Account Type', 'Permissions level', `<select class="lde-input" disabled><option>Administrator</option></select>`, true)
                )
            );

            const personalizationTab = createSettingSection('Personalization', 'Customize the look and feel of your workspace.',
                createSettingGroup(
                    createSettingRow('Desktop Background', 'Solid color behind your windows', 
                        `<div style="display: flex; gap: 8px;">
                            <input type="color" id="settings-wallpaper-color" value="${wallpaperColor}" style="width: 32px; height: 32px; padding: 0; border: none; cursor: pointer; border-radius: var(--lde-radius-sm); background: transparent;">
                            ${createSettingButton('settings-wallpaper-apply', 'Apply', 'primary')}
                        </div>`, true
                    )
                )
            );

            const storageTab = createSettingSection('Storage & Disk', 'Manage Local Storage usage and disk snapshots.',
                createSettingGroup(
                    createSettingRow('Local Storage Used', `${usagePercent}% of quota`, 
                        `<div style="width: 150px;">
                            <div style="width: 100%; height: 6px; background: var(--lde-bg-base); border-radius: var(--lde-radius-full); overflow: hidden; border: 1px solid var(--lde-border); margin-bottom: 4px;">
                                <div style="width: ${usagePercent}%; height: 100%; background: var(--lde-accent);"></div>
                            </div>
                            <div style="font-family: var(--lde-font-mono); font-size: 0.75rem; text-align: right; color: var(--lde-text-secondary);">${formatBytes(usage)} / ${formatBytes(capacity)}</div>
                        </div>`
                    ) +
                    createSettingRow('Disk Version', 'LRFS Virtual File System format version', `<span style="font-family: var(--lde-font-mono);">v${diskInfo.version}</span>`) +
                    createSettingRow('Snapshots', 'Total historical checkpoints', `<span style="font-family: var(--lde-font-mono);">${diskInfo.snapshotCount}</span>`, true)
                )
            );

            const aboutTab = createSettingSection('About LDE', 'System information and version details.',
                createSettingInfoCard('🌌', SYSTEM_INFO.name, `Version ${SYSTEM_INFO.version} (${SYSTEM_INFO.architecture})<br>Codename: ${SYSTEM_INFO.codename}`) +
                `<div style="margin-top: 24px;">` +
                createSettingGroup(
                    createSettingRow('Core Architecture', 'Data-Driven State', 'Active') +
                    createSettingRow('Window System', 'DOM Compositor', 'Active') +
                    createSettingRow('Process Protection', 'Metadata-Driven', 'Active', true)
                ) +
                `</div>`
            );

            win.contentElement.innerHTML = `
            <div class="lde-app-container lde-sidebar-layout" style="height: 100%;">
                <div class="lde-sidebar" style="width: 220px; border-right: 1px solid var(--lde-border); padding-right: 16px; overflow-y: auto;">
                    ${sidebarHtml}
                </div>
                <div class="lde-sidebar-content" style="padding-left: 24px; padding-top: 8px; overflow-y: auto;">
                    <div id="page-general" class="settings-page">${generalTab}</div>
                    <div id="page-storage" class="settings-page" style="display: none;">${storageTab}</div>
                    <div id="page-users" class="settings-page" style="display: none;">${usersTab}</div>
                    <div id="page-about" class="settings-page" style="display: none;">${aboutTab}</div>
                    <div id="page-personalization" class="settings-page" style="display: none;">${personalizationTab}</div>
                </div>
            </div>`;

            // Bind Navigation
            const navBtns = Array.from(win.contentElement.querySelectorAll('.settings-nav-btn'));
            const pages = Array.from(win.contentElement.querySelectorAll('.settings-page'));

            navBtns.forEach(btn => {
                if (btn.disabled) return;
                btn.addEventListener('click', () => {
                    navBtns.forEach(b => b.classList.remove('lde-btn-primary'));
                    btn.classList.add('lde-btn-primary');
                    
                    pages.forEach(p => p.style.display = 'none');
                    const targetPage = win.contentElement.querySelector(`#page-${btn.dataset.target}`);
                    if (targetPage) targetPage.style.display = 'block';
                });
            });

            // Bind Actions
            const applyBtn = win.contentElement.querySelector('#settings-wallpaper-apply');
            if (applyBtn) {
                applyBtn.onclick = () => {
                    const color = win.contentElement.querySelector('#settings-wallpaper-color').value;
                    SettingsService.setSetting('desktop.wallpaper', color);
                };
            }
        };

        render();
    }
};
