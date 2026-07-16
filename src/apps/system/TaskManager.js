// import { EventBus } from '../../kernel/SystemEventBus.js';

// /**
//  * TaskManager Application
//  *
//  * Responsibility:
//  * Provides a UI for viewing and terminating running processes, and inspecting sessions.
//  *
//  * Does NOT:
//  * - Enforce process termination rules
//  */
// export default {
//     run: async (registry, pid) => {
//         const WindowService = registry.get('WindowService');
//         const ProcessService = registry.get('ProcessService');
//         const DialogService = registry.get('DialogService');
//         const SessionService = registry.get('SessionService');
//         const DesktopEnvService = registry.get('DesktopEnvironmentService');

//         if (!WindowService || !ProcessService || !DialogService || !SessionService) {
//             console.error('[TaskManager] Required services missing.');
//             return;
//         }

//         const win = WindowService.createWindow({
//             title: 'TaskManager',
//             width: 750,
//             height: 480,
//             pid
//         });

//         // App state
//         let activeTab = 'processes'; // 'processes' | 'sessions'
//         let selectedPid = null;

//         const getProcessMemory = (proc) => {
//             if (proc.appId === 'sys.desktop') return 32;
//             if (['sys.login', 'sys.lock', 'sys.oobe', 'sys.welcome', 'sys.recovery'].includes(proc.appId)) return 12;
//             if (proc.background) return 8;
//             return 18;
//         };

//         const classifyProcess = (proc) => {
//             if (proc.appId === 'sys.desktop') {
//                 return { group: 'Desktop Environments', type: 'Desktop Environment' };
//             }
//             if (['sys.login', 'sys.lock', 'sys.oobe', 'sys.welcome', 'sys.recovery'].includes(proc.appId)) {
//                 return { group: 'Platform Environments', type: 'Platform Environment' };
//             }
//             if (proc.background) {
//                 return { group: 'Background Services', type: 'Background Service' };
//             }
//             return { group: 'Applications', type: 'Application' };
//         };

//         const formatTime = (isoString) => {
//             try {
//                 const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
//                 if (diff < 60) return `${diff}s`;
//                 if (diff < 3600) return `${Math.floor(diff / 60)}m`;
//                 return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
//             } catch {
//                 return '-';
//             }
//         };

//         const render = () => {
//             const processes = ProcessService.getProcesses();
            
//             // Classify and group processes
//             const desktopProcs = [];
//             const appProcs = [];
//             const serviceProcs = [];
//             const platformProcs = [];

//             processes.forEach(proc => {
//                 const classification = classifyProcess(proc);
//                 proc.runtimeType = classification.type;
//                 proc.memoryValue = getProcessMemory(proc);
                
//                 if (classification.group === 'Desktop Environments') desktopProcs.push(proc);
//                 else if (classification.group === 'Applications') appProcs.push(proc);
//                 else if (classification.group === 'Background Services') serviceProcs.push(proc);
//                 else platformProcs.push(proc);
//             });

//             // Tabs UI Header HTML
//             const tabsHtml = `
//                 <div class="lde-tabs" style="display: flex; border-bottom: 1px solid var(--lde-border); background: var(--lde-bg-surface-elevated); padding: 4px 8px 0 8px; gap: 4px;">
//                     <button id="tm-tab-processes-${win.id}" class="lde-btn ${activeTab === 'processes' ? 'lde-btn-primary' : ''}" style="padding: 6px 16px; border-bottom: none; border-radius: 4px 4px 0 0; font-size: 13px;">Processes</button>
//                     <button id="tm-tab-sessions-${win.id}" class="lde-btn ${activeTab === 'sessions' ? 'lde-btn-primary' : ''}" style="padding: 6px 16px; border-bottom: none; border-radius: 4px 4px 0 0; font-size: 13px;">Sessions</button>
//                 </div>
//             `;

//             let mainContentHtml = '';

//             if (activeTab === 'processes') {
//                 // Processes list view
//                 const renderGroupRows = (title, list) => {
//                     if (list.length === 0) return '';
//                     return `
//                         <tr style="background: var(--lde-bg-surface-elevated); font-weight: bold; pointer-events: none;">
//                             <td colspan="9" style="font-size: 11px; text-transform: uppercase; color: var(--lde-text-tertiary); padding: 6px 12px;">${title} (${list.length})</td>
//                         </tr>
//                         ${list.map(proc => `
//                             <tr class="tm-row-${win.id} cursor-pointer ${selectedPid === proc.pid ? 'selected' : ''}" data-pid="${proc.pid}">
//                                 <td>${proc.pid}</td>
//                                 <td class="font-bold" style="color: var(--lde-text-primary);">${proc.name}</td>
//                                 <td>${proc.sessionId || '—'}</td>
//                                 <td>${proc.runtimeType}</td>
//                                 <td>${proc.state}</td>
//                                 <td>${proc.memoryValue} MB</td>
//                                 <td>${proc.parentPid || '—'}</td>
//                                 <td>${proc.windowCount || 0}</td>
//                                 <td>${formatTime(proc.startTime)}</td>
//                             </tr>
//                         `).join('')}
//                     `;
//                 };

