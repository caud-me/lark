import { coreKernel } from '../1-kernel/kernel.js';
import { BootSplash } from '../5-platform/boot/BootSplash.js';
import { HardwareRegistry } from './HardwareRegistry.js';

/**
 * BootLoader
 *
 * Layer: 0-firmware
 * Responsibility:
 * Browser entry point. Executes POST (Power-On Self-Test) virtual hardware probe via HardwareRegistry,
 * mounts early BootSplash, and hands off execution to Kernel.
 *
 * Does NOT:
 * - Initialize system services or managers directly (Kernel owns this)
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Firmware:BootLoader] DOM loaded. Running POST...');
    
    // 1. Run Firmware POST & Hardware Enumeration
    const postReport = HardwareRegistry.probeAll();
    if (!postReport.passed) {
        console.error('[Firmware:BootLoader] POST Failed. Aborting kernel boot.');
        return;
    }

    console.log('[Firmware:BootLoader] POST Passed. Handing off to Kernel...');
    
    // 2. Initialize visual boot observer surface
    const bootSplash = new BootSplash();
    bootSplash.mount();

    // 3. Bootstrap OS Kernel
    coreKernel.bootstrap().catch(err => {
        console.error('[Firmware:BootLoader] Fatal exception caught outside Kernel:', err);
    });
});
