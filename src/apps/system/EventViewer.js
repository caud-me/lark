import { LogCategory } from '../../system/LogCategory.js';
import { LogSeverity } from '../../system/LogSeverity.js';
import { 
    omni_sidebarTab,
    omni_button,
    omni_group,
    omni_searchbar
} from '../../platform/settings/SettingsComponents.js';

/**
 * EventViewer Application
 *
 * Responsibility:
 * Provides a graphical interface for viewing system logs.
 * Conforms strictly to the Omni design system standard.
 */
export default {
    run: async (registry, pid, options = {}) => {
        // ========================================
        // Source & Service Initialization
        // ========================================
        const WindowService = registry.get('WindowService');
        const LogService = registry.get('LogService');

        if (!WindowService || !LogService) {
            console.error('[EventViewer] Required services missing.');
            return;
        }

        const win = WindowService.createWindow({
            title: 'Event Viewer',
            width: 1720,
            height: 960,
            pid,
            onClose: () => {
                LogService.unsubscribe(handleNewLog);
            }
        });

        // ========================================
        // State & Configuration
        // ========================================
        let currentTab = 'Runtime Events';
        let currentView = 'table';
        let selectedRuntimeNode = null;
        let currentSeverity = 'All';
        let searchQuery = '';
        let isPaused = true;
        let autoScroll = false;
        let selectedLog = null;
        let currentLogs = [];

        const activeCategories = new Set(Object.values(LogCategory));
        const activeSources = new Set();
        const allKnownSources = new Set();

        // ========================================
        // Helper Functions
        // ========================================
        const getSeverityClass = (sev) => {
            switch (sev) {
                case LogSeverity.ERROR: return 'error';
                case LogSeverity.WARNING: return 'warning';
                case LogSeverity.SUCCESS: return 'success';
                case LogSeverity.DEBUG: return 'info';
                default: return 'info';
            }
        };

        const getCategoryColor = (cat) => {
            const categoryColors = {
                'KERNEL': 'kernel',
                'PLATFORM': 'platform',
                'BOOT': 'kernel',
                'SESSION': 'platform',
                'ENVIRONMENT': 'platform',
                'DESKTOP': 'platform',
                'APPLICATION': 'platform',
                'SERVICE': 'platform',
                'SECURITY': 'platform',
                'NETWORK': 'platform',
                'FILESYSTEM': 'platform'
            };
            return categoryColors[cat] || 'platform';
        };

        const syntaxHighlight = (json) => {
            if (typeof json !== 'string') {
                json = JSON.stringify(json, undefined, 2);
            }
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
                let cls = 'number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'key';
                    } else {
                        cls = 'string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'boolean';
                } else if (/null/.test(match)) {
                    cls = 'null';
                }
                return `<span class="omni-json-${cls}">${match}</span>`;
            });
        };

        const formatLog = (logItem) => {
            const categoryColor = getCategoryColor(logItem.category);
            const isSelected = selectedLog && selectedLog.id === logItem.id;
            const displayTime = new Date(logItem.timestamp).toLocaleTimeString();
            
            return `
                <tr class="omni-table-row ${isSelected ? 'selected' : ''}" data-log-id="${logItem.id}">
                    <td>${logItem.id}</td>
                    <td>${displayTime}</td>
                    <td>${logItem.severity}</td>
                    <td><span class="category-badge ${categoryColor}">${logItem.category || 'UNKNOWN'}</span></td>
                    <td>${logItem.source || ''}</td>
                    <td>${logItem.event || ''}</td>
                    <td>${logItem.message || ''}</td>
                </tr>
            `;
        };

        const matchesFilter = (logItem) => {
            const isKernelDomain = (log) => {
                return log.source === 'BootLogger' || log.source === 'Kernel';
            };

            // Lifecycle partition
            if (currentTab === 'Kernel Diagnostics' && !isKernelDomain(logItem)) return false;
            if (currentTab === 'Runtime Events' && isKernelDomain(logItem)) return false;

            if (currentSeverity !== 'All' && logItem.severity !== currentSeverity) return false;
            if (activeCategories.size > 0 && !activeCategories.has(logItem.category)) return false;
            if (activeSources.size > 0 && !activeSources.has(logItem.source)) return false;

            if (searchQuery) {
                const queryLower = searchQuery.toLowerCase();
                const matchesId = logItem.id.toLowerCase().includes(queryLower);
                const matchesMsg = (logItem.message || '').toLowerCase().includes(queryLower);
                const matchesSrc = (logItem.source || '').toLowerCase().includes(queryLower);
                const matchesEvt = (logItem.event || '').toLowerCase().includes(queryLower);
                if (!matchesId && !matchesMsg && !matchesSrc && !matchesEvt) return false;
            }
            return true;
        };

        const fetchLogs = () => {
            currentLogs = LogService.getLogs();
            return currentLogs;
        };

        const buildRuntimeHierarchy = (logs) => {
            const root = {
                name: currentTab === 'Kernel Diagnostics' ? 'Kernel System Boot' : 'System Boot',
                children: []
            };

            const categoryMap = new Map();

            for (let i = 0; i < logs.length; i++) {
                const log = logs[i];
                if (!matchesFilter(log)) continue;

                const category = log.category || 'UNKNOWN';
                const source = log.source || 'Unknown';
                const event = log.event || log.message || '(event)';
                const message = log.message || '';
                const timestamp = new Date(log.timestamp).toLocaleTimeString();

                let categoryNode = categoryMap.get(category);

                if (!categoryNode) {
                    categoryNode = {
                        name: category,
                        children: [],
                        sources: new Map()
                    };

                    categoryMap.set(category, categoryNode);
                    root.children.push(categoryNode);
                }

                let sourceNode = categoryNode.sources.get(source);

                if (!sourceNode) {
                    sourceNode = {
                        name: source,
                        children: []
                    };

                    categoryNode.sources.set(source, sourceNode);
                    categoryNode.children.push(sourceNode);
                }

                sourceNode.children.push({
                    event,
                    message,
                    timestamp,
                    log
                });
            }

            return root;
        };

        // ========================================
        // Tree Rendering Functions
        // ========================================
        const renderTreeNode = (node) => {
            const li = document.createElement('li');

            const label = document.createElement('div');
            label.className = 'layout-v flex-gap-2';
            
            const paragraph = document.createElement('p');
            paragraph.textContent = (node.event || node.name || '(event)') + ' ';
            
            const severity = node.severity || node.log?.severity;
            if (severity) {
                const severitySpan = document.createElement('span');
                const severityClass = getSeverityClass(severity); 
                severitySpan.className = `tag ${severityClass}`;
                severitySpan.textContent = severity;
                paragraph.appendChild(severitySpan);
            }
            
            const smallMessage = document.createElement('small');
            smallMessage.textContent = node.message || '';

            const smallerTimestamp = document.createElement('small');
            smallerTimestamp.className = 'er';
            smallerTimestamp.textContent = node.timestamp || '';
            
            label.appendChild(paragraph);
            label.appendChild(smallMessage);
            label.appendChild(smallerTimestamp);

            label.onclick = () => {
                if (node.log) {
                    selectedLog = node.log;
                    renderDetailPane();
                }
            };

            li.appendChild(label);

            if (node.children && node.children.length > 0) {
                const ul = document.createElement('ul');
                for (let i = 0; i < node.children.length; i++) {
                    ul.appendChild(renderTreeNode(node.children[i]));
                }
                li.appendChild(ul);
            }

            return li;
        };

        const renderRuntimeHierarchy = () => {
            const container = win.contentElement.querySelector(`#ev-runtime-tree-${win.id}`);
            if (!container) return;

            container.innerHTML = '';

            const hierarchy = buildRuntimeHierarchy(currentLogs);

            const tree = document.createElement('ul');
            tree.className = 'runtime-tree';

            tree.appendChild(renderTreeNode(hierarchy));
            container.appendChild(tree);
        };

        // ========================================
        // Table Rendering Functions
        // ========================================
        const refreshLogs = () => {
            const tableBody = win.contentElement.querySelector(`#ev-logs-${win.id}`);
            if (!tableBody) return;

            // Dynamic source harvesting
            let sourcesChanged = false;
            for (let i = 0; i < currentLogs.length; i++) {
                const currentLog = currentLogs[i];
                if (currentLog.source && !allKnownSources.has(currentLog.source)) {
                    allKnownSources.add(currentLog.source);
                    activeSources.add(currentLog.source);
                    sourcesChanged = true;
                }
            }
            if (sourcesChanged) updateSourceCheckboxes();

            // Generate HTML for all matching logs using basic loops
            let rowsHtml = '';
            for (let i = 0; i < currentLogs.length; i++) {
                const currentLog = currentLogs[i];
                if (matchesFilter(currentLog)) {
                    rowsHtml += formatLog(currentLog);
                }
            }

            tableBody.innerHTML = rowsHtml;

            // Bind log selection click listeners
            tableBody.querySelectorAll('.omni-table-row').forEach(row => {
                row.onclick = () => {
                    const logId = row.dataset.logId;
                    selectedLog = currentLogs.find(l => l.id === logId) || null;
                    tableBody.querySelectorAll('.omni-table-row').forEach(r => r.classList.remove('selected'));
                    if (selectedLog) {
                        row.classList.add('selected');
                    }
                    renderDetailPane();
                };
            });

            // Auto scroll
            const tableContainer = win.contentElement.querySelector(`#ev-table-scroll-${win.id}`);
            if (autoScroll && tableContainer) {
                tableContainer.scrollTop = tableContainer.scrollHeight;
            }
        };

        // ========================================
        // UI Rendering & Update Functions
        // ========================================
        const updateTabs = () => {
            const table = win.contentElement.querySelector(`#ev-table-scroll-${win.id}`);
            const tree = win.contentElement.querySelector(`#ev-runtime-tree-${win.id}`);
            const tabKernel = win.contentElement.querySelector(`#ev-tab-kernel-${win.id}`);
            const tabRuntime = win.contentElement.querySelector(`#ev-tab-runtime-${win.id}`);

            if (!tabKernel || !tabRuntime) return;

            tabKernel.classList.remove('active');
            tabRuntime.classList.remove('active');

            if (currentTab === 'Kernel Diagnostics') {
                tabKernel.classList.add('active');
            } else if (currentTab === 'Runtime Events') {
                tabRuntime.classList.add('active');
            }

            if (table) table.style.display = currentView === 'table' ? '' : 'none';
            if (tree) tree.style.display = currentView === 'tree' ? '' : 'none';
        };

        const updatePresentation = () => {
            updateTabs();

            if (currentView === 'table') {
                refreshLogs();
            } else {
                renderRuntimeHierarchy();
            }
        };

        const updateSourceCheckboxes = () => {
            const sourcesContainer = win.contentElement.querySelector(`#ev-sources-${win.id}`);
            if (!sourcesContainer) return;

            sourcesContainer.innerHTML = '';
            const sortedSourcesList = Array.from(allKnownSources).sort();
            
            for (let i = 0; i < sortedSourcesList.length; i++) {
                const src = sortedSourcesList[i];
                const label = document.createElement('label');
                label.className = 'comp-checkbox';
                label.style.display = 'flex';
                label.style.alignItems = 'center';
                label.style.gap = '8px';
                label.innerHTML = `
                    <input type="checkbox" class="source-filter" value="${src}" ${activeSources.has(src) ? 'checked' : ''}>
                    <span>${src}</span>
                `;
                sourcesContainer.appendChild(label);
            }

            sourcesContainer.querySelectorAll('.source-filter').forEach(chk => {
                chk.onchange = () => {
                    if (chk.checked) activeSources.add(chk.value);
                    else activeSources.delete(chk.value);
                    updatePresentation();
                };
            });
        };

        const renderDetailPane = () => {
            const detailBox = win.contentElement.querySelector(`#ev-detail-content-${win.id}`);
            const copyContainer = win.contentElement.querySelector(`#ev-copy-container-${win.id}`);
            const copyBtn = win.contentElement.querySelector(`#ev-copy-btn-${win.id}`);
            if (!detailBox || !copyContainer || !copyBtn) return;

            if (!selectedLog) {
                detailBox.textContent = 'Select an event to view details.';
                copyContainer.style.display = 'none';
                return;
            }

            detailBox.innerHTML = syntaxHighlight(selectedLog);
            copyContainer.style.display = 'block';

            copyBtn.onclick = () => {
                navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
                const labelElement = copyBtn.querySelector('.comp-btn-label') || copyBtn;
                const originalText = labelElement.textContent;
                labelElement.textContent = 'Copied!';
                setTimeout(() => { labelElement.textContent = originalText; }, 1000);
            };
        };

        const renderShell = () => {
            const container = document.createElement('div');
            container.className = 'omni-layout-row';

            // Sidebar configuration components (All generated through Omni standards)
            const searchHtml = omni_searchbar(`ev-search-${win.id}`, 'Filter logs...', searchQuery);
            
            const controlsHtml = `
                <div class="layout-v flex-gap-8">
                    <label class="comp-checkbox" style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="ev-autoscroll-${win.id}" ${autoScroll ? 'checked' : ''}>
                        <span>Auto Scroll</span>
                    </label>
                    <label class="comp-checkbox" style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="ev-pause-${win.id}" ${isPaused ? 'checked' : ''}>
                        <span>Pause Capture</span>
                    </label>
                    <p class="text-secondary" style="font-size: 11px; margin-top: 4px; line-height: 1.4;">
                        To select events, disable auto scroll and enable pause capture.
                    </p>
                </div>
            `;

            const displayHtml = `
                <div class="layout-v flex-gap-8">
                    <p class="sidebar-label" style="font-size: 11px; color: var(--lde-text-secondary, #888888); margin-bottom: 4px;">Severity</p>
                    <div class="comp-selectbox">
                        <select id="ev-severity-${win.id}" class="comp-severity-select">
                            <option value="All" ${currentSeverity === 'All' ? 'selected' : ''}>All Severities</option>
                            <option value="Info" ${currentSeverity === 'Info' ? 'selected' : ''}>Info</option>
                            <option value="Success" ${currentSeverity === 'Success' ? 'selected' : ''}>Success</option>
                            <option value="Warning" ${currentSeverity === 'Warning' ? 'selected' : ''}>Warning</option>
                            <option value="Error" ${currentSeverity === 'Error' ? 'selected' : ''}>Error</option>
                            <option value="Debug" ${currentSeverity === 'Debug' ? 'selected' : ''}>Debug</option>
                        </select>
                        <i>&#xE972;</i>
                    </div>

                    <p class="sidebar-label" style="font-size: 11px; color: var(--lde-text-secondary, #888888); margin-top: 8px; margin-bottom: 4px;">View</p>
                    <div class="comp-selectbox">
                        <select id="ev-view-${win.id}">
                            <option value="table">Table</option>
                            <option value="tree">Hierarchy</option>
                        </select>
                        <i>&#xE972;</i>
                    </div>
                </div>
            `;

            const categoriesTargetContainer = `<div id="ev-categories-${win.id}" class="layout-v flex-gap-4"></div>`;
            const sourcesTargetContainer = `<div id="ev-sources-${win.id}" class="layout-v flex-gap-4"></div>`;

            // Core Layout Grid Structure
            container.innerHTML = `
                <!-- Left Panel: Sidebar Utility Filters -->
                <div id="ev-left-${win.id}" class="omni-panel-1">
                    ${searchHtml}
                    ${omni_group('Controls', controlsHtml)}
                    ${omni_group('Display & Severity', displayHtml)}
                    ${omni_group('Categories', categoriesTargetContainer)}
                    ${omni_group('Sources', sourcesTargetContainer)}
                </div>

                <!-- Center Panel: Table Viewports & Tab Switcher -->
                <div id="ev-center-${win.id}" class="omni-panel-2">
                    <div class="comp-tab-bar">
                        <button id="ev-tab-kernel-${win.id}" class="comp-tab-button">
                            Kernel Diagnostics
                        </button>
                        <button id="ev-tab-runtime-${win.id}" class="comp-tab-button active">
                            Runtime Events
                        </button>
                    </div>

                    <div id="ev-presentation-${win.id}" class="omni-panel-fill">
                        <div id="ev-table-scroll-${win.id}" class="omni-table-scroll">
                            <table class="omni-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Time</th>
                                        <th>Type</th>
                                        <th>Category</th>
                                        <th></th>
                                        <th>Event</th>
                                        <th>Message</th>
                                    </tr>
                                </thead>
                                <tbody id="ev-logs-${win.id}"></tbody>
                            </table>
                        </div>

                        <div id="ev-runtime-tree-${win.id}" class="omni-tree-view" style="display:none;"></div>
                    </div>
                </div>

                <!-- Right Panel: Event Diagnostics Detail Inspector -->
                <div id="ev-right-${win.id}" class="omni-panel-3">
                    <p class="font-bold" style="margin-bottom: 12px;">Event Details</p>
                    <pre id="ev-detail-content-${win.id}" class="event-details">Select an event to view details.</pre>
                    <div id="ev-copy-container-${win.id}" style="margin-top: 12px; display: none;">
                        ${omni_button(`ev-copy-btn-${win.id}`, '&#xE8C8;', 'Copy JSON', '', 'full-width')}
                    </div>
                </div>
            `;

            win.contentElement.appendChild(container);

            // Populate category checkbox lists using explicit loops
            const categoryContainer = win.contentElement.querySelector(`#ev-categories-${win.id}`);
            categoryContainer.innerHTML = ''; 
            
            const categoryValues = Object.values(LogCategory);
            for (let i = 0; i < categoryValues.length; i++) {
                const cat = categoryValues[i];
                const label = document.createElement('label');
                label.className = 'comp-checkbox';
                label.style.display = 'flex';
                label.style.alignItems = 'center';
                label.style.gap = '8px';
                label.innerHTML = `
                    <input type="checkbox" class="category-filter" value="${cat}" ${activeCategories.has(cat) ? 'checked' : ''}>
                    <span>${cat}</span>
                `;
                categoryContainer.appendChild(label);
            }

            // Bind primary system input callbacks
            win.contentElement.querySelector(`#ev-search-${win.id}`).oninput = (e) => {
                searchQuery = e.target.value;
                updatePresentation();
            };

            win.contentElement.querySelector(`#ev-autoscroll-${win.id}`).onchange = (e) => {
                autoScroll = e.target.checked;
            };

            win.contentElement.querySelector(`#ev-pause-${win.id}`).onchange = (e) => {
                isPaused = e.target.checked;
            };

            win.contentElement.querySelector(`#ev-severity-${win.id}`).onchange = (e) => {
                currentSeverity = e.target.value;
                updatePresentation();
            };

            win.contentElement.querySelector(`#ev-view-${win.id}`).onchange = (e) => {
                currentView = e.target.value;
                updatePresentation();
            };

            // Category filter check binds
            win.contentElement.querySelectorAll('.category-filter').forEach(chk => {
                chk.onchange = () => {
                    if (chk.checked) activeCategories.add(chk.value);
                    else activeCategories.delete(chk.value);
                    updatePresentation();
                };
            });

            // Tab navigation controls
            const tabKernel = win.contentElement.querySelector(`#ev-tab-kernel-${win.id}`);
            const tabRuntime = win.contentElement.querySelector(`#ev-tab-runtime-${win.id}`);
            
            tabKernel.onclick = () => {
                currentTab = 'Kernel Diagnostics';
                updateTabs();
                updatePresentation();
            };
            
            tabRuntime.onclick = () => {
                currentTab = 'Runtime Events';
                updateTabs();
                updatePresentation();
            };

            updateTabs();
        };

        // ========================================
        // Event Subscription & Initialization
        // ========================================
        const handleNewLog = (entry) => {
            fetchLogs();
            
            let sourcesChanged = false;
            if (entry.source && !allKnownSources.has(entry.source)) {
                allKnownSources.add(entry.source);
                activeSources.add(entry.source);
                sourcesChanged = true;
            }
            if (sourcesChanged) updateSourceCheckboxes();

            if (isPaused) return;
            updatePresentation();
        };

        // Boot and subscribe
        fetchLogs();
        renderShell();
        updatePresentation();

        LogService.subscribe(handleNewLog);

        // ========================================
        // Intent Handling
        // ========================================
        const executeIntent = async (intent) => {
            if (intent && intent.type === 'events.open') {
                if (intent.payload && intent.payload.tab) {
                    currentTab = intent.payload.tab;
                    updateTabs();
                    updatePresentation();
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

        if (options && options.intent) {
            await executeIntent(options.intent);
        }
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