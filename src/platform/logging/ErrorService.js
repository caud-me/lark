import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * ErrorService
 *
 * Responsibility:
 * Captures, formats, and reports global application and system errors.
 *
 * Does NOT:
 * - Handle kernel panics or hardware failures
 */
export class ErrorService {
    constructor(serviceRegistry) {
        this.registry = serviceRegistry;
        
        window.addEventListener('error', (e) => {
            this.reportError(e.error || e.message, 'Global Error');
        });

        window.addEventListener('unhandledrejection', (e) => {
            this.reportError(e.reason, 'Unhandled Promise');
        });
    }

    reportError(error, source = 'System', pid = null) {
        let appName = source;
        const processService = this.registry.get('ProcessService');
        if (processService && pid) {
            const proc = processService.getProcess(pid);
            if (proc) {
                const appService = this.registry.get('ApplicationService');
                const app = appService ? appService.getAppById(proc.appId) : null;
                if (app) appName = app.title || app.name;
            }
        }

        const msg = error instanceof Error ? (error.stack || error.message) : String(error);
        
        // LogService captures all EventBus events via its wildcard listener.
        // Emitting here is the correct way to log — do NOT call logService.log().
        EventBus.emit('error.reported', {
            severity: 'Error',
            source,
            message: msg
        });
        console.error(`[${source}]`, error);

        const dialogService = this.registry.get('DialogService');
        if (dialogService && pid) {
            dialogService.alert(`The application '${appName}' has encountered an error and may not function correctly.\n\n${msg.split('\n')[0]}`, 'Application Error');
        }
    }
}
