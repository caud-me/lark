import { Dock } from '../../ui/Dock.js';
import { NotificationCenter } from '../../ui/NotificationCenter.js';
import { Wallpaper } from '../../ui/Wallpaper.js';
import { PowerMenu } from '../../ui/PowerMenu.js';
import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * Desktop System App
 * 
 * Responsibility:
 * Acts as the primary workspace orchestrator. Assembles the Wallpaper, 
 * Dock, PowerMenu, and NotificationCenter on boot.
 * 
 * Does NOT:
 * - Implement UI rendering logic directly
 */
export default {
    run: async (registry, pid) => {
        EventBus.emit('desktop:start', { severity: 'Info', source: 'Desktop', message: 'Starting Desktop System App...' });

        const ProcessService = registry.get('ProcessService');
        const AppService = registry.get('AppService');

        if (!ProcessService || !AppService) {
            EventBus.emit('desktop:error', { severity: 'Error', source: 'Desktop', message: 'Failed to retrieve required services.' });
            return;
        }

        const desktopEl = document.getElementById('desktop');
        const windowHost = document.getElementById('window-host');

        const wallpaper = new Wallpaper(registry);
        const powerMenu = new PowerMenu(registry);
        const notificationCenter = new NotificationCenter(registry);
        const dock = new Dock((appId) => {
            EventBus.emit('desktop:launch', { severity: 'Info', source: 'Desktop', message: `Launching ${appId} via ProcessService` });
            ProcessService.startProcess(appId);
        });

        // Insert background and menu behind the window-host
        desktopEl.insertBefore(wallpaper.element, windowHost);
        desktopEl.insertBefore(powerMenu.element, windowHost);
        desktopEl.appendChild(dock.element);
        desktopEl.appendChild(notificationCenter.container);

        // Update Dock state
        const apps = AppService.getApps();
        const updateDock = () => {
            const procs = ProcessService.getProcesses();
            const runningAppIds = Array.from(new Set(procs.map(p => p.appId)));
            dock.render(apps, runningAppIds);
        };
        updateDock();
        
        const onProcessLifecycle = () => updateDock();
        EventBus.on('process.started', onProcessLifecycle);
        EventBus.on('process.terminated', onProcessLifecycle);

        // Cleanup on termination
        let cleanedUp = false;
        const onTerminated = (payload) => {
            if (cleanedUp) return;
            if (payload.data && payload.data.pid === pid) {
                cleanedUp = true;
                wallpaper.destroy();
                powerMenu.destroy();
                dock.element.remove(); // Dock lacks a proper destroy method for now
                notificationCenter.container.remove();
                
                if (typeof EventBus.off === 'function') {
                    EventBus.off('process.terminated', onTerminated);
                    EventBus.off('process.started', onProcessLifecycle);
                    EventBus.off('process.terminated', onProcessLifecycle);
                }
            }
        };
        EventBus.on('process.terminated', onTerminated);

        EventBus.emit('desktop:ready', { severity: 'Info', source: 'Desktop', message: 'Workspace initialized.' });
    }
};
