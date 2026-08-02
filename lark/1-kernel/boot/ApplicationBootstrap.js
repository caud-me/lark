/**
 * ApplicationBootstrap
 * 
 * Layer: 1-kernel/boot
 * Responsibility:
 * Hands off execution to BootOrchestrator to launch desktop applications.
 */
export class ApplicationBootstrap {
    static async run(ctx) {
        const bootService = ctx.serviceRegistry.get('BootOrchestrator');
        if (bootService) {
            await bootService.start();
        } else {
            throw new Error('[Kernel] BootOrchestrator not found.');
        }
    }
}
