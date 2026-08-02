import { BootLogger } from './BootLogger.js';
import { DriverManager } from '../DriverManager.js';
import { KernelResourceManager } from '../KernelResourceManager.js';
import { KernelDisplayAPI } from '../api/KernelDisplayAPI.js';
import { KernelStorageAPI } from '../api/KernelStorageAPI.js';
import { KernelNetworkAPI } from '../api/KernelNetworkAPI.js';
import { KernelAudioAPI } from '../api/KernelAudioAPI.js';
import { KernelInputAPI } from '../api/KernelInputAPI.js';

import { DriverRegistry } from '../DriverRegistry.js';

/**
 * DriverBootstrap
 * 
 * Layer: 1-kernel/boot
 * Responsibility:
 * Instantiates and binds kernel drivers against 0-firmware hardware devices,
 * initializes KernelResourceManager, and registers stable Kernel APIs.
 */
export class DriverBootstrap {
    static async run(ctx) {
        BootLogger.phase('DRIVERS');

        const driverRegistry = new DriverRegistry();
        const driverManager = new DriverManager(driverRegistry);
        await driverManager.initializeDrivers();

        const resourceManager = new KernelResourceManager(ctx.kernel);

        ctx.driverManager = driverManager;
        ctx.resourceManager = resourceManager;

        ctx.managers.set('DriverManager', driverManager);
        ctx.managers.set('KernelResourceManager', resourceManager);

        ctx.serviceRegistry.register('DriverManager', driverManager);
        ctx.serviceRegistry.register('DriverRegistry', driverManager.getRegistry());
        ctx.serviceRegistry.register('KernelResourceManager', resourceManager);

        // Register Kernel APIs
        ctx.serviceRegistry.register('KernelDisplayAPI', new KernelDisplayAPI(driverManager));
        ctx.serviceRegistry.register('KernelStorageAPI', new KernelStorageAPI(driverManager));
        ctx.serviceRegistry.register('KernelNetworkAPI', new KernelNetworkAPI(driverManager));
        ctx.serviceRegistry.register('KernelAudioAPI', new KernelAudioAPI(driverManager));
        ctx.serviceRegistry.register('KernelInputAPI', new KernelInputAPI(driverManager));

        BootLogger.success('Kernel Drivers & Kernel APIs initialized.');
    }
}