//                 mainContentHtml = `
//                     <div class="lde-header">
//                         <button id="tm-end-task-${win.id}" class="lde-btn ${selectedPid ? 'lde-btn-danger' : ''}" ${selectedPid ? '' : 'disabled'}>End Task</button>
//                     </div>
//                     <div class="lde-content p-0" style="overflow-y: auto; flex: 1;">
//                         <table class="lde-table" style="width: 100%;">
//                             <thead>
//                                 <tr>
//                                     <th style="width: 60px;">PID</th>
//                                     <th>Name</th>
//                                     <th>Session ID</th>
//                                     <th>Type</th>
//                                     <th>State</th>
//                                     <th>Memory</th>
//                                     <th>Parent</th>
//                                     <th>Windows</th>
//                                     <th>Uptime</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 ${renderGroupRows('Desktop Environments', desktopProcs)}
//                                 ${renderGroupRows('Applications', appProcs)}
//                                 ${renderGroupRows('Background Services', serviceProcs)}
//                                 ${renderGroupRows('Platform Environments', platformProcs)}
//                             </tbody>
//                         </table>
//                     </div>
//                 `;
//             } else {
//                 // Sessions list (Session Inspector) view
//                 const sessions = SessionService.getSessions();
                
//                 mainContentHtml = `
//                     <div class="lde-content p-0" style="overflow-y: auto; flex: 1;">
//                         <table class="lde-table" style="width: 100%;">
//                             <thead>
//                                 <tr>
//                                     <th>Session ID</th>
//                                     <th>Owner</th>
//                                     <th>State</th>
//                                     <th>Desktop</th>
//                                     <th>Desktop State</th>
//                                     <th>Processes</th>
//                                     <th>Windows</th>
//                                     <th>Memory</th>
//                                     <th>Uptime</th>
//                                     <th>Last Active</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 ${sessions.map(sess => {
//                                     const sessProcs = processes.filter(p => p.sessionId === sess.id);
//                                     const procCount = sessProcs.length;
//                                     const winCount = sessProcs.reduce((acc, p) => acc + (p.windowCount || 0), 0);
//                                     const totalMemory = sessProcs.reduce((acc, p) => acc + getProcessMemory(p), 0);

//                                     // Get desktop environment state
//                                     const desktop = DesktopEnvService ? DesktopEnvService.getCurrent(sess.id) : null;
//                                     let desktopLabel = '—';
//                                     if (desktop) {
//                                         const isRunning = desktop.container.style.display !== 'none';
//                                         desktopLabel = `LDE (${isRunning ? 'Running' : 'Suspended'})`;
//                                     }

//                                     return `
//                                         <tr>
//                                             <td class="font-bold" style="color: var(--lde-text-primary);">${sess.id}</td>
//                                             <td>${sess.user?.username || 'Unknown'}</td>
//                                             <td>
//                                                 <span class="lde-badge ${sess.status === 'ACTIVE' ? 'lde-badge-success' : 'lde-badge-secondary'}">
//                                                     ${sess.status}
//                                                 </span>
//                                             </td>
//                                             <td>${desktop ? 'LDE' : '—'}</td>
//                                             <td>${desktopLabel}</td>
//                                             <td>${procCount}</td>
//                                             <td>${winCount}</td>
//                                             <td>${totalMemory} MB</td>
//                                             <td>${formatTime(sess.startTime)}</td>
//                                             <td>${formatTime(new Date(sess.lastActive).toISOString())}</td>
//                                         </tr>
//                                     `;
//                                 }).join('')}
//                             </tbody>
//                         </table>
//                     </div>
//                 `;
//             }

//             win.contentElement.innerHTML = `
//                 <div class="lde-app-container" style="display: flex; flex-direction: column; height: 100%;">
//                     ${tabsHtml}
//                     ${mainContentHtml}
//                 </div>
//             `;

//             // Bind Tab clicks
//             win.contentElement.querySelector(`#tm-tab-processes-${win.id}`).onclick = () => {
//                 activeTab = 'processes';
//                 render();
//             };

//             win.contentElement.querySelector(`#tm-tab-sessions-${win.id}`).onclick = () => {
//                 activeTab = 'sessions';
//                 render();
//             };

//             // Bind Processes List clicks
//             if (activeTab === 'processes') {
//                 win.contentElement.querySelectorAll(`.tm-row-${win.id}`).forEach(row => {
//                     row.onclick = () => {
//                         selectedPid = parseInt(row.dataset.pid, 10);
//                         render();
//                     };
//                 });

//                 const endBtn = win.contentElement.querySelector(`#tm-end-task-${win.id}`);
//                 if (endBtn) {
//                     endBtn.onclick = async () => {
//                         if (selectedPid) {
//                             try {
//                                 ProcessService.terminateProcess(selectedPid);
//                                 selectedPid = null;
//                             } catch (error) {
//                                 await DialogService.alert(error.message, 'Task Manager Error');
//                             }
//                         }
//                     };
//                 }
//             }
//         };

//         render();

//         const safeUpdate = () => {
//             if (!document.body.contains(win.contentElement)) {
//                 return;
//             }
//             render();
//         };

//         EventBus.on('process.started', safeUpdate);
//         EventBus.on('process.terminated', safeUpdate);
//         EventBus.on('window.created', safeUpdate);
//         EventBus.on('window.closed', safeUpdate);

//         const interval = setInterval(safeUpdate, 1000);
//         win.onClose = () => {
//             clearInterval(interval);
//         };
//     }
// };

// ACTUAL TASKMANAGER

// import { EventBus } from '../../kernel/SystemEventBus.js';
// import { 
//     omni_sidebarTab,
//     omni_button,
//     omni_group
// } from '../../platform/settings/SettingsComponents.js';

