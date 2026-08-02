import { KernelBootstrapContext } from './KernelBootstrapContext.js';
import { DriverBootstrap } from './boot/DriverBootstrap.js';
import { StorageBootstrap } from './boot/StorageBootstrap.js';
import { ManagerBootstrap } from './boot/ManagerBootstrap.js';
import { ServiceBootstrap } from './boot/ServiceBootstrap.js';
import { ApplicationBootstrap } from './boot/ApplicationBootstrap.js';
import { PanicHandler } from './PanicHandler.js';
import { BootLogger } from './boot/BootLogger.js';

/**
 * Kernel
 * 
 * Layer: 1-kernel
 * Responsibility:
 * The OS root orchestrator process. Coordinates boot stages by executing dedicated
 * stage registrars under 1-kernel/boot/.
 * 
 * Does NOT:
 * - Direct manager construction, service registration, or driver initialization
 */
class Kernel {
    constructor() {
        this.state = 'UNINITIALIZED';
        this.managers = new Map();
    }

    /**
     * Initialize the Kernel and bootstrap the OS.
     */
    async bootstrap() {
        this.state = 'BOOTING';
        BootLogger.phase('KERNEL');
        BootLogger.success('Beginning bootstrap sequence...');

        const ctx = new KernelBootstrapContext(this);
        this.managers = ctx.managers;

        const bootStages = [
            { id: 'drivers', name: 'Kernel Drivers', run: () => DriverBootstrap.run(ctx) },
            { id: 'storage', name: 'Storage subsystem', run: () => StorageBootstrap.run(ctx) },
            { id: 'managers', name: 'State Managers', run: () => ManagerBootstrap.run(ctx) },
            { id: 'services', name: 'System Services', run: () => ServiceBootstrap.run(ctx) },
            { id: 'applications', name: 'Application Startup', run: () => ApplicationBootstrap.run(ctx) }
        ];

        try {
            for (const stage of bootStages) {
                const stageStart = performance.now();
                await stage.run();
                const duration = (performance.now() - stageStart).toFixed(2);
                if (ctx.resourceManager) {
                    ctx.resourceManager.recordBootStage(stage.id, stage.name, duration);
                }
            }

            this.driverManager = ctx.driverManager;
            this.resourceManager = ctx.resourceManager;
            this.lrfs = ctx.lrfs;

            this.state = 'RUNNING';
            BootLogger.deactivate();
        } catch (error) {
            this.state = 'PANIC';
            this.panic(error);
        }
    }

    /**
     * Delegates panic screen rendering to PanicHandler.
     */
    panic(error) {
        PanicHandler.render(error);
    }
}

export const coreKernel = new Kernel();
