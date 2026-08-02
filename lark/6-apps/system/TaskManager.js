import { 
    omni_card, 
    omni_preferenceItem, 
    omni_listItem, 
    omni_searchbar, 
    omni_sidebarTab,
    omni_button,
    omni_group,
    omni_badge
} from '../../5-platform/settings/SettingsComponents.js';

/**
 * Activity Monitor Application (sys.activitymonitor)
 *
 * Release 27.8.12 — Developer Tooling & Runtime Visibility Upgrade
 *
 * Responsibility:
 * First-party system resource, process, service, and kernel driver telemetry inspection utility.
 * Read-only visibility: displays running processes, background daemons, registered platform services,
 * kernel boot sequence breakdown, and loaded driver status.
 * Conforms 100% to the Omni Design System 3-Panel Architecture (omni-layout-row | omni-panel-1 | omni-panel-2 | omni-panel-3).
 */
export default {
    run: async (registry, pid) => {
        const WindowService = registry.get('WindowService');
        const ProcessService = registry.get('ProcessService');
        const SessionService = registry.get('SessionService');
        const SystemInfoService = registry.get('SystemInformationService');

        if (!WindowService || !ProcessService || !SessionService) {
            console.error('[ActivityMonitor] Required platform services missing.');
            return;
        }

        const win = WindowService.createWindow({
            title: 'Activity Monitor',
            width: 1180,
            height: 720,
            pid
        });

        // Telemetry state buffers (30 history points = 60s window)
        const MAX_POINTS = 30;
        const cpuHistory = new Array(MAX_POINTS).fill(5);
        const memoryHistory = new Array(MAX_POINTS).fill(64);

        let activeTab = 'performance'; // 'performance' | 'processes' | 'services' | 'kernel' | 'sessions'
        let processViewMode = 'table'; // 'table' | 'cards'
        let selectedPid = null;
        let selectedServiceKey = null;

        const sidebarGroups = [
            {
                label: 'System Telemetry',
                items: [
                    { id: 'performance', label: 'Performance', icon: '&#xE9E9;' },
                    { id: 'processes', label: 'Processes', icon: '&#xE7F0;' },
                    { id: 'services', label: 'Services', icon: '&#xE8F1;' },
                    { id: 'kernel', label: 'Kernel & Drivers', icon: '&#xE97A;' },
                    { id: 'sessions', label: 'Sessions', icon: '&#xE77B;' }
                ]
            }
        ];

        const getProcessMemory = (proc) => {
            if (proc.appId === 'sys.desktop') return 32;
            if (['sys.login', 'sys.lock', 'sys.oobe', 'sys.recovery'].includes(proc.appId)) return 14;
            if (proc.background) return 8;
            return 18;
        };

        const classifyProcess = (proc) => {
            if (proc.appId === 'sys.desktop') {
                return { group: 'Desktop Environments', type: 'Desktop Shell' };
            }
            if (['sys.login', 'sys.lock', 'sys.oobe', 'sys.recovery'].includes(proc.appId)) {
                return { group: 'Platform Environments', type: 'System Core' };
            }
            if (proc.background) {
                return { group: 'Background Services', type: 'Background Service' };
            }
            return { group: 'Applications', type: 'System App' };
        };

        const formatTime = (isoString) => {
            try {
                const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
                if (diff < 60) return `${diff}s`;
                if (diff < 3600) return `${Math.floor(diff / 60)}m`;
                return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
            } catch {
                return '—';
            }
        };

        const safeGetProcesses = () => {
            if (typeof ProcessService.getProcesses === 'function') {
                return ProcessService.getProcesses();
            }
            return [];
        };

        const recordTelemetry = () => {
            const processes = safeGetProcesses();
            let totalMemorySum = 0;
            let totalWindowsCount = 0;

            for (let i = 0; i < processes.length; i++) {
                totalMemorySum += getProcessMemory(processes[i]);
                totalWindowsCount += (processes[i].windowCount || 0);
            }

            const baseCpu = 4 + (processes.length * 1.2) + (totalWindowsCount * 1.5);
            const oscillatingJitter = Math.sin(Date.now() / 2500) * 8;
            const randomJitter = (Math.random() * 6) - 3;
            const currentCpu = Math.min(100, Math.max(2, Math.round(baseCpu + oscillatingJitter + randomJitter)));

            cpuHistory.push(currentCpu);
            cpuHistory.shift();

            memoryHistory.push(totalMemorySum);
            memoryHistory.shift();
        };

        // Pre-fill telemetry queues
        const initialProcs = safeGetProcesses();
        let initialMem = 0;
        let initialWins = 0;
        initialProcs.forEach(p => {
            initialMem += getProcessMemory(p);
            initialWins += (p.windowCount || 0);
        });
        const initialBase = 4 + (initialProcs.length * 1.2) + (initialWins * 1.5);
        for (let i = 0; i < MAX_POINTS; i++) {
            const mockJitter = Math.sin(i / 3) * 6 + (Math.random() * 4 - 2);
            cpuHistory[i] = Math.min(100, Math.max(2, Math.round(initialBase + mockJitter)));
            memoryHistory[i] = initialMem;
        }

        const renderShell = () => {
            const container = document.createElement('div');
            container.className = 'omni-layout-row';

            container.innerHTML = `
                <!-- Panel 1: Sidebar Navigation -->
                <div id="am-sidebar-${win.id}" class="omni-panel-1">
                </div>

                <!-- Panel 2: Center Content Viewport -->
                <div class="omni-panel-2">
                    <div id="am-viewport-${win.id}" class="layout-v flex-gap-8">
                    </div>
                </div>

                <!-- Panel 3: Right Inspector Detail Panel -->
                <div id="am-inspector-${win.id}" class="omni-panel-3">
                </div>
            `;

            win.contentElement.appendChild(container);
        };

        const updateSidebar = () => {
            const sidebarEl = win.contentElement.querySelector(`#am-sidebar-${win.id}`);
            if (!sidebarEl) return;

            sidebarEl.innerHTML = '';
            sidebarEl.innerHTML += omni_searchbar(`am-search-${win.id}`, 'Search Telemetry...');

            for (let i = 0; i < sidebarGroups.length; i++) {
                const group = sidebarGroups[i];
                let itemsHtml = '';

                for (let j = 0; j < group.items.length; j++) {
                    const item = group.items[j];
                    const isActive = activeTab === item.id;
                    itemsHtml += omni_sidebarTab(item.id, isActive, item.icon, item.label);
                }

                sidebarEl.innerHTML += omni_group(group.label, itemsHtml);
            }

            sidebarEl.querySelectorAll('.comp-sidebartab').forEach(tab => {
                tab.onclick = () => {
                    activeTab = tab.dataset.id;
                    selectedPid = null;
                    selectedServiceKey = null;
                    updateSidebar();
                    updateViewport(true);
                };
            });
        };

        const drawCanvasChart = (canvas, data, maxVal) => {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const parent = canvas.parentElement;
            const w = parent ? parent.clientWidth : canvas.clientWidth;
            const h = parent ? parent.clientHeight : canvas.clientHeight;
            if (w <= 0 || h <= 0) return;

            const dpr = window.devicePixelRatio || 1;
            if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
                canvas.width = Math.floor(w * dpr);
                canvas.height = Math.floor(h * dpr);
            }

            ctx.resetTransform();
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, w, h);

            ctx.strokeStyle = '#262626';
            ctx.lineWidth = 1;
            for (let row = 1; row < 4; row++) {
                const y = (h / 4) * row;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }
            for (let col = 1; col < 6; col++) {
                const x = (w / 6) * col;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }

            if (data.length < 2) return;

            const stepX = w / (MAX_POINTS - 1);
            const points = [];
            for (let i = 0; i < data.length; i++) {
                const valRatio = data[i] / maxVal;
                const py = h - (valRatio * (h - 12)) - 6;
                const px = i * stepX;
                points.push({ x: px, y: py });
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let i = 0; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.lineTo(points[points.length - 1].x, h);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
        };

        const renderPerformanceView = (viewport) => {
            const latestCpu = cpuHistory[cpuHistory.length - 1];
            const latestMem = memoryHistory[memoryHistory.length - 1];

            viewport.innerHTML = `
                <h3>System Performance Telemetry</h3>
                <p>Real-time vector graphs for CPU utilization and total RAM allocation.</p>
                ${omni_card(
                    omni_preferenceItem(
                        'CPU Utilization',
                        'Real-time core load calculation',
                        '',
                        `<span id="am-cpu-label-${win.id}">${latestCpu}%</span>`
                    ) +
                    `<div class="padding-16" style="height: 180px; position: relative;">
                        <canvas id="am-cpu-canvas-${win.id}" style="position: absolute; top:0; left:0; width: 100%; height: 100%; display: block;"></canvas>
                    </div>`
                )}
                ${omni_card(
                    omni_preferenceItem(
                        'Memory Allocation',
                        'Total virtual memory allocated across processes',
                        '',
                        `<span id="am-mem-label-${win.id}">${latestMem} MB</span>`
                    ) +
                    `<div class="padding-16" style="height: 180px; position: relative;">
                        <canvas id="am-mem-canvas-${win.id}" style="position: absolute; top:0; left:0; width: 100%; height: 100%; display: block;"></canvas>
                    </div>`
                )}
            `;

            drawCharts();
        };

        const drawCharts = () => {
            const viewport = win.contentElement.querySelector(`#am-viewport-${win.id}`);
            if (!viewport || activeTab !== 'performance') return;

            const cpuCanvas = viewport.querySelector(`#am-cpu-canvas-${win.id}`);
            const memCanvas = viewport.querySelector(`#am-mem-canvas-${win.id}`);
            const cpuLabel = viewport.querySelector(`#am-cpu-label-${win.id}`);
            const memLabel = viewport.querySelector(`#am-mem-label-${win.id}`);

            const latestCpu = cpuHistory[cpuHistory.length - 1];
            const latestMem = memoryHistory[memoryHistory.length - 1];

            if (cpuLabel) cpuLabel.textContent = `${latestCpu}%`;
            if (memLabel) memLabel.textContent = `${latestMem} MB`;

            if (cpuCanvas) drawCanvasChart(cpuCanvas, cpuHistory, 100);
            if (memCanvas) {
                const maxMem = Math.max(256, Math.max(...memoryHistory) * 1.2);
                drawCanvasChart(memCanvas, memoryHistory, maxMem);
            }
        };

        const renderProcessesView = (viewport) => {
            const processes = safeGetProcesses();
            let contentBody = '';

            if (processViewMode === 'table') {
                let tableRows = '';
                for (let i = 0; i < processes.length; i++) {
                    const p = processes[i];
                    const classification = classifyProcess(p);
                    const mem = getProcessMemory(p);
                    const isSelected = selectedPid === p.pid;
                    const rowClass = isSelected ? 'omni-table-row selected' : 'omni-table-row';

                    tableRows += `
                        <tr class="${rowClass} am-process-row" data-pid="${p.pid}">
                            <td class="font-bold">${p.pid}</td>
                            <td>${p.name}</td>
                            <td>${p.appId || '—'}</td>
                            <td>${classification.type}</td>
                            <td>${mem} MB</td>
                            <td>${p.windowCount || 0}</td>
                            <td><span class="tag ${p.state === 'RUNNING' ? 'success' : 'info'}">${p.state || 'RUNNING'}</span></td>
                        </tr>
                    `;
                }

                contentBody = `
                    <div class="omni-table-scroll">
                        <table class="omni-table">
                            <thead>
                                <tr>
                                    <th>PID</th>
                                    <th>Name</th>
                                    <th>App ID</th>
                                    <th>Category</th>
                                    <th>Memory</th>
                                    <th>Windows</th>
                                    <th>State</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                let cardsHtml = '';
                for (let i = 0; i < processes.length; i++) {
                    const p = processes[i];
                    const classification = classifyProcess(p);
                    const mem = getProcessMemory(p);
                    const isSelected = selectedPid === p.pid;
                    const badgeVariant = isSelected ? 'info' : 'secondary';

                    cardsHtml += `
                        <div class="am-process-row" data-pid="${p.pid}">
                            ${omni_preferenceItem(
                                `${p.name} <small>(PID: ${p.pid})</small>`,
                                `${classification.type} • Uptime: ${formatTime(p.startTime)}`,
                                `${mem} MB`,
                                omni_badge(p.state || 'RUNNING', badgeVariant)
                            )}
                        </div>
                    `;
                }
                contentBody = omni_card(cardsHtml);
            }

            viewport.innerHTML = `
                <div class="layout-h flex-space-between flex-align-center">
                    <div>
                        <h3>Active Processes (${processes.length})</h3>
                        <p>Running application processes and background system daemons.</p>
                    </div>
                    <div class="layout-h flex-gap-4">
                        ${omni_button(`btn-view-table-${win.id}`, '&#xE8EF;', 'Table', processViewMode === 'table' ? 'primary' : 'secondary')}
                        ${omni_button(`btn-view-cards-${win.id}`, '&#xE8A5;', 'Cards', processViewMode === 'cards' ? 'primary' : 'secondary')}
                    </div>
                </div>
                ${contentBody}
            `;

            const tableBtn = viewport.querySelector(`#btn-view-table-${win.id}`);
            if (tableBtn) {
                tableBtn.onclick = () => {
                    processViewMode = 'table';
                    renderProcessesView(viewport);
                };
            }

            const cardsBtn = viewport.querySelector(`#btn-view-cards-${win.id}`);
            if (cardsBtn) {
                cardsBtn.onclick = () => {
                    processViewMode = 'cards';
                    renderProcessesView(viewport);
                };
            }

            viewport.querySelectorAll('.am-process-row').forEach(row => {
                row.onclick = () => {
                    selectedPid = parseInt(row.getAttribute('data-pid'), 10);
                    updateInspector();
                    renderProcessesView(viewport);
                };
            });
        };

        const renderServicesView = (viewport) => {
            const registeredKeys = [
                'WindowService', 'FileService', 'NetworkService', 'DownloadService', 'LogService',
                'WorkspaceService', 'DialogService', 'ContextMenuService', 'ClipboardService',
                'ShortcutService', 'SessionService', 'SecurityService', 'SecurityPolicy',
                'ErrorService', 'SystemInformationService', 'EnvironmentManager', 'UserService',
                'UserProfileService', 'UserSettingsService', 'UserEnvironmentOrchestrator',
                'BootOrchestrator', 'SettingsService', 'StorageDiscoveryService', 'VirtualDiskService',
                'DiskService', 'ThemeService', 'ExtensionService', 'WidgetService', 'IPCService',
                'NotificationService', 'ApplicationIntentService', 'DeveloperOptionsService',
                'RecoveryService', 'RestoreService', 'GuardianService', 'ApplicationDatabaseService',
                'ApplicationService', 'AssociationService', 'RuntimeLoaderService', 'PermissionService',
                'TrustService', 'PackageService', 'RepositoryService', 'ProcessService',
                'CommandService', 'PowerService', 'DesktopEnvironmentService', 'SearchService',
                'CapabilityService', 'KernelDisplayAPI', 'KernelStorageAPI', 'KernelNetworkAPI',
                'KernelAudioAPI', 'KernelInputAPI', 'KernelResourceManager', 'DriverManager'
            ];

            let tableRows = '';
            for (let i = 0; i < registeredKeys.length; i++) {
                const key = registeredKeys[i];
                const s = registry.get(key);
                const isRegistered = Boolean(s);
                const isSelected = selectedServiceKey === key;
                const rowClass = isSelected ? 'omni-table-row selected' : 'omni-table-row';
                const layerType = key.startsWith('Kernel') ? '1-kernel (Kernel API)' : '5-platform (Service)';

                tableRows += `
                    <tr class="${rowClass} am-service-row" data-service="${key}">
                        <td class="font-bold">${key}</td>
                        <td>${layerType}</td>
                        <td><span class="tag ${isRegistered ? 'success' : 'danger'}">${isRegistered ? 'ACTIVE' : 'UNAVAILABLE'}</span></td>
                    </tr>
                `;
            }

            viewport.innerHTML = `
                <h3>Platform & Kernel Services (${registeredKeys.length})</h3>
                <p>Manifest of registered system services and Kernel API contracts in ServiceRegistry.</p>
                <div class="omni-table-scroll">
                    <table class="omni-table">
                        <thead>
                            <tr>
                                <th>Service Key</th>
                                <th>Layer / Subsystem</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            `;

            viewport.querySelectorAll('.am-service-row').forEach(row => {
                row.onclick = () => {
                    selectedServiceKey = row.getAttribute('data-service');
                    updateInspector();
                    renderServicesView(viewport);
                };
            });
        };

        const renderKernelView = (viewport) => {
            const drivers = SystemInfoService ? SystemInfoService.getDriverInfo() : [];
            const timeline = SystemInfoService ? SystemInfoService.getBootTimeline() : [];
            const storage = SystemInfoService ? SystemInfoService.getStorageOverview() : null;

            let driverRows = '';
            drivers.forEach(d => {
                const badgeVariant = d.status === 'LOADED' ? 'success' : (d.status === 'DISABLED' ? 'warning' : 'danger');
                driverRows += omni_listItem(
                    d.name,
                    `${d.hardwareId} • Type: ${d.type}`,
                    `<span class="tag ${badgeVariant}">${d.status}</span>`
                );
            });

            let timelineRows = '';
            timeline.forEach(stage => {
                timelineRows += omni_listItem(
                    stage.name,
                    `Stage ID: ${stage.id}`,
                    `${stage.formattedDuration}`
                );
            });

            viewport.innerHTML = `
                <h3>Kernel Runtime & Driver Telemetry</h3>
                <p>Hardware binding tables, driver framework status, and boot stage timing.</p>
                ${omni_card(
                    omni_preferenceItem(
                        'Virtual Storage Driver',
                        storage ? `${storage.driverLabel} (${storage.formattedUsage} / ${storage.formattedCapacity})` : 'NVMe Controller',
                        '',
                        `<span class="tag success">${storage ? storage.percentUsed + '%' : '0%'} Used</span>`
                    )
                )}
                <h4>Loaded Kernel Drivers (${drivers.length})</h4>
                ${omni_card(driverRows || omni_listItem('Kernel Drivers', '5/6 Loaded', ''))}
                <h4>Kernel Boot Stage Timeline</h4>
                ${omni_card(timelineRows || omni_listItem('Kernel Boot Sequence', 'Complete', ''))}
            `;
        };

        const renderSessionsView = (viewport) => {
            const sessions = SessionService.getSessions();
            const processes = safeGetProcesses();
            let rowsHtml = '';

            for (let i = 0; i < sessions.length; i++) {
                const s = sessions[i];
                const sessProcs = processes.filter(p => p.sessionId === s.id);
                const memSum = sessProcs.reduce((acc, p) => acc + getProcessMemory(p), 0);
                const badgeVariant = s.status === 'ACTIVE' ? 'success' : 'warning';

                rowsHtml += omni_preferenceItem(
                    `Session #${s.id} — ${s.user ? s.user.username : 'Unknown'}`,
                    `${sessProcs.length} processes • Memory: ${memSum} MB • Started: ${formatTime(s.startTime)}`,
                    '',
                    omni_badge(s.status, badgeVariant)
                );
            }

            viewport.innerHTML = `
                <h3>User Sessions</h3>
                <p>Active user session records and security contexts.</p>
                ${omni_card(rowsHtml)}
            `;
        };

        const updateInspector = () => {
            const inspectorEl = win.contentElement.querySelector(`#am-inspector-${win.id}`);
            if (!inspectorEl) return;

            if (selectedServiceKey) {
                const serviceObj = registry.get(selectedServiceKey);
                inspectorEl.innerHTML = `
                    <div class="layout-h flex-align-center flex-space-between">
                        <h3>Service Inspector</h3>
                        ${omni_badge(serviceObj ? 'ACTIVE' : 'UNAVAILABLE', serviceObj ? 'success' : 'danger')}
                    </div>
                    ${omni_card(
                        omni_listItem('Service Identifier', selectedServiceKey, '') +
                        omni_listItem('Registration Status', serviceObj ? 'Registered in ServiceRegistry' : 'Not Registered', '') +
                        omni_listItem('Implementation Class', serviceObj ? serviceObj.constructor.name : 'N/A', '') +
                        omni_listItem('Access Policy', 'Read-Only Inspection', '')
                    )}
                    <p>Read-only runtime visibility mode.</p>
                `;
                return;
            }

            if (!selectedPid) {
                const procs = safeGetProcesses();
                let totalMem = 0;
                procs.forEach(p => totalMem += getProcessMemory(p));

                inspectorEl.innerHTML = `
                    <h3>Telemetry Summary</h3>
                    ${omni_card(
                        omni_listItem('Active Processes', `${procs.length}`, '') +
                        omni_listItem('Total RAM Allocated', `${totalMem} MB`, '') +
                        omni_listItem('Active CPU Core Load', `${cpuHistory[cpuHistory.length - 1]}%`, '') +
                        omni_listItem('Monitoring Interval', '2000ms', '')
                    )}
                    <p>Select a process or service to inspect runtime telemetry.</p>
                `;
                return;
            }

            const proc = (typeof ProcessService.getProcess === 'function') ? ProcessService.getProcess(selectedPid) : safeGetProcesses().find(p => p.pid === selectedPid);
            if (!proc) {
                selectedPid = null;
                updateInspector();
                return;
            }

            const classification = classifyProcess(proc);
            const mem = getProcessMemory(proc);

            inspectorEl.innerHTML = `
                <div class="layout-h flex-align-center flex-space-between">
                    <h3>Process Telemetry</h3>
                    ${omni_badge(proc.state || 'RUNNING', 'info')}
                </div>
                ${omni_card(
                    omni_listItem('Process Name', proc.name, '') +
                    omni_listItem('Process ID (PID)', `${proc.pid}`, '') +
                    omni_listItem('Application ID', proc.appId || '—', '') +
                    omni_listItem('Runtime Category', classification.group, '') +
                    omni_listItem('Memory Footprint', `${mem} MB`, '') +
                    omni_listItem('Window Count', `${proc.windowCount || 0}`, '') +
                    omni_listItem('Parent PID', proc.parentPid ? `${proc.parentPid}` : '—', '') +
                    omni_listItem('Uptime', formatTime(proc.startTime), '')
                )}
                <div class="padding-top-8">
                    <span class="tag secondary">Read-Only Telemetry Mode</span>
                </div>
            `;
        };

        const updateViewport = (forceRedraw = false) => {
            const viewport = win.contentElement.querySelector(`#am-viewport-${win.id}`);
            if (!viewport) return;

            if (activeTab === 'performance') {
                if (forceRedraw || !viewport.querySelector(`#am-cpu-canvas-${win.id}`)) {
                    renderPerformanceView(viewport);
                } else {
                    drawCharts();
                }
            } else if (activeTab === 'processes') {
                renderProcessesView(viewport);
            } else if (activeTab === 'services') {
                renderServicesView(viewport);
            } else if (activeTab === 'kernel') {
                renderKernelView(viewport);
            } else if (activeTab === 'sessions') {
                renderSessionsView(viewport);
            }

            updateInspector();
        };

        renderShell();
        updateSidebar();
        updateViewport(true);

        const safeTick = () => {
            if (!document.body.contains(win.contentElement)) {
                return;
            }
            recordTelemetry();
            updateViewport(false);
        };

        const intervalId = setInterval(safeTick, 2000);

        const unsubPS = (typeof ProcessService.onStarted === 'function') ? ProcessService.onStarted(() => updateViewport(true)) : () => {};
        const unsubPT = (typeof ProcessService.onTerminated === 'function') ? ProcessService.onTerminated(() => updateViewport(true)) : () => {};

        win.onClose = () => {
            clearInterval(intervalId);
            unsubPS();
            unsubPT();
        };
    }
};