// /**
//  * TaskManager Application
//  *
//  * Responsibility:
//  * Provides a UI for viewing and terminating running processes, and inspecting sessions.
//  * Conforms strictly to the Omni design system standard without custom inline styles.
//  *
//  * Does NOT:
//  * - Enforce process termination rules
//  */
// export default {
//     run: async (registry, pid) => {
//         // ========================================
//         // Service Retrieval & Verification
//         // ========================================
//         const WindowService = registry.get('WindowService');
//         const ProcessService = registry.get('ProcessService');
//         const DialogService = registry.get('DialogService');
//         const SessionService = registry.get('SessionService');
//         const DesktopEnvService = registry.get('DesktopEnvironmentService');

//         if (!WindowService || !ProcessService || !DialogService || !SessionService) {
//             console.error('[TaskManager] Required services missing.');
//             return;
//         }

//         const win = WindowService.createWindow({
//             title: 'Task Manager',
//             width: 840,
//             height: 520,
//             pid
//         });

//         // ========================================
//         // Application State
//         // ========================================
//         let activeTab = 'processes'; // 'processes' | 'sessions'
//         let selectedPid = null;

//         // ========================================
//         // Helper Functions
//         // ========================================
//         const getProcessMemory = (proc) => {
//             if (proc.appId === 'sys.desktop') {
//                 return 32;
//             }
            
//             const platformApps = ['sys.login', 'sys.lock', 'sys.oobe', 'sys.welcome', 'sys.recovery'];
//             if (platformApps.includes(proc.appId)) {
//                 return 12;
//             }
//             if (proc.background) {
//                 return 8;
//             }
//             return 18;
//         };

//         const classifyProcess = (proc) => {
//             if (proc.appId === 'sys.desktop') {
//                 return { group: 'Desktop Environments', type: 'Desktop Environment' };
//             }
            
//             const platformApps = ['sys.login', 'sys.lock', 'sys.oobe', 'sys.welcome', 'sys.recovery'];
//             if (platformApps.includes(proc.appId)) {
//                 return { group: 'Platform Environments', type: 'Platform Environment' };
//             }
//             if (proc.background) {
//                 return { group: 'Background Services', type: 'Background Service' };
//             }
//             return { group: 'Applications', type: 'Application' };
//         };

//         const formatTime = (isoString) => {
//             try {
//                 const nowTime = Date.now();
//                 const startTime = new Date(isoString).getTime();
//                 const diffSeconds = Math.floor((nowTime - startTime) / 1000);

//                 if (diffSeconds < 60) {
//                     return `${diffSeconds}s`;
//                 }
//                 if (diffSeconds < 3600) {
//                     const minutes = Math.floor(diffSeconds / 60);
//                     return `${minutes}m`;
//                 }
                
//                 const hours = Math.floor(diffSeconds / 3600);
//                 const minutesLeft = Math.floor((diffSeconds % 3600) / 60);
//                 return `${hours}h ${minutesLeft}m`;
//             } catch {
//                 return '-';
//             }
//         };

//         // ========================================
//         // Orchestration & Presentation Layer
//         // ========================================
//         const renderShell = () => {
//             const container = document.createElement('div');
//             container.className = 'omni-layout-row';

//             container.innerHTML = `
//                 <!-- Left Panel: Sidebar Nav & Contextual Actions -->
//                 <div id="tm-sidebar-${win.id}" class="omni-panel-1">
//                     <!-- Dynamic navigation renders here -->
//                 </div>

//                 <!-- Right Panel: Content Viewport -->
//                 <div class="omni-panel-2">
//                     <div id="tm-content-viewport-${win.id}" class="layout-v flex-gap-8 omni-panel-fill">
//                         <!-- Active components render here -->
//                     </div>
//                 </div>
//             `;

//             win.contentElement.appendChild(container);
//         };

//         const updateSidebar = () => {
//             const sidebarEl = win.contentElement.querySelector(`#tm-sidebar-${win.id}`);
//             if (!sidebarEl) return;

//             sidebarEl.innerHTML = '';

//             // 1. Navigation Panel
//             const sidebarGroups = [
//                 {
//                     label: 'System Monitor',
//                     items: [
//                         { id: 'processes', label: 'Processes', icon: '&#xE7F0;' },
//                         { id: 'sessions', label: 'Sessions', icon: '&#xE77B;' }
//                     ]
//                 }
//             ];

//             for (let i = 0; i < sidebarGroups.length; i++) {
//                 const group = sidebarGroups[i];
//                 let itemsHtml = '';

//                 for (let j = 0; j < group.items.length; j++) {
//                     const item = group.items[j];
//                     const isActive = activeTab === item.id;
//                     itemsHtml += omni_sidebarTab(item.id, isActive, item.icon, item.label);
//                 }

//                 sidebarEl.innerHTML += omni_group(group.label, itemsHtml);
//             }

//             // 2. Contextual Actions Panel (End Task moved over to Sidebar)
//             if (activeTab === 'processes') {
//                 const endBtnVariant = selectedPid ? 'danger' : '';
//                 const endBtnHtml = omni_button(`tm-end-task-${win.id}`, '&#xE71A;', 'End Task', endBtnVariant, 'full-width', !selectedPid);
                
//                 sidebarEl.innerHTML += omni_group('Actions', endBtnHtml);

