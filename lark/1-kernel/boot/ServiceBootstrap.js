import { BootLogger } from './BootLogger.js';
import { CoreServices } from './services/CoreServices.js';
import { UserServices } from './services/UserServices.js';
import { FilesystemServices } from './services/FilesystemServices.js';
import { ApplicationServices } from './services/ApplicationServices.js';
import { DesktopServices } from './services/DesktopServices.js';
import { CapabilityServices } from './services/CapabilityServices.js';

/**
 * ServiceBootstrap
 * 
 * Layer: 1-kernel/boot
 * Responsibility:
 * Main Service Registrar. Delegates internal service instantiation to category-specific
 * helper delegates under 1-kernel/boot/services/.
 */
export class ServiceBootstrap {
    static async run(ctx) {
        BootLogger.phase('PLATFORM');

        await CoreServices.run(ctx);
        await UserServices.run(ctx);
        await FilesystemServices.run(ctx);
        await ApplicationServices.run(ctx);
        await DesktopServices.run(ctx);
        await CapabilityServices.run(ctx);

        // Load users from disk once FileService is available
        const userService = ctx.serviceRegistry.get('UserService');
        if (userService) {
            userService.loadUsersFromDisk();
        }

        BootLogger.success('Platform Services registered.');
    }
}
