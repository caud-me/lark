import { NetworkService } from '../../../5-platform/network/NetworkService.js';
import { DownloadService } from '../../../5-platform/network/DownloadService.js';
import { LogService } from '../../../5-platform/logging/LogService.js';
import { WindowService } from '../../../5-platform/window/WindowService.js';
import { WorkspaceService } from '../../../5-platform/workspace/WorkspaceService.js';
import { DialogService } from '../../../5-platform/dialog/DialogService.js';
import { ContextMenuService } from '../../../5-platform/contextmenu/ContextMenuService.js';
import { ClipboardService } from '../../../5-platform/clipboard/ClipboardService.js';
import { ShortcutService } from '../../../5-platform/shortcuts/ShortcutService.js';
import { SessionService } from '../../../5-platform/session/SessionService.js';
import { SecurityService } from '../../../5-platform/security/SecurityService.js';
import { SecurityPolicy } from '../../../4-policies/SecurityPolicy.js';
import { ErrorService } from '../../../5-platform/logging/ErrorService.js';
import { SystemInformationService } from '../../../5-platform/info/SystemInformationService.js';
import { BootLogger } from '../BootLogger.js';

/**
 * CoreServices
 * 
 * Layer: 1-kernel/boot/services
 * Responsibility:
 * Instantiates core infrastructure services: networking, logging, windowing, workspace, input, session, and security.
 */
export class CoreServices {
    static async run(ctx) {
        ctx.serviceRegistry.register('ErrorService', new ErrorService(ctx.serviceRegistry));
        ctx.serviceRegistry.register('SystemInformationService', new SystemInformationService(ctx.serviceRegistry));
        ctx.serviceRegistry.register('EnvironmentManager', ctx.managers.get('EnvironmentManager'));

        const networkService = new NetworkService(ctx.managers.get('NetworkManager'), ctx.serviceRegistry);
        ctx.serviceRegistry.register('NetworkService', networkService);

        const downloadService = new DownloadService(networkService);
        ctx.serviceRegistry.register('DownloadService', downloadService);

        const logService = new LogService(ctx.managers.get('LogManager'));
        ctx.serviceRegistry.register('LogService', logService);
        BootLogger.flush(logService);

        const workspaceService = new WorkspaceService(ctx.managers.get('WorkspaceManager'));
        ctx.serviceRegistry.register('WorkspaceService', workspaceService);

        // Wire service registry into WindowManager
        const windowManager = ctx.managers.get('WindowManager');
        if (windowManager) {
            windowManager.registry = ctx.serviceRegistry;
        }
        ctx.serviceRegistry.register('WindowService', new WindowService(windowManager, ctx.serviceRegistry));

        // Wire service registry into DialogManager
        const dialogManager = ctx.managers.get('DialogManager');
        if (dialogManager) {
            dialogManager.registry = ctx.serviceRegistry;
        }
        ctx.serviceRegistry.register('DialogService', new DialogService(dialogManager));
        ctx.serviceRegistry.register('ContextMenuService', new ContextMenuService(ctx.managers.get('ContextMenuManager'), ctx.serviceRegistry));
        ctx.serviceRegistry.register('ClipboardService', new ClipboardService(ctx.managers.get('ClipboardManager'), ctx.serviceRegistry));
        ctx.serviceRegistry.register('ShortcutService', new ShortcutService(ctx.managers.get('ShortcutManager'), ctx.serviceRegistry));
        ctx.serviceRegistry.register('SessionService', new SessionService(ctx.managers.get('SessionManager'), ctx.managers.get('UserManager'), ctx.serviceRegistry));

        const securityService = new SecurityService(ctx.managers.get('SecurityManager'), ctx.managers.get('ProcessManager'), ctx.managers.get('SessionManager'));
        ctx.serviceRegistry.register('SecurityService', securityService);

        const securityPolicy = new SecurityPolicy(securityService);
        ctx.serviceRegistry.register('SecurityPolicy', securityPolicy);
    }
}