//                 const endBtn = sidebarEl.querySelector(`#tm-end-task-${win.id}`);
//                 if (endBtn) {
//                     endBtn.onclick = async () => {
//                         if (selectedPid) {
//                             try {
//                                 ProcessService.terminateProcess(selectedPid);
//                                 selectedPid = null;
//                                 updateSidebar();
//                                 triggerRefresh();
//                             } catch (error) {
//                                 await DialogService.alert(error.message, 'Task Manager Error');
//                             }
//                         }
//                     };
//                 }
//             }

//             // Bind sidebar tab navigation switching handlers
//             sidebarEl.querySelectorAll('.comp-sidebartab').forEach(tab => {
//                 tab.onclick = () => {
//                     activeTab = tab.dataset.id;
//                     selectedPid = null; // Reset selection on switch
//                     updateSidebar();
//                     triggerRefresh();
//                 };
//             });
//         };

//         const triggerRefresh = () => {
//             const viewport = win.contentElement.querySelector(`#tm-content-viewport-${win.id}`);
//             if (!viewport) return;

//             const processes = ProcessService.getProcesses();
//             let contentHtml = '';

//             if (activeTab === 'processes') {
//                 const desktopProcs = [];
//                 const appProcs = [];
//                 const serviceProcs = [];
//                 const platformProcs = [];

//                 processes.forEach(proc => {
//                     const classification = classifyProcess(proc);
//                     proc.runtimeType = classification.type;
//                     proc.memoryValue = getProcessMemory(proc);
                    
//                     if (classification.group === 'Desktop Environments') {
//                         desktopProcs.push(proc);
//                     } else if (classification.group === 'Applications') {
//                         appProcs.push(proc);
//                     } else if (classification.group === 'Background Services') {
//                         serviceProcs.push(proc);
//                     } else {
//                         platformProcs.push(proc);
//                     }
//                 });

//                 const renderGroupRows = (title, list) => {
//                     if (list.length === 0) {
//                         return '';
//                     }

//                     const rowsHtml = list.map(proc => {
//                         const isSelected = selectedPid === proc.pid;
//                         const rowClass = `tm-row-${win.id} omni-table-row ${isSelected ? 'selected' : ''}`;
                        
//                         return `
//                             <tr class="${rowClass}" data-pid="${proc.pid}">
//                                 <td>${proc.pid}</td>
//                                 <td class="font-bold">${proc.name}</td>
//                                 <td>${proc.sessionId || '—'}</td>
//                                 <td>${proc.runtimeType}</td>
//                                 <td>${proc.state}</td>
//                                 <td>${proc.memoryValue} MB</td>
//                                 <td>${proc.parentPid || '—'}</td>
//                                 <td>${proc.windowCount || 0}</td>
//                                 <td>${formatTime(proc.startTime)}</td>
//                             </tr>
//                         `;
//                     }).join('');

//                     return `
//                         <tr class="omni-table-group-header">
//                             <td colspan="9">${title} (${list.length})</td>
//                         </tr>
//                         ${rowsHtml}
//                     `;
//                 };

//                 contentHtml = `
//                     <div class="omni-table-scroll omni-panel-fill">
//                         <table class="omni-table">
//                             <thead>
//                                 <tr>
//                                     <th>PID</th>
//                                     <th>Name</th>
//                                     <th>Session ID</th>
//                                     <th>Type</th>
//                                     <th>State</th>
//                                     <th>Memory</th>
//                                     <th>Parent</th>
//                                     <th>Windows</th>
//                                     <th>Uptime</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 ${renderGroupRows('Desktop Environments', desktopProcs)}
//                                 ${renderGroupRows('Applications', appProcs)}
//                                 ${renderGroupRows('Background Services', serviceProcs)}
//                                 ${renderGroupRows('Platform Environments', platformProcs)}
//                             </tbody>
//                         </table>
//                     </div>
//                 `;
//             } else {
//                 const sessions = SessionService.getSessions();
                
//                 const sessionRowsHtml = sessions.map(sess => {
//                     const sessProcs = processes.filter(p => p.sessionId === sess.id);
//                     const procCount = sessProcs.length;
//                     const winCount = sessProcs.reduce((acc, p) => acc + (p.windowCount || 0), 0);
//                     const totalMemory = sessProcs.reduce((acc, p) => acc + getProcessMemory(p), 0);

//                     const desktop = DesktopEnvService ? DesktopEnvService.getCurrent(sess.id) : null;
//                     let desktopLabel = '—';
//                     if (desktop) {
//                         const isRunning = desktop.container.style.display !== 'none';
//                         desktopLabel = `LDE (${isRunning ? 'Running' : 'Suspended'})`;
//                     }

//                     const badgeClass = sess.status === 'ACTIVE' ? 'tag success' : 'tag secondary';

//                     return `
//                         <tr class="omni-table-row">
//                             <td class="font-bold">${sess.id}</td>
//                             <td>${sess.user?.username || 'Unknown'}</td>
//                             <td>
//                                 <span class="${badgeClass}">
//                                     ${sess.status}
//                                 </span>
//                             </td>
//                             <td>${desktop ? 'LDE' : '—'}</td>
//                             <td>${desktopLabel}</td>
//                             <td>${procCount}</td>
//                             <td>${winCount}</td>
//                             <td>${totalMemory} MB</td>
//                             <td>${formatTime(sess.startTime)}</td>
//                             <td>${formatTime(new Date(sess.lastActive).toISOString())}</td>
//                         </tr>
//                     `;
//                 }).join('');

