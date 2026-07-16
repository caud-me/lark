import { EventBus } from '../../kernel/SystemEventBus.js';
import { LogCategory } from '../../system/LogCategory.js';
import { LogSeverity } from '../../system/LogSeverity.js';

/**
 * ShutdownService
 * 
 * Responsibility:
 * Orchestrates the cleanup, session closure, and service termination
 * for a system-wide halt transition.
 */
export class ShutdownService {
    constructor(registry) {
        this.registry = registry;
        this.isShutdownRunning = false;
    }

    emitPhase(message, progress) {
        EventBus.emit('shutdown.phase', {
            category: LogCategory.BOOT,
            severity: LogSeverity.INFO,
            source: 'ShutdownService',
            message,
            progress
        });
    }

    /**
     * Executes the system shutdown lifecycle.
     */
    async execute() {
        if (this.isShutdownRunning) return;
        this.isShutdownRunning = true;

        EventBus.emit('shutdown.started', {
            category: LogCategory.BOOT,
            severity: LogSeverity.WARNING,
            source: 'ShutdownService',
            message: 'System shutdown sequence initiated.'
        });

        // 1. Terminate all applications
        this.emitPhase('Stopping applications', 25);
        const processService = this.registry.get('ProcessService');
        if (processService) {
            processService.shutdownAll();
        }
        EventBus.emit('shutdown.processes_terminated', {
            category: LogCategory.APPLICATION,
            severity: LogSeverity.INFO,
            source: 'ShutdownService',
            message: 'All running processes terminated.'
        });

        // 2. Destroy Desktop Environments
        this.emitPhase('Destroying desktop environments', 50);
        const desktopEnvService = this.registry.get('DesktopEnvironmentService');
        const sessionService = this.registry.get('SessionService');
        if (desktopEnvService && sessionService) {
            const sessions = sessionService.getSessions();
            for (const sess of sessions) {
                await desktopEnvService.destroy(sess.id);
            }
        }
        EventBus.emit('shutdown.desktop_destroyed', {
            category: LogCategory.ENVIRONMENT,
            severity: LogSeverity.INFO,
            source: 'ShutdownService',
            message: 'All desktop environment instances destroyed.'
        });

        // 3. End sessions
        this.emitPhase('Ending sessions', 75);
        if (sessionService) {
            const sessions = [...sessionService.getSessions()];
            for (const sess of sessions) {
                sessionService.logout(sess.id);
            }
        }
        EventBus.emit('shutdown.sessions_ended', {
            category: LogCategory.SESSION,
            severity: LogSeverity.INFO,
            source: 'ShutdownService',
            message: 'All active user sessions ended.'
        });

        // 4. Halt and dispose platform services (excluding critical logger/boot services)
        this.emitPhase('Stopping services', 90);
        const excludedServices = ['ShutdownService', 'BootService', 'LogService', 'ErrorService'];
        const services = this.registry.getAll();
        for (const [name, service] of services.entries()) {
            if (excludedServices.includes(name)) continue;
            
            // Check opt-in property or lifecycle methods
            if (typeof service.shutdown === 'function') {
                try {
                    await service.shutdown();
                } catch (e) {
                    console.error(`[ShutdownService] Error calling shutdown() on ${name}:`, e);
                }
            }
            if (typeof service.dispose === 'function') {
                try {
                    await service.dispose();
                } catch (e) {
                    console.error(`[ShutdownService] Error calling dispose() on ${name}:`, e);
                }
            }
        }
        
        EventBus.emit('shutdown.services_stopped', {
            category: LogCategory.SERVICE,
            severity: LogSeverity.INFO,
            source: 'ShutdownService',
            message: 'Platform services halted.'
        });

        EventBus.emit('shutdown.completed', {
            category: LogCategory.BOOT,
            severity: LogSeverity.SUCCESS,
            source: 'ShutdownService',
            message: 'System shutdown sequence completed successfully.'
        });
    }
}
export default ShutdownService;
