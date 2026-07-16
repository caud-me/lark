import { EventBus } from '../../../kernel/SystemEventBus.js';
import { ShutdownScreen } from '../../desktop/shell/ShutdownScreen.js';

/**
 * Shutdown Application
 * 
 * Responsibility:
 * Presentation runner that coordinates between the user environment
 * event lifecycle and the display screen component.
 */
export default {
    run: async (registry, pid) => {
        const platformHost = document.getElementById('platform-host');
        if (!platformHost) return;

        const shutdownService = registry.get('ShutdownService');
        if (!shutdownService) {
            console.error('[Shutdown] ShutdownService missing.');
            return;
        }

        // Deduplicate: Reuse or create the container
        let container = document.getElementById('shutdown-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'shutdown-container';
            container.className = 'lde-shell shutdown-shell';
            container.setAttribute('data-environment-type', 'shutdown');
            platformHost.appendChild(container);
        }

        // Dynamic styling injection to ensure black background viewport
        if (!document.getElementById('shutdown-style')) {
            const style = document.createElement('style');
            style.id = 'shutdown-style';
            style.textContent = `
                .shutdown-shell {
                    position: fixed;
                    inset: 0;
                    background: #000000;
                    color: #ffffff;
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: var(--lde-font-family, sans-serif);
                    cursor: none;
                }
            `;
            document.head.appendChild(style);
        }

        // Instantiate and mount presentation-only ShutdownScreen
        const screen = new ShutdownScreen();
        screen.mount(container, registry);

        const onCompleted = async () => {
            unsubscribeAll();
            await screen.complete();
        };

        const unsubscribeAll = () => {
            EventBus.off('shutdown.completed', onCompleted);
        };

        // Subscribe to presentation events
        EventBus.on('shutdown.completed', onCompleted);

        // Begin orchestration in the background
        try {
            await shutdownService.execute();
        } catch (e) {
            console.error('[Shutdown] Orchestration failed:', e);
            unsubscribeAll();
            await screen.complete();
        }
    }
};
