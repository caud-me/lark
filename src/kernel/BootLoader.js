import { coreKernel } from './kernel.js';

/**
 * BootLoader
 *
 * Responsibility:
 * Entry point for the browser. Instantiates the kernel and starts the bootstrap sequence.
 *
 * Does NOT:
 * - Initialize services or managers
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Bootloader] DOM loaded. Handing off to Kernel...');
    coreKernel.bootstrap().catch(err => {
        console.error('[Bootloader] Fatal exception caught outside Kernel:', err);
    });
});
