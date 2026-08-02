import { CapabilityProvider } from './CapabilityProvider.js';

/**
 * NotificationCapabilityProvider
 *
 * Responsibility:
 * Adapts the internal NotificationService for public OS consumption.
 */
export class NotificationCapabilityProvider extends CapabilityProvider {
    constructor(registry) {
        super();
        this.registry = registry;
    }

    getName() {
        return 'NotificationCapabilityProvider';
    }

    forProcess(pid) {
        return {
            notify: (options) => {
                const processService = this.registry.get('ProcessService');
                const appService = this.registry.get('ApplicationService');
                const notificationService = this.registry.get('NotificationService');
                
                const process = processService ? processService.getProcess(pid) : null;
                const appId = process ? process.appId : 'unknown';
                const app = appService ? appService.getApplication(appId) : null;
                const icon = app ? app.icon : '&#xE71D;';
                
                if (notificationService) {
                    return notificationService.notify({
                        ...options,
                        appId,
                        icon,
                        sourceProcessId: pid
                    });
                }
                return null;
            }
        };
    }
}
