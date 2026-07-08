import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * TaskManager Application
 *
 * Responsibility:
 * Provides a UI for viewing and terminating running processes.
 *
 * Does NOT:
 * - Enforce process termination rules
 */
export default {
    run: async (registry, pid) => {
        const WindowService = registry.get('WindowService');
        const ProcessService = registry.get('ProcessService');
        const DialogService = registry.get('DialogService');

        if (!WindowService || !ProcessService || !DialogService) {
            console.error('[TaskManager] Required services missing.');
            return;
        }

        const win = WindowService.createWindow({
            title: 'Task Manager',
            width: 700,
            height: 450,
            pid
        });

        let selectedPid = null;

        const render = () => {
            const processes = ProcessService.getProcesses();
            
            const formatTime = (isoString) => {
                try {
                    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
                    if (diff < 60) return `${diff}s`;
                    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
                    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
                } catch {
                    return '-';
                }
            };

            let html = `
                <div class="lde-app-container">
                    <div class="lde-header">
                        <button id="tm-end-task-${win.id}" class="lde-btn ${selectedPid ? 'lde-btn-danger' : ''}" ${selectedPid ? '' : 'disabled'}>End Task</button>
                    </div>
                    <div class="lde-content p-0">
                        <table class="lde-table">
                            <thead>
                                <tr>
                                    <th>PID</th>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>State</th>
                                    <th>Owner</th>
                                    <th>Parent</th>
                                    <th>Windows</th>
                                    <th>Uptime</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${processes.map(proc => `
                                    <tr class="tm-row-${win.id} cursor-pointer ${selectedPid === proc.pid ? 'selected' : ''}" data-pid="${proc.pid}">
                                        <td>${proc.pid}</td>
                                        <td class="font-bold" style="color: var(--lde-text-primary);">${proc.name}</td>
                                        <td>${proc.background ? 'Background' : 'Foreground'}</td>
                                        <td>${proc.state}</td>
                                        <td>${proc.ownerUsername}</td>
                                        <td>${proc.parentPid || '-'}</td>
                                        <td>${proc.windowCount || 0}</td>
                                        <td>${formatTime(proc.startTime)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            
            win.contentElement.innerHTML = html;

            // Bind Events
            win.contentElement.querySelectorAll(`.tm-row-${win.id}`).forEach(row => {
                row.onclick = () => {
                    selectedPid = parseInt(row.dataset.pid, 10);
                    render();
                };
            });

            const endBtn = win.contentElement.querySelector(`#tm-end-task-${win.id}`);
            if (endBtn) {
                endBtn.onclick = async () => {
                    if (selectedPid) {
                        try {
                            ProcessService.terminateProcess(selectedPid);
                            selectedPid = null;
                        } catch (error) {
                            await DialogService.alert(error.message, 'Task Manager Error');
                        }
                    }
                };
            }
        };

        render();

        const safeUpdate = () => {
            if (!document.body.contains(win.contentElement)) {
                return;
            }
            render();
        };

        EventBus.on('process.started', safeUpdate);
        EventBus.on('process.terminated', safeUpdate);
        EventBus.on('windowManager:create', safeUpdate);
        EventBus.on('windowManager:close', safeUpdate);

        setInterval(safeUpdate, 1000);
    }
};