//                 contentHtml = `
//                     <div class="omni-table-scroll omni-panel-fill">
//                         <table class="omni-table">
//                             <thead>
//                                 <tr>
//                                     <th>Session ID</th>
//                                     <th>Owner</th>
//                                     <th>State</th>
//                                     <th>Desktop</th>
//                                     <th>Desktop State</th>
//                                     <th>Processes</th>
//                                     <th>Windows</th>
//                                     <th>Memory</th>
//                                     <th>Uptime</th>
//                                     <th>Last Active</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 ${sessionRowsHtml}
//                             </tbody>
//                         </table>
//                     </div>
//                 `;
//             }

//             viewport.innerHTML = contentHtml;

//             if (activeTab === 'processes') {
//                 viewport.querySelectorAll(`.tm-row-${win.id}`).forEach(row => {
//                     row.onclick = () => {
//                         selectedPid = parseInt(row.dataset.pid, 10);
//                         updateSidebar(); // Refresh action button context dynamically on row changes
//                         triggerRefresh();
//                     };
//                 });
//             }
//         };

//         // ========================================
//         // Application Initialization & Lifecycle
//         // ========================================
//         renderShell();
//         updateSidebar();
//         triggerRefresh();

//         const safeUpdate = () => {
//             if (!document.body.contains(win.contentElement)) {
//                 return;
//             }
//             updateSidebar();
//             triggerRefresh();
//         };

//         EventBus.on('process.started', safeUpdate);
//         EventBus.on('process.terminated', safeUpdate);
//         EventBus.on('window.created', safeUpdate);
//         EventBus.on('window.closed', safeUpdate);

//         const interval = setInterval(safeUpdate, 1000);
        
//         win.onClose = () => {
//             clearInterval(interval);
//             EventBus.off('process.started', safeUpdate);
//             EventBus.off('process.terminated', safeUpdate);
//             EventBus.off('window.created', safeUpdate);
//             EventBus.off('window.closed', safeUpdate);
//         };
//     }
// };

// only the fun one xd

import { EventBus } from '../../kernel/SystemEventBus.js';
import { 
    omni_sidebarTab,
    omni_button,
    omni_group
} from '../../platform/settings/SettingsComponents.js';

/**
 * TaskManager Application
 *
 * Responsibility:
 * Provides a UI for viewing and terminating running processes, inspecting sessions,
 * and monitoring system utilization with a real-time vector line graph.
 * Conforms strictly to the Omni design system standard.
 *
 * Does NOT:
 * - Enforce process termination rules
 */
