/**
 * EventViewer Application
 *
 * Responsibility:
 * Provides a graphical interface for viewing system logs.
 *
 * Does NOT:
 * - Collect logs or manage log persistence
 */
export default {
    run: async (registry, pid) => {
        const WindowService = registry.get('WindowService');
        const LogService = registry.get('LogService');

        if (!WindowService || !LogService) {
            console.error('[EventViewer] Required services missing.');
            return;
        }

        const win = WindowService.createWindow({
            title: 'Event Viewer',
            width: 600,
            height: 400,
            pid,
            onClose: () => {
                LogService.unsubscribe(handleNewLog);
            }
        });

        let currentFilter = 'All';

        const formatLog = (l) => {
            const colorClass = l.severity === 'Error' ? 'text-danger' : l.severity === 'Warning' ? 'text-warning' : 'text-accent';
            return `
                <tr>
                    <td class="text-muted">[${new Date(l.timestamp).toLocaleTimeString()}]</td>
                    <td class="${colorClass} font-bold">${l.severity}</td>
                    <td class="text-secondary">${l.source}</td>
                    <td class="text-primary font-bold">${l.event}</td>
                    <td class="text-secondary" style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${l.message.replace(/"/g, '&quot;')}">${l.message}</td>
                </tr>
            `;
        };

        const renderShell = () => {
            let html = `
                <div class="lde-app-container">
                    <div class="lde-header wrapper-horizontal-inline flex-gap-12">
                        <button id="ev-clear-${win.id}" class="lde-btn">Clear Logs</button>
                        <select id="ev-filter-${win.id}" class="lde-input" style="width: auto;">
                            <option value="All" ${currentFilter === 'All' ? 'selected' : ''}>All</option>
                            <option value="Info" ${currentFilter === 'Info' ? 'selected' : ''}>Info</option>
                            <option value="Warning" ${currentFilter === 'Warning' ? 'selected' : ''}>Warning</option>
                            <option value="Error" ${currentFilter === 'Error' ? 'selected' : ''}>Error</option>
                        </select>
                    </div>
                    <div class="lde-content p-0">
                        <table class="lde-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Severity</th>
                                    <th>Source</th>
                                    <th>Event</th>
                                    <th>Message</th>
                                </tr>
                            </thead>
                            <tbody id="ev-logs-${win.id}">
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            win.contentElement.innerHTML = html;

            win.contentElement.querySelector(`#ev-clear-${win.id}`).onclick = () => {
                LogService.clearLogs();
                refreshLogs();
            };

            win.contentElement.querySelector(`#ev-filter-${win.id}`).onchange = (e) => {
                currentFilter = e.target.value;
                refreshLogs();
            };
        };

        const refreshLogs = () => {
            const allLogs = LogService.getLogs();
            const filtered = currentFilter === 'All' ? allLogs : allLogs.filter(l => l.severity === currentFilter);
            const container = win.contentElement.querySelector(`#ev-logs-${win.id}`);
            if (container) {
                container.innerHTML = filtered.map(formatLog).join('');
                container.scrollTop = container.scrollHeight;
            }
        };

        const handleNewLog = (entry) => {
            if (currentFilter !== 'All' && entry.severity !== currentFilter) return;
            
            const container = win.contentElement.querySelector(`#ev-logs-${win.id}`);
            if (container) {
                const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
                
                const div = document.createElement('table');
                div.innerHTML = `<tbody>${formatLog(entry)}</tbody>`;
                container.appendChild(div.querySelector('tr'));

                if (isAtBottom) {
                    container.scrollTop = container.scrollHeight;
                }
            }
        };

        renderShell();
        refreshLogs();
        
        LogService.subscribe(handleNewLog);
    }
};
