import { 
    omni_card, 
    omni_preferenceItem, 
    omni_listItem, 
    omni_searchbar, 
    omni_sidebarTab,
    omni_button,
    omni_group
} from '../../platform/settings/SettingsComponents.js';

/**
 * Software Center Application
 *
 * Responsibility:
 * Provides a unified app store interface for discovering, installing, 
 * and managing system packages and applications.
 * Bounded inside a strict 512px content wrapper to maintain shell grid uniformity[cite: 14].
 */
export default {
    run: async (registry, pid, options = {}) => {
        // ========================================
        // Service Retrieval & Verification
        // ========================================
        const WindowService = registry.get('WindowService');
        const RepositoryService = registry.get('RepositoryService');
        const ApplicationService = registry.get('ApplicationService');
        const TrustService = registry.get('TrustService');
        const FileService = registry.get('FileService');
        const PackageService = registry.get('PackageService');
        const CapabilityService = registry.get('CapabilityService');
        const NetworkService = registry.get('NetworkService');
        const DialogService = registry.get('DialogService');

        if (!WindowService) {
            console.error('[SoftwareCenter] Essential WindowService is missing.');
            return;
        }

        const win = WindowService.createWindow({
            title: 'Software Center',
            width: 840,
            height: 560,
            pid
        });

        const dialogCapability = CapabilityService ? CapabilityService.get('dialogs') : null;
        const triggerAlert = async (message, title) => {
            if (DialogService) {
                await DialogService.alert(message, title);
            } else if (dialogCapability) {
                dialogCapability.alert(message, title);
            } else {
                console.warn(`[${title}] ${message}`);
            }
        };

        // ========================================
        // Local Application State
        // ========================================
        let activeTabId = 'discover'; // 'discover' | 'installed'
        let searchQuery = '';

        if (RepositoryService) {
            RepositoryService.refresh().then(() => {
                triggerRefresh();
            }).catch(err => {
                console.error('[SoftwareCenter] Initial repo sync failed:', err);
            });
        }

        // ========================================
        // Application Operation Actions
        // ========================================
        const handleInstall = async (targetButton, packageId, downloadUrl) => {
            targetButton.disabled = true;
            targetButton.innerHTML = '<i>&#xE118;</i><span>Installing...</span>';

            try {
                if (!NetworkService || !FileService || !PackageService) {
                    throw new Error('Required execution services are unavailable.');
                }

                const response = await NetworkService.fetch(downloadUrl);
                if (!response.ok) {
                    throw new Error('Package download payload fetch failed.');
                }
                const pkgData = await response.text();
                
                const tmpPath = `/tmp/${packageId}.ldepkg`;
                if (!await FileService.exists('/tmp')) {
                    await FileService.createDirectory('/tmp');
                }
                await FileService.writeFile(tmpPath, pkgData);
                
                await PackageService.installPackage(tmpPath);
                await triggerAlert('Installation completed successfully!', 'Software Center');
                triggerRefresh();
            } catch (err) {
                await triggerAlert(`Installation failed: ${err.message}`, 'Software Center Error');
                triggerRefresh();
            }
        };

        const handleUninstall = async (targetButton, packageId) => {
            targetButton.disabled = true;
            targetButton.innerHTML = '<i>&#xE74D;</i><span>Uninstalling...</span>';

            try {
                if (!PackageService) {
                    throw new Error('Package subsystem is unavailable.');
                }
                await PackageService.uninstallPackage(packageId);
                await triggerAlert('Uninstallation completed successfully!', 'Software Center');
                triggerRefresh();
            } catch (err) {
                await triggerAlert(`Uninstallation failed: ${err.message}`, 'Software Center Error');
                triggerRefresh();
            }
        };

        // ========================================
        // Orchestration & Presentation Layer
        // ========================================
        const renderShell = () => {
            const container = document.createElement('div');
            container.className = 'omni-layout-row';

            container.innerHTML = `
                <!-- Left Panel: Sidebar Navigation -->
                <div id="sc-sidebar-${win.id}" class="omni-panel-1">
                    <!-- Nav tabs load dynamically -->
                </div>

                <!-- Right Panel: Viewport Workspace Content -->
                <div class="omni-panel-2">
                    <!-- Strict Content Footprint Boundary Constraint Layer -->
                    <div class="layout-max-w-512px">
                        <div id="sc-content-viewport-${win.id}" class="layout-v flex-gap-8 omni-panel-fill">
                            <!-- Component cards and inputs render here -->
                        </div>
                    </div>
                </div>
            `;

            win.contentElement.appendChild(container);
        };

        const updateSidebar = () => {
            const sidebarEl = win.contentElement.querySelector(`#sc-sidebar-${win.id}`);
            if (!sidebarEl) return;

            sidebarEl.innerHTML = '';

            let tabsHtml = '';
            tabsHtml += omni_sidebarTab('discover', activeTabId === 'discover', '&#xE8A1;', 'Discover');
            tabsHtml += omni_sidebarTab('installed', activeTabId === 'installed', '&#xE762;', 'Installed');

            sidebarEl.innerHTML = omni_group('Apps', tabsHtml);

            sidebarEl.querySelectorAll('.comp-sidebartab').forEach(tab => {
                tab.onclick = () => {
                    activeTabId = tab.dataset.id;
                    searchQuery = ''; 
                    updateSidebar();
                    triggerRefresh();
                };
            });
        };

        // --- DISCOVER TAB RENDERING ---
        const renderDiscover = () => {
            if (!RepositoryService || !ApplicationService) {
                return `<h3>Discover Apps</h3>` + omni_card(omni_listItem('Software repository indexes are currently offline.', '', ''));
            }

            const availablePackages = RepositoryService.getPackages() || [];
            const installedApps = ApplicationService.getInstalledApplications() || [];
            const installedIds = new Set(installedApps.map(app => app.id));

            let cardsHtml = '';
            let processingCount = 0;

            for (let i = 0; i < availablePackages.length; i++) {
                const pkg = availablePackages[i];

                const matchesSearch = !searchQuery || 
                    pkg.title.toLowerCase().includes(searchQuery) || 
                    pkg.description.toLowerCase().includes(searchQuery);

                if (!matchesSearch) continue;
                processingCount++;

                const isInstalled = installedIds.has(pkg.id);
                const trustMeta = TrustService ? TrustService.getTrustMetadata(pkg.id) : null;
                const trustLabel = trustMeta ? (trustMeta.publisher || trustMeta.state) : (pkg.author || 'Unknown');
                const isDeletable = !trustMeta || trustMeta.state !== 'BUILT_IN';

                let trustStateClass = 'text-secondary';
                if (isInstalled && trustMeta) {
                    if (trustMeta.state === 'BUILT_IN' || trustMeta.state === 'TRUSTED') {
                        trustStateClass = 'text-success';
                    } else {
                        trustStateClass = 'text-warning';
                    }
                }

                const secondaryLabel = `v${pkg.version} • By <span class="${trustStateClass}">${trustLabel}</span>`;
                
                let actionBtnHtml = '';
                if (isInstalled) {
                    if (isDeletable) {
                        actionBtnHtml = omni_button('', '&#xE74D;', 'Uninstall', 'danger', 'uninstall-action-btn');
                    } else {
                        actionBtnHtml = omni_button('', '&#xE72E;', 'System Locked', '', '', true);
                    }
                } else {
                    actionBtnHtml = omni_button('', '&#xE896;', 'Install', 'primary', 'install-action-btn');
                }

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = actionBtnHtml;
                tempDiv.querySelectorAll('button').forEach(btn => {
                    btn.dataset.id = pkg.id;
                    btn.dataset.download = pkg.download || '';
                });

                cardsHtml += omni_preferenceItem(
                    pkg.title,
                    pkg.description,
                    secondaryLabel,
                    tempDiv.innerHTML
                );
            }

            if (processingCount === 0) {
                cardsHtml = omni_listItem('No software packages match your criteria.', 'Verify selection keywords or check repository availability.', '');
            }

            return `
                <h3>Discover Applications</h3>
                ${omni_searchbar(`sc-search-${win.id}`, 'Search online catalog packages...', searchQuery)}
                ${omni_card(cardsHtml)}
            `;
        };

        // --- INSTALLED TAB RENDERING ---
        const renderInstalled = () => {
            if (!ApplicationService) {
                return `<h3>Installed Apps</h3>` + omni_card(omni_listItem('Application tracking subsystems are unresponsive.', '', ''));
            }

            const installedApps = ApplicationService.getInstalledApplications() || [];
            let cardsHtml = '';
            let processingCount = 0;

            for (let i = 0; i < installedApps.length; i++) {
                const app = installedApps[i];
                const appTitle = app.name || app.id;
                const appDescription = app.description || 'No description information provided.';

                const matchesSearch = !searchQuery || 
                    appTitle.toLowerCase().includes(searchQuery) || 
                    appDescription.toLowerCase().includes(searchQuery);

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
                ${omni_searchbar(`sc-search-${win.id}`, 'Search installed computer tools...', searchQuery)}
                ${omni_card(cardsHtml)}
            `;
        };

        const triggerRefresh = () => {
            const viewport = win.contentElement.querySelector(`#sc-content-viewport-${win.id}`);
            if (!viewport) return;

            if (activeTabId === 'discover') {
                viewport.innerHTML = renderDiscover();
            } else {
                viewport.innerHTML = renderInstalled();
            }

            const searchField = viewport.querySelector(`#sc-search-${win.id}`);
            if (searchField) {
                searchField.oninput = (e) => {
                    searchQuery = e.target.value.toLowerCase();
                    triggerRefresh();
                    const restoredField = win.contentElement.querySelector(`#sc-search-${win.id}`);
                    if (restoredField) {
                        restoredField.focus();
                        restoredField.value = e.target.value;
                    }
                };
            }

            viewport.querySelectorAll('.install-action-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    handleInstall(btn, btn.dataset.id, btn.dataset.download);
                };
            });

            viewport.querySelectorAll('.uninstall-action-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    handleUninstall(btn, btn.dataset.id);
                };
            });
        };

        // ========================================
        // Intent Handling
        // ========================================
        const executeIntent = async (intent) => {
            if (intent && intent.type === 'software.open' && intent.payload && intent.payload.tab) {
                if (intent.payload.tab === 'installed') {
                    activeTabId = 'installed';
                } else {
                    activeTabId = 'discover';
                }
                updateSidebar();
                triggerRefresh();
            }
        };

        const ProcessService = registry.get('ProcessService');
        const proc = ProcessService ? ProcessService.getProcess(pid) : null;
        if (proc) {
            proc.handleIntent = async (intent) => {
                await executeIntent(intent);
            };
        }

        if (options && options.intent) {
            await executeIntent(options.intent);
        }

        // ========================================
        // Application Initialization & Lifecycle
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