export default {
    run: async (registry, pid) => {
        // ========================================
        // Service Retrieval & Verification
        // ========================================
        const WindowService = registry.get('WindowService');
        const ProcessService = registry.get('ProcessService');
        const DialogService = registry.get('DialogService');
        const SessionService = registry.get('SessionService');
        const DesktopEnvService = registry.get('DesktopEnvironmentService');

        if (!WindowService || !ProcessService || !DialogService || !SessionService) {
            console.error('[TaskManager] Required services missing.');
            return;
        }

        const win = WindowService.createWindow({
            title: 'Task Manager',
            width: 840,
            height: 520,
            pid
        });

        // ========================================
        // Application State & Telemetry History
        // ========================================
        let activeTab = 'processes'; // 'processes' | 'sessions' | 'performance'
        let lastRenderedTab = null;  // Track layout state shifts to prevent canvas rebuild resets
        let selectedPid = null;

        // Metrics history queues (50 rolling records)
        const maxHistoryPoints = 50;
        const cpuHistory = Array(maxHistoryPoints).fill(0);
        const memoryHistory = Array(maxHistoryPoints).fill(0);

        // ========================================
        // Helper Functions
        // ========================================
        const getProcessMemory = (proc) => {
            if (proc.appId === 'sys.desktop') {
                return 32;
            }
            
            const platformApps = ['sys.login', 'sys.lock', 'sys.oobe', 'sys.welcome', 'sys.recovery'];
            if (platformApps.includes(proc.appId)) {
                return 12;
            }
            if (proc.background) {
                return 8;
            }
            return 18;
        };

        const classifyProcess = (proc) => {
            if (proc.appId === 'sys.desktop') {
                return { group: 'Desktop Environments', type: 'Desktop Environment' };
            }
            
            const platformApps = ['sys.login', 'sys.lock', 'sys.oobe', 'sys.welcome', 'sys.recovery'];
            if (platformApps.includes(proc.appId)) {
                return { group: 'Platform Environments', type: 'Platform Environment' };
            }
            if (proc.background) {
                return { group: 'Background Services', type: 'Background Service' };
            }
            return { group: 'Applications', type: 'Application' };
        };

        const formatTime = (isoString) => {
            try {
                const nowTime = Date.now();
                const startTime = new Date(isoString).getTime();
                const diffSeconds = Math.floor((nowTime - startTime) / 1000);

                if (diffSeconds < 60) {
                    return `${diffSeconds}s`;
                }
                if (diffSeconds < 3600) {
                    const minutes = Math.floor(diffSeconds / 60);
                    return `${minutes}m`;
                }
                
                const hours = Math.floor(diffSeconds / 3600);
                const minutesLeft = Math.floor((diffSeconds % 3600) / 60);
                return `${hours}h ${minutesLeft}m`;
            } catch {
                return '-';
            }
        };

        // ========================================
        // Real-Time System Telemetry Tracker
        // ========================================
        const recordTick = () => {
            const currentProcesses = ProcessService.getProcesses();
            
            // Calculate actual total RAM footprint
            let totalMemorySum = 0;
            for (let i = 0; i < currentProcesses.length; i++) {
                totalMemorySum += getProcessMemory(currentProcesses[i]);
            }
            
            // Correlate logical CPU cycles based on active processes, windows, and clock cycles
            let totalWindowsCount = 0;
            for (let i = 0; i < currentProcesses.length; i++) {
                totalWindowsCount += currentProcesses[i].windowCount || 0;
            }
            
            const baseCpu = 4 + (currentProcesses.length * 1.2) + (totalWindowsCount * 1.5);
            const oscillatingJitter = Math.sin(Date.now() / 4000) * 3;
            const randomJitter = Math.random() * 4;
            const finalCpu = Math.min(100, Math.max(1, Math.round(baseCpu + oscillatingJitter + randomJitter)));
            
            // Push values to queues and drop oldest indices
            cpuHistory.push(finalCpu);
            cpuHistory.shift();
            
            memoryHistory.push(totalMemorySum);
            memoryHistory.shift();
        };

        // Initialize telemetry buffers immediately on launch sequence
        for (let i = 0; i < maxHistoryPoints; i++) {
            recordTick();
        }

        // ========================================
        // Vector Performance Graph Render Engine
        // ========================================
        const drawPerformanceChart = (canvas, historyData, maxValue, strokeColor, fillColor) => {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Get live layout bounding boxes
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            const width = rect.width;
            const height = rect.height;
            
            // Adjust back buffer layout to retain crisp lines on high-DPI
            if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
                canvas.width = Math.floor(width * dpr);
                canvas.height = Math.floor(height * dpr);
            }
            
            ctx.resetTransform();
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, width, height);

            // Draw flat, subtle dashboard utility grid matching Omni borders
            ctx.strokeStyle = '#202020';
            ctx.lineWidth = 1;

            // Horizontal rows (4 segments)
            for (let row = 1; row < 4; row++) {
                const gridY = (height / 4) * row;
                ctx.beginPath();
                ctx.moveTo(0, gridY);
                ctx.lineTo(width, gridY);
                ctx.stroke();
            }

            // Vertical columns (8 segments scrolling left)
            const verticalGridCount = 8;
            for (let col = 1; col < verticalGridCount; col++) {
                const gridX = (width / verticalGridCount) * col;
                ctx.beginPath();
                ctx.moveTo(gridX, 0);
                ctx.lineTo(gridX, height);
                ctx.stroke();
            }

            if (historyData.length < 2) return;

            const stepX = width / (maxHistoryPoints - 1);
            const points = [];

            for (let index = 0; index < historyData.length; index++) {
                const value = historyData[index];
                const percentageOfMax = value / maxValue;
                // Subtract offsets to prevent lines clipping against outer canvas borders
                const coordY = height - (percentageOfMax * (height - 10)) - 5; 
                const coordX = index * stepX;
                points.push({ x: coordX, y: coordY });
            }

            // Draw clean monochrome gradient region below vector line path
            ctx.fillStyle = fillColor;
            ctx.beginPath();
            ctx.moveTo(0, height);
            for (let idx = 0; idx < points.length; idx++) {
                ctx.lineTo(points[idx].x, points[idx].y);
            }
            ctx.lineTo(points[points.length - 1].x, height);
            ctx.closePath();
            ctx.fill();

            // Draw line path stroke (Flat, clean styling — No Glow)
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1.5;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let idx = 1; idx < points.length; idx++) {
                ctx.lineTo(points[idx].x, points[idx].y);
            }
            ctx.stroke();
        };

        // ========================================
        // Orchestration & Presentation Layer
        // ========================================
        const renderShell = () => {
            const container = document.createElement('div');
            container.className = 'omni-layout-row';

            container.innerHTML = `
                <!-- Left Panel: Sidebar Nav & Contextual Actions -->
                <div id="tm-sidebar-${win.id}" class="omni-panel-1">
                    <!-- Dynamic navigation renders here -->
                </div>

                <!-- Right Panel: Content Viewport -->
                <div class="omni-panel-2">
                    <div id="tm-content-viewport-${win.id}" class="layout-v flex-gap-8 omni-panel-fill">
                        <!-- Active components render here -->
                    </div>
                </div>
            `;

            win.contentElement.appendChild(container);
        };

        const updateSidebar = () => {
            const sidebarEl = win.contentElement.querySelector(`#tm-sidebar-${win.id}`);
            if (!sidebarEl) return;

            sidebarEl.innerHTML = '';

            // 1. Navigation Panel
            const sidebarGroups = [
                {
                    label: 'System Monitor',
                    items: [
                        { id: 'processes', label: 'Processes', icon: '&#xE7F0;' },
                        { id: 'performance', label: 'Performance', icon: '&#xE9E9;' }, 
                        { id: 'sessions', label: 'Sessions', icon: '&#xE77B;' }
                    ]
                }
            ];

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

            // 2. Contextual Actions Panel
            if (activeTab === 'processes') {
                const endBtnVariant = selectedPid ? 'danger' : '';
                const endBtnHtml = omni_button(`tm-end-task-${win.id}`, '&#xE71A;', 'End Task', endBtnVariant, 'full-width', !selectedPid);
                
                sidebarEl.innerHTML += omni_group('Actions', endBtnHtml);

                const endBtn = sidebarEl.querySelector(`#tm-end-task-${win.id}`);
                if (endBtn) {
                    endBtn.onclick = async () => {
                        if (selectedPid) {
                            try {
                                ProcessService.terminateProcess(selectedPid);
                                selectedPid = null;
                                updateSidebar();
                                triggerRefresh();
                            } catch (error) {
                                await DialogService.alert(error.message, 'Task Manager Error');
                            }
                        }
                    };
                }
            }

            // Bind sidebar tab navigation switching handlers
            sidebarEl.querySelectorAll('.comp-sidebartab').forEach(tab => {
                tab.onclick = () => {
                    activeTab = tab.dataset.id;
                    selectedPid = null; 
                    updateSidebar();
                    triggerRefresh();
                };
            });
        };

        const triggerRefresh = () => {
            const viewport = win.contentElement.querySelector(`#tm-content-viewport-${win.id}`);
            if (!viewport) return;

            const processes = ProcessService.getProcesses();

            // Determine if the active tab shifted structurally
            const isTabChanged = lastRenderedTab !== activeTab;
            if (isTabChanged) {
                lastRenderedTab = activeTab;
                
                // Initialize clean structural DOM blueprints on tab switches (No redundant paddings)
                if (activeTab === 'performance') {
                    viewport.innerHTML = `
                        <div class="layout-v flex-gap-16 omni-panel-fill">
                            <h3>Performance Monitor</h3>
                            
                            <!-- Dynamic Double-Column Monochrome Graph Dashboard -->
                            <div class="layout-h flex-gap-16 flex-1">
                                
                                <!-- CPU Card -->
                                <div class="omni-panel-1 layout-v flex-gap-12 flex-1">
                                    <div class="layout-h flex-space-between flex-align-center">
                                        <span class="font-bold">CPU utilization</span>
                                        <span id="perf-cpu-value-${win.id}" class="font-light" style="font-size: 24px; font-variant-numeric: tabular-nums;">0%</span>
                                    </div>
                                    <div class="flex-1" style="position: relative; min-height: 100px;">
                                        <canvas id="perf-cpu-canvas-${win.id}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: block;"></canvas>
                                    </div>
                                </div>
                                
                                <!-- Memory Card -->
                                <div class="omni-panel-1 layout-v flex-gap-12 flex-1">
                                    <div class="layout-h flex-space-between flex-align-center">
                                        <span class="font-bold">Memory allocation</span>
                                        <span id="perf-mem-value-${win.id}" class="font-light" style="font-size: 24px; font-variant-numeric: tabular-nums;">0 MB</span>
                                    </div>
                                    <div class="flex-1" style="position: relative; min-height: 100px;">
                                        <canvas id="perf-mem-canvas-${win.id}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: block;"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (activeTab === 'processes') {
                    viewport.innerHTML = `
                        <div class="omni-table-scroll omni-panel-fill">
                            <table class="omni-table">
                                <thead>
                                    <tr>
                                        <th>PID</th>
                                        <th>Name</th>
                                        <th>Session ID</th>
                                        <th>Type</th>
                                        <th>State</th>
                                        <th>Memory</th>
                                        <th>Parent</th>
                                        <th>Windows</th>
                                        <th>Uptime</th>
                                    </tr>
                                </thead>
                                <tbody id="tm-processes-list-${win.id}"></tbody>
                            </table>
                        </div>
                    `;
                } else if (activeTab === 'sessions') {
                    viewport.innerHTML = `
                        <div class="omni-table-scroll omni-panel-fill">
                            <table class="omni-table">
                                <thead>
                                    <tr>
                                        <th>Session ID</th>
                                        <th>Owner</th>
                                        <th>State</th>
                                        <th>Desktop</th>
                                        <th>Desktop State</th>
                                        <th>Processes</th>
                                        <th>Windows</th>
                                        <th>Memory</th>
                                        <th>Uptime</th>
                                        <th>Last Active</th>
                                    </tr>
                                </thead>
                                <tbody id="tm-sessions-list-${win.id}"></tbody>
                            </table>
                        </div>
                    `;
                }
            }

            // ========================================
            // Real-Time Inline Value Redrawing
            // ========================================
            if (activeTab === 'performance') {
                const cpuValEl = viewport.querySelector(`#perf-cpu-value-${win.id}`);
                const memValEl = viewport.querySelector(`#perf-mem-value-${win.id}`);
                const cpuCanvas = viewport.querySelector(`#perf-cpu-canvas-${win.id}`);
                const memCanvas = viewport.querySelector(`#perf-mem-canvas-${win.id}`);

                const latestCpu = cpuHistory[cpuHistory.length - 1];
                const latestMem = memoryHistory[memoryHistory.length - 1];

                if (cpuValEl) {
                    cpuValEl.textContent = `${latestCpu}%`;
                }
                if (memValEl) {
                    memValEl.textContent = `${latestMem} MB`;
                }

                // Render monochrome vector charts cleanly inside existing canvases (Pure clean stroke)
                if (cpuCanvas) {
                    drawPerformanceChart(
                        cpuCanvas, 
                        cpuHistory, 
                        100, 
                        '#ffffff', 
                        'rgba(255, 255, 255, 0.03)'
                    );
                }
                
                if (memCanvas) {
                    const maxMemoryRecorded = Math.max(...memoryHistory);
                    const memoryAxisCeiling = Math.max(256, Math.ceil(maxMemoryRecorded / 64) * 64);
                    drawPerformanceChart(
                        memCanvas, 
                        memoryHistory, 
                        memoryAxisCeiling, 
                        '#ffffff', 
                        'rgba(255, 255, 255, 0.03)'
                    );
                }
            } else if (activeTab === 'processes') {
                const listTarget = viewport.querySelector(`#tm-processes-list-${win.id}`);
                if (!listTarget) return;

                const desktopProcs = [];
                const appProcs = [];
                const serviceProcs = [];
                const platformProcs = [];

                processes.forEach(proc => {
                    const classification = classifyProcess(proc);
                    proc.runtimeType = classification.type;
                    proc.memoryValue = getProcessMemory(proc);
                    
                    if (classification.group === 'Desktop Environments') {
                        desktopProcs.push(proc);
                    } else if (classification.group === 'Applications') {
                        appProcs.push(proc);
                    } else if (classification.group === 'Background Services') {
                        serviceProcs.push(proc);
                    } else {
                        platformProcs.push(proc);
                    }
                });

                const renderGroupRows = (title, list) => {
                    if (list.length === 0) {
                        return '';
                    }

                    const rowsHtml = list.map(proc => {
                        const isSelected = selectedPid === proc.pid;
                        const rowClass = `tm-row-${win.id} omni-table-row ${isSelected ? 'selected' : ''}`;
                        
                        return `
                            <tr class="${rowClass}" data-pid="${proc.pid}">
                                <td>${proc.pid}</td>
                                <td class="font-bold">${proc.name}</td>
                                <td>${proc.sessionId || '—'}</td>
                                <td>${proc.runtimeType}</td>
                                <td>${proc.state}</td>
                                <td>${proc.memoryValue} MB</td>
                                <td>${proc.parentPid || '—'}</td>
                                <td>${proc.windowCount || 0}</td>
                                <td>${formatTime(proc.startTime)}</td>
                            </tr>
                        `;
                    }).join('');

                    return `
                        <tr class="omni-table-group-header">
                            <td colspan="9">${title} (${list.length})</td>
                        </tr>
                        ${rowsHtml}
                    `;
                };

                listTarget.innerHTML = `
                    ${renderGroupRows('Desktop Environments', desktopProcs)}
                    ${renderGroupRows('Applications', appProcs)}
                    ${renderGroupRows('Background Services', serviceProcs)}
                    ${renderGroupRows('Platform Environments', platformProcs)}
                `;

                listTarget.querySelectorAll(`.tm-row-${win.id}`).forEach(row => {
                    row.onclick = () => {
                        selectedPid = parseInt(row.dataset.pid, 10);
                        updateSidebar(); 
                        triggerRefresh();
                    };
                });
            } else if (activeTab === 'sessions') {
                const listTarget = viewport.querySelector(`#tm-sessions-list-${win.id}`);
                if (!listTarget) return;

                const sessions = SessionService.getSessions() || [];
                
                const sessionRowsHtml = sessions.map(sess => {
                    const sessProcs = processes.filter(p => p.sessionId === sess.id);
                    const procCount = sessProcs.length;
                    const winCount = sessProcs.reduce((acc, p) => acc + (p.windowCount || 0), 0);
                    const totalMemory = sessProcs.reduce((acc, p) => acc + getProcessMemory(p), 0);

                    const desktop = DesktopEnvService ? DesktopEnvService.getCurrent(sess.id) : null;
                    let desktopLabel = '—';
                    if (desktop) {
                        const isRunning = desktop.container.style.display !== 'none';
                        desktopLabel = `LDE (${isRunning ? 'Running' : 'Suspended'})`;
                    }

                    const badgeClass = sess.status === 'ACTIVE' ? 'tag success' : 'tag secondary';

                    return `
                        <tr class="omni-table-row">
                            <td class="font-bold">${sess.id}</td>
                            <td>${sess.user?.username || 'Unknown'}</td>
                            <td>
                                <span class="${badgeClass}">
                                    ${sess.status}
                                </span>
                            </td>
                            <td>${desktop ? 'LDE' : '—'}</td>
                            <td>${desktopLabel}</td>
                            <td>${procCount}</td>
                            <td>${winCount}</td>
                            <td>${totalMemory} MB</td>
                            <td>${formatTime(sess.startTime)}</td>
                            <td>${formatTime(new Date(sess.lastActive).toISOString())}</td>
                        </tr>
                    `;
                }).join('');

                listTarget.innerHTML = sessionRowsHtml;
            }
        };

        // ========================================
        // Application Initialization & Lifecycle
        // ========================================
        renderShell();
        updateSidebar();
        triggerRefresh();

        const safeUpdate = () => {
            if (!document.body.contains(win.contentElement)) {
                return;
            }
            
            // Record performance background ticks on every cycle
            recordTick();
            
            updateSidebar();
            triggerRefresh();
        };

        EventBus.on('process.started', safeUpdate);
        EventBus.on('process.terminated', safeUpdate);
        EventBus.on('window.created', safeUpdate);
        EventBus.on('window.closed', safeUpdate);

        const interval = setInterval(safeUpdate, 1000);
        
        win.onClose = () => {
            clearInterval(interval);
            EventBus.off('process.started', safeUpdate);
            EventBus.off('process.terminated', safeUpdate);
            EventBus.off('window.created', safeUpdate);
            EventBus.off('window.closed', safeUpdate);
        };
    }
};