import { UserService } from '../../../5-platform/users/UserService.js';
import { UserProfileService } from '../../../5-platform/users/UserProfileService.js';
import { UserSettingsService } from '../../../5-platform/users/UserSettingsService.js';
import { UserEnvironmentOrchestrator } from '../../../5-platform/session/UserEnvironmentOrchestrator.js';
import { BootOrchestrator } from '../../../5-platform/boot/BootOrchestrator.js';

/**
 * UserServices
 * 
 * Layer: 1-kernel/boot/services
 * Responsibility:
 * Instantiates user account management, user profile, user environment, and boot orchestrator services.
 */
export class UserServices {
    static async run(ctx) {
        const userService = new UserService(ctx.managers.get('UserManager'), ctx.serviceRegistry);
        ctx.serviceRegistry.register('UserService', userService);

        const userProfileService = new UserProfileService(ctx.managers.get('UserProfileManager'), ctx.serviceRegistry);
        ctx.serviceRegistry.register('UserProfileService', userProfileService);

        const userSettingsService = new UserSettingsService(ctx.managers.get('UserSettingsManager'), ctx.serviceRegistry);
        ctx.serviceRegistry.register('UserSettingsService', userSettingsService);

        const userEnvironmentService = new UserEnvironmentOrchestrator(ctx.serviceRegistry);
        ctx.serviceRegistry.register('UserEnvironmentOrchestrator', userEnvironmentService);

        const bootService = new BootOrchestrator(ctx.serviceRegistry);
        ctx.serviceRegistry.register('BootOrchestrator', bootService);
        ctx.serviceRegistry.register('BootService', bootService);
    }
}
