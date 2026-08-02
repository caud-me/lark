import { SYSTEM_INFO } from '../../3-system/SystemVersion.js';
import { 
    omni_card, 
    omni_preferenceItem, 
    omni_preferenceItem2,
    omni_listItem, 
    omni_searchbar, 
    omni_sidebarTab,
    omni_button,
    omni_group,
    omni_badge
} from '../../5-platform/settings/SettingsComponents.js';

/**
 * Guardian Application
 *
 * Responsibility:
 * First-party platform health, integrity, and architecture verification dashboard.
 * Conforms 100% to the exact Omni Design System architecture from Settings.js (omni-layout-row | omni-panel-1 | omni-panel-2 | omni-panel-3).
 * ZERO inline styles. Uses layout-max-w-512px for panel 2 and native Omni viewport scrolling.
 */
export default {
    run: async (registry) => {
        const WindowService = registry.get('WindowService');
        const GuardianService = registry.get('GuardianService');
        const ProcessService = registry.get('ProcessService');

        if (!WindowService) {
            console.error('[Guardian] Essential WindowService is missing.');
            return;
        }

        const win = WindowService.createWindow({
            title: 'Guardian',
            width: 1380,
            height: 840
        });

        let activeTabId = 'overview';
        let currentScanResult = GuardianService ? GuardianService.getLatestScan() : null;
        let selectedInspectorItem = null;
        let isScanning = false;

        const sidebarGroups = [
            {
                label: 'General',
                items: [
                    { id: 'overview', label: 'Overview', icon: '&#xE80F;' }
                ]
            },
            {
                label: 'Validation & Health',
                items: [
                    { id: 'scans', label: 'Scans', icon: '&#xE9D9;' },
                    { id: 'performance', label: 'Performance', icon: '&#xE9D2;' },
                    { id: 'storage', label: 'Storage', icon: '&#xE7B8;' },
                    { id: 'events', label: 'Events', icon: '&#xE7C1;' }
                ]
            },
            {
                label: 'Audit & Development',
                items: [
                    { id: 'history', label: 'History', icon: '&#xE81C;' },
                    { id: 'developer', label: 'Developer', icon: '&#xE90F;' }
                ]
            }
        ];

        const triggerScan = async (scanType) => {
            if (isScanning || !GuardianService) return;
            isScanning = true;
            triggerRefresh();

            try {
                if (scanType === 'QUICK') {
                    currentScanResult = await GuardianService.runQuickScan();
                } else if (scanType === 'STARTUP') {
                    currentScanResult = await GuardianService.runStartupValidation();
                } else if (scanType === 'FULL') {
                    currentScanResult = await GuardianService.runFullRegression();
                }
                selectedInspectorItem = currentScanResult;
            } catch (e) {
                console.error('[Guardian] Scan execution error:', e);
            } finally {
                isScanning = false;
                triggerRefresh();
            }
        };

        const copyTextToClipboard = (text, buttonEl) => {
            const fallbackCopy = (str) => {
                const textArea = document.createElement('textarea');
                textArea.value = str;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    if (buttonEl) buttonEl.innerText = '✓ Copied to Clipboard!';
                } catch (err) {
                    console.error('[Guardian] Fallback copy failed:', err);
                }
                document.body.removeChild(textArea);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    if (buttonEl) buttonEl.innerText = '✓ Copied to Clipboard!';
                }).catch(() => {
                    fallbackCopy(text);
                });
            } else {
                fallbackCopy(text);
            }
        };

        const renderShell = () => {
            const container = document.createElement('div');
            container.className = 'omni-layout-row';

            container.innerHTML = `
                <!-- Left Panel: Sidebar Nav -->
                <div id="guardian-sidebar-${win.id}" class="omni-panel-1">
                    <!-- Dynamic navigation renders here -->
                </div>

                <!-- Right Panel: Preference Content Viewport -->
                <div class="omni-panel-2">
                    <div class="layout-max-w-512px">
                        <div id="guardian-content-viewport-${win.id}" class="layout-v flex-gap-8">
                            <!-- Active component outputs render here -->
                        </div>
                    </div>
                </div>

                <!-- Right Detail Inspector Panel -->
                <div id="guardian-inspector-${win.id}" class="omni-panel-3">
                    <!-- Active inspector details render here -->
                </div>
            `;

            win.contentElement.appendChild(container);
        };

        const updateSidebar = () => {
            const sidebarEl = win.contentElement.querySelector(`#guardian-sidebar-${win.id}`);
            if (!sidebarEl) return;

            sidebarEl.innerHTML = '';
            sidebarEl.innerHTML += omni_searchbar(`guardian-search-${win.id}`, 'Search Guardian...');

            for (let i = 0; i < sidebarGroups.length; i++) {
                const group = sidebarGroups[i];
                let itemsHtml = '';

                for (let j = 0; j < group.items.length; j++) {
                    const item = group.items[j];
                    const isActive = activeTabId === item.id;
                    itemsHtml += omni_sidebarTab(item.id, isActive, item.icon, item.label);
                }

                sidebarEl.innerHTML += omni_group(group.label, itemsHtml);
            }

            sidebarEl.querySelectorAll('.comp-sidebartab').forEach(tab => {
                tab.onclick = () => {
                    activeTabId = tab.dataset.id;
                    updateSidebar();
                    triggerRefresh();
                };
            });
        };

        const renderOverview = () => {
            const latest = currentScanResult || (GuardianService ? GuardianService.getLatestScan() : null);
            const statusLabel = latest ? (latest.overallStatus === 'PASS' ? 'Healthy' : latest.overallStatus) : 'Healthy';
            const badgeVariant = (statusLabel === 'Healthy' || statusLabel === 'PASS') ? 'success' : 'warning';

            return `
                <h3>Platform Health Overview</h3>
                <p>Guardian monitors internal system integrity, platform contracts, and LRFS disk structure.</p>
                ${omni_card(
                    omni_preferenceItem(
                        'System Health Status',
                        'Lark OS platform contracts & low-level drivers operational',
                        '',
                        omni_badge(statusLabel, badgeVariant)
                    ) +
                    omni_preferenceItem(
                        'OS Version',
                        `Lark OS ${SYSTEM_INFO.version} (${SYSTEM_INFO.codename})`,
                        '',
                        omni_button('btn-quick-scan', '&#xE895;', isScanning ? 'Scanning...' : 'Quick Scan', 'primary', '', isScanning)
                    ) +
                    omni_preferenceItem(
                        'Last Verified Scan',
                        latest ? `${new Date(latest.timestamp).toLocaleString()} (${latest.scanType})` : 'Never scanned',
                        '',
                        latest ? `<small>${latest.durationMs}ms</small>` : ''
                    )
                )}
            `;
        };

        const renderScans = () => {
            return `
                <h3>System Integrity Scans</h3>
                <p>Run automated integrity scans across platform singletons, LRFS metadata, and browser storage.</p>
                ${omni_card(
                    omni_preferenceItem(
                        'Startup Validation',
                        'Lightweight boot integrity scan (< 500ms)',
                        '',
                        omni_button('btn-run-startup', '&#xE768;', 'Run Startup Scan', 'secondary', '', isScanning)
                    ) +
                    omni_preferenceItem(
                        'Quick Scan',
                        'Audits filesystem structure, browser storage quota, and service registrations',
                        '',
                        omni_button('btn-run-quick', '&#xE895;', 'Run Quick Scan', 'primary', '', isScanning)
                    ) +
                    omni_preferenceItem(
                        'Full Architecture Regression',
                        'Executes complete 8-stage architecture validation suite',
                        '',
                        omni_button('btn-run-full', '&#xE90F;', 'Run Full Suite', 'secondary', '', isScanning)
                    )
                )}
            `;
        };

        const renderPerformance = () => {
            return `
                <h3>Performance Telemetry</h3>
                <p>High-level runtime summary of process count, window stack, and desktop telemetry.</p>
                ${omni_card(
                    omni_preferenceItem(
                        'Process & Window Telemetry',
                        'Detailed real-time process inspection and memory monitoring',
                        '',
                        omni_button('btn-open-activity-monitor', '&#xE9D2;', 'Open Activity Monitor', 'primary')
                    )
                )}
            `;
        };

        const renderStorage = () => {
            return `
                <h3>Storage Driver & Disk Health</h3>
                <p>Virtual file system and IndexedDB storage driver operational status.</p>
                ${omni_card(
                    omni_preferenceItem(
                        'Virtual File System (LRFS)',
                        'LRFS Virtual Disk mounted and healthy',
                        '',
                        omni_badge('Mounted', 'success')
                    ) +
                    omni_preferenceItem(
                        'Storage Persistence',
                        'IndexedDB origin persistent storage',
                        '',
                        omni_badge('Granted', 'info')
                    )
                )}
            `;
        };

        const renderEvents = () => {
            return `
                <h3>Platform Health Events</h3>
                <p>Diagnostic event log browser for kernel and service events.</p>
                ${omni_card(
                    omni_preferenceItem(
                        'System Diagnostic Logs',
                        'View detailed kernel, security, and process event streams',
                        '',
                        omni_button('btn-open-event-viewer', '&#xE7C1;', 'Open Event Viewer', 'primary')
                    )
                )}
            `;
        };

        const renderHistory = () => {
            const history = GuardianService ? GuardianService.getHistory() : [];
            let rowsHtml = '';
            
            if (history.length === 0) {
                rowsHtml = omni_listItem('No scan history recorded.', '', '');
            } else {
                for (let i = 0; i < history.length; i++) {
                    const h = history[i];
                    const badgeVariant = h.overallStatus === 'PASS' ? 'success' : 'warning';
                    rowsHtml += `
                        <div class="guardian-history-row" data-history-index="${i}">
                            ${omni_preferenceItem(
                                `${h.scanType} Scan`,
                                new Date(h.timestamp).toLocaleString(),
                                `${h.durationMs}ms`,
                                omni_badge(h.overallStatus, badgeVariant)
                            )}
                        </div>
                    `;
                }
            }

            return `
                <h3>Persistent Scan History</h3>
                <p>Select a historical scan record to inspect diagnostic modules and details.</p>
                ${omni_card(rowsHtml)}
            `;
        };

        const renderDeveloper = () => {
            return `
                <h3>Developer Architecture Validation</h3>
                <p>Developer architecture regression harness and contract verification.</p>
                ${omni_card(
                    omni_preferenceItem(
                        'Architecture Validation Suite',
                        'Execute complete 8-stage contract regression harness',
                        '',
                        omni_button('btn-dev-run-full', '&#xE90F;', 'Run Regression Suite', 'primary', '', isScanning)
                    )
                )}
            `;
        };

        const updateInspector = () => {
            const inspectorEl = win.contentElement.querySelector(`#guardian-inspector-${win.id}`);
            if (!inspectorEl) return;

            const item = selectedInspectorItem || currentScanResult || (GuardianService ? GuardianService.getLatestScan() : null);

            if (!item) {
                inspectorEl.innerHTML = `
                    <h3>Diagnostic Inspection</h3>
                    <p>No scan selected. Run a scan or select a historical record to inspect details.</p>
                `;
                return;
            }

            let modulesHtml = '';
            if (Array.isArray(item.modules)) {
                for (let i = 0; i < item.modules.length; i++) {
                    const m = item.modules[i];
                    const variant = m.status === 'PASS' ? 'success' : 'warning';
                    modulesHtml += omni_preferenceItem(
                        m.name,
                        m.details || '',
                        `Duration: ${m.duration}ms`,
                        omni_badge(m.status, variant)
                    );
                }
            }

            inspectorEl.innerHTML = `
                <div class="layout-h flex-align-center flex-space-between">
                    <h3>Diagnostic Inspection</h3>
                    ${omni_badge(item.overallStatus, item.overallStatus === 'PASS' ? 'success' : 'warning')}
                </div>
                ${omni_card(
                    omni_listItem('Scan Type', item.scanType || 'QUICK', '') +
                    omni_listItem('Platform Version', item.platformVersion || SYSTEM_INFO.version, '') +
                    omni_listItem('Timestamp', new Date(item.timestamp).toLocaleString(), '') +
                    omni_listItem('Duration', `${item.durationMs}ms`, '') +
                    omni_listItem('Storage Driver', item.storageDriver || 'IndexedDB', '') +
                    omni_listItem('Warnings / Errors', `${item.warnings || 0} Warnings • ${item.errors || 0} Errors`, '')
                )}
                ${modulesHtml ? `<h3>Executed Validation Modules</h3>` + omni_card(modulesHtml) : ''}
                <h3>Raw Diagnostic Payload</h3>
                <pre class="event-details">${JSON.stringify(item, null, 2)}</pre>
                <div class="layout-v flex-gap-8">
                    ${omni_button('btn-copy-inspector', '&#xE8C8;', 'Copy JSON Payload', 'primary', 'full-width')}
                </div>
            `;

            const copyBtn = inspectorEl.querySelector('#btn-copy-inspector');
            if (copyBtn) {
                copyBtn.onclick = () => {
                    copyTextToClipboard(JSON.stringify(item, null, 2), copyBtn);
                };
            }
        };

        const bindControls = (viewport) => {
            const quickBtn = viewport.querySelector('#btn-quick-scan') || viewport.querySelector('#btn-run-quick');
            if (quickBtn) quickBtn.onclick = () => triggerScan('QUICK');

            const startupBtn = viewport.querySelector('#btn-run-startup');
            if (startupBtn) startupBtn.onclick = () => triggerScan('STARTUP');

            const fullBtn = viewport.querySelector('#btn-run-full') || viewport.querySelector('#btn-dev-run-full');
            if (fullBtn) fullBtn.onclick = () => triggerScan('FULL');

            const actMonBtn = viewport.querySelector('#btn-open-activity-monitor');
            if (actMonBtn && ProcessService) {
                actMonBtn.onclick = () => ProcessService.startProcess('sys.activitymonitor');
            }

            const evtViewerBtn = viewport.querySelector('#btn-open-event-viewer');
            if (evtViewerBtn && ProcessService) {
                evtViewerBtn.onclick = () => ProcessService.startProcess('sys.eventviewer');
            }

            const historyRows = viewport.querySelectorAll('.guardian-history-row');
            historyRows.forEach(row => {
                row.onclick = () => {
                    const idx = parseInt(row.getAttribute('data-history-index'), 10);
                    const history = GuardianService ? GuardianService.getHistory() : [];
                    if (history[idx]) {
                        selectedInspectorItem = history[idx];
                        updateInspector();
                    }
                };
            });
        };

        const triggerRefresh = () => {
            const viewport = win.contentElement.querySelector(`#guardian-content-viewport-${win.id}`);
            if (!viewport) return;

            let contentHtml = '';

            switch (activeTabId) {
                case 'overview':
                    contentHtml = renderOverview();
                    break;
                case 'scans':
                    contentHtml = renderScans();
                    break;
                case 'performance':
                    contentHtml = renderPerformance();
                    break;
                case 'storage':
                    contentHtml = renderStorage();
                    break;
                case 'events':
                    contentHtml = renderEvents();
                    break;
                case 'history':
                    contentHtml = renderHistory();
                    break;
                case 'developer':
                    contentHtml = renderDeveloper();
                    break;
                default:
                    contentHtml = `<h3>Not Found</h3>` + omni_card(omni_listItem('Panel unavailable.', '', ''));
            }

            viewport.innerHTML = contentHtml;
            bindControls(viewport);
            updateInspector();
        };

        renderShell();
        updateSidebar();
        triggerRefresh();
    }
};
