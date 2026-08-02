import { ApplicationDatabaseService } from '../../../5-platform/packages/ApplicationDatabaseService.js';
import { ApplicationService } from '../../../5-platform/packages/ApplicationService.js';
import { AssociationService } from '../../../5-platform/packages/AssociationService.js';
import { RuntimeLoaderService } from '../../../5-platform/packages/RuntimeLoaderService.js';
import { PermissionService } from '../../../5-platform/packages/PermissionService.js';
import { TrustService } from '../../../5-platform/packages/TrustService.js';
import { PackageService } from '../../../5-platform/packages/PackageService.js';
import { PackageInstallOrchestrator } from '../../../5-platform/packages/PackageInstallOrchestrator.js';
import { RepositoryService } from '../../../5-platform/packages/RepositoryService.js';
import { ProcessService } from '../../../5-platform/process/ProcessService.js';
import { CommandService } from '../../../5-platform/ipc/CommandService.js';
import { PowerService } from '../../../5-platform/session/PowerService.js';
import { EventBus } from '../../SystemEventBus.js';

/**
 * ApplicationServices
 * 
 * Layer: 1-kernel/boot/services
 * Responsibility:
 * Instantiates application database, application lifecycle, package management,
 * runtime loaders, process service, and power management.
 */
export class ApplicationServices {
    static async run(ctx) {
        const appDbService = new ApplicationDatabaseService(ctx.appDbManager, ctx.serviceRegistry);
        ctx.serviceRegistry.register('ApplicationDatabaseService', appDbService);
        await appDbService.initialize();
        await appDbService.syncBuiltins(ctx.appRegistry.getBuiltinApplications());

        const appService = new ApplicationService(appDbService, ctx.serviceRegistry);
        ctx.serviceRegistry.register('ApplicationService', appService);
        ctx.serviceRegistry.register('AssociationService', new AssociationService(appService));

        const runtimeLoaderService = new RuntimeLoaderService(ctx.managers.get('RuntimeLoaderManager'));
        ctx.serviceRegistry.register('RuntimeLoaderService', runtimeLoaderService);

        const permissionService = new PermissionService(ctx.permissionManager, appService, ctx.serviceRegistry);
        ctx.serviceRegistry.register('PermissionService', permissionService);
        await permissionService.initialize();

        const trustService = new TrustService(ctx.trustManager, appService);
        ctx.serviceRegistry.register('TrustService', trustService);

        const fileService = ctx.serviceRegistry.get('FileService');
        const packageInstallOrchestrator = new PackageInstallOrchestrator(fileService, ctx.serviceRegistry);
        ctx.serviceRegistry.register('PackageInstallOrchestrator', packageInstallOrchestrator);

        const packageService = new PackageService(packageInstallOrchestrator);
        ctx.serviceRegistry.register('PackageService', packageService);

        const repositoryService = new RepositoryService(ctx.repositoryManager, ctx.serviceRegistry.get('NetworkService'));
        ctx.serviceRegistry.register('RepositoryService', repositoryService);

        const recoveryService = ctx.serviceRegistry.get('RecoveryService');
        if (!recoveryService.isSafeMode()) {
            repositoryService.refresh().catch(e => console.error('[Kernel] Failed initial repository refresh:', e));
            const themeService = ctx.serviceRegistry.get('ThemeService');
            if (themeService) {
                themeService.refreshAll().catch(e => console.error('[Kernel] Failed to refresh themes:', e));
            }
            ctx.extensionRepositoryManager.refresh();
        } else {
            EventBus.emit('kernel:safemode', { severity: 'Info', source: 'Kernel', message: 'Safe Mode active: Bypassing repository and theme sync.' });
        }

        ctx.serviceRegistry.register('ProcessService', new ProcessService(ctx.managers.get('ProcessManager'), appService, ctx.serviceRegistry, runtimeLoaderService));
        ctx.serviceRegistry.register('CommandService', new CommandService(ctx.serviceRegistry));
        ctx.serviceRegistry.register('PowerService', new PowerService(ctx.managers.get('ProcessManager'), ctx.managers.get('SessionManager'), ctx.serviceRegistry));
    }
}
