import { FileService } from '../../../5-platform/filesystem/FileService.js';
import { SettingsService } from '../../../5-platform/settings/SettingsService.js';
import { DiskService } from '../../../5-platform/filesystem/DiskService.js';
import { ThemeService } from '../../../5-platform/theming/ThemeService.js';
import { ExtensionService } from '../../../5-platform/extensions/ExtensionService.js';
import { WidgetService } from '../../../5-platform/widgets/WidgetService.js';
import { IPCService } from '../../../5-platform/ipc/IPCService.js';
import { NotificationService } from '../../../5-platform/notifications/NotificationService.js';
import { ApplicationIntentService } from '../../../5-platform/packages/ApplicationIntentService.js';
import { DeveloperOptionsService } from '../../../8-developer/DeveloperOptionsService.js';
import { RecoveryPolicy } from '../../../4-policies/RecoveryPolicy.js';
import { RestorePolicy } from '../../../4-policies/RestorePolicy.js';
import { RecoveryService } from '../../../5-platform/recovery/RecoveryService.js';
import { RestoreService } from '../../../5-platform/recovery/RestoreService.js';
import { StorageDiscoveryService } from '../../../5-platform/storage/StorageDiscoveryService.js';
import { VirtualDiskService } from '../../../5-platform/storage/VirtualDiskService.js';
import { GuardianService } from '../../../5-platform/guardian/GuardianService.js';
import { BrowserStorageService } from '../../../5-platform/browser/BrowserStorageService.js';

/**
 * FilesystemServices
 * 
 * Layer: 1-kernel/boot/services
 * Responsibility:
 * Instantiates filesystem, settings, disk, theming, extension, widget, IPC, notification, and recovery services.
 */
export class FilesystemServices {
    static async run(ctx) {
        ctx.serviceRegistry.register('FileService', new FileService(ctx.lrfs, ctx.serviceRegistry));
        ctx.serviceRegistry.register('BrowserStorageService', BrowserStorageService);

        const settingsService = new SettingsService(ctx.managers.get('SettingsManager'), ctx.serviceRegistry);
        ctx.serviceRegistry.register('SettingsService', settingsService);
        await settingsService.initialize();

        ctx.serviceRegistry.register('StorageDiscoveryService', new StorageDiscoveryService(ctx.serviceRegistry));
        ctx.serviceRegistry.register('VirtualDiskService', new VirtualDiskService(ctx.serviceRegistry));

        const diskService = new DiskService(ctx.managers.get('DiskManager'), ctx.lrfs);
        ctx.serviceRegistry.register('DiskService', diskService);
        diskService.initialize();

        const themeService = new ThemeService(ctx.managers.get('ThemeRepositoryManager'), ctx.serviceRegistry);
        ctx.serviceRegistry.register('ThemeService', themeService);

        const extensionService = new ExtensionService(ctx.managers.get('ExtensionRepositoryManager'));
        ctx.serviceRegistry.register('ExtensionService', extensionService);

        const widgetService = new WidgetService(ctx.managers.get('WidgetManager'), extensionService, ctx.serviceRegistry);
        ctx.serviceRegistry.register('WidgetService', widgetService);

        ctx.serviceRegistry.register('IPCService', new IPCService(ctx.managers.get('IPCManager'), ctx.serviceRegistry));
        ctx.serviceRegistry.register('NotificationService', new NotificationService(ctx.managers.get('NotificationManager'), ctx.serviceRegistry));
        ctx.serviceRegistry.register('ApplicationIntentService', new ApplicationIntentService(ctx.serviceRegistry));

        const devOptionsService = new DeveloperOptionsService(ctx.managers.get('SettingsManager'));
        ctx.serviceRegistry.register('DeveloperOptionsService', devOptionsService);
        devOptionsService.initialize();

        const recoveryPolicy = new RecoveryPolicy(ctx.serviceRegistry.get('SecurityService'));
        ctx.serviceRegistry.register('RecoveryPolicy', recoveryPolicy);

        const restorePolicy = new RestorePolicy(ctx.serviceRegistry.get('SecurityService'));
        ctx.serviceRegistry.register('RestorePolicy', restorePolicy);

        const recoveryService = new RecoveryService(ctx.managers.get('RecoveryManager'), ctx.serviceRegistry);
        ctx.serviceRegistry.register('RecoveryService', recoveryService);

        const restoreService = new RestoreService(ctx.managers.get('RestoreManager'), restorePolicy, ctx.serviceRegistry);
        ctx.serviceRegistry.register('RestoreService', restoreService);

        const guardianService = new GuardianService(ctx.managers.get('GuardianHistoryManager'), ctx.serviceRegistry);
        ctx.serviceRegistry.register('GuardianService', guardianService);
        await guardianService.initialize();
    }
}
