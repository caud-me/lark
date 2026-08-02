import { BootLogger } from './BootLogger.js';
import { NetworkManager } from '../../5-platform/network/NetworkManager.js';
import { LogManager } from '../../5-platform/logging/LogManager.js';
import { WindowManager } from '../../5-platform/window/WindowManager.js';
import { ProcessManager } from '../../5-platform/process/ProcessManager.js';
import { SettingsManager } from '../../5-platform/settings/SettingsManager.js';
import { UserManager } from '../../5-platform/users/UserManager.js';
import { UserProfileManager } from '../../5-platform/users/UserProfileManager.js';
import { TrustManager } from '../../5-platform/packages/TrustManager.js';
import { DiskManager } from '../../5-platform/filesystem/DiskManager.js';
import { ApplicationDatabaseManager } from '../../5-platform/packages/ApplicationDatabaseManager.js';
import { RuntimeLoaderManager } from '../../5-platform/packages/RuntimeLoaderManager.js';
import { BuiltinRuntimeLoader } from '../../5-platform/packages/loaders/BuiltinRuntimeLoader.js';
import { LrfsRuntimeLoader } from '../../5-platform/packages/loaders/LrfsRuntimeLoader.js';
import { RepositoryManager } from '../../5-platform/packages/RepositoryManager.js';
import { SessionManager } from '../../5-platform/session/SessionManager.js';
import { BuiltinRepositorySource } from '../../5-platform/packages/repositories/sources/BuiltinRepositorySource.js';
import { PermissionManager } from '../../5-platform/packages/PermissionManager.js';
import { SecurityManager } from '../../5-platform/security/SecurityManager.js';
import { RecoveryManager } from '../../5-platform/recovery/RecoveryManager.js';
import { RestoreManager } from '../../5-platform/recovery/RestoreManager.js';
import { AppRegistry } from '../AppRegistry.js';
import { IPCManager } from '../../5-platform/ipc/IPCManager.js';
import { NotificationManager } from '../../5-platform/notifications/NotificationManager.js';
import { DialogManager } from '../../5-platform/dialog/DialogManager.js';
import { ContextMenuManager } from '../../5-platform/contextmenu/ContextMenuManager.js';
import { ClipboardManager } from '../../5-platform/clipboard/ClipboardManager.js';
import { ShortcutManager } from '../../5-platform/shortcuts/ShortcutManager.js';
import { ThemeRepositoryManager } from '../../5-platform/theming/ThemeRepositoryManager.js';
import { UserSettingsManager } from '../../5-platform/users/UserSettingsManager.js';
import { BuiltinThemeSource } from '../../5-platform/theming/themes/BuiltinThemeSource.js';
import { WidgetManager } from '../../5-platform/widgets/WidgetManager.js';
import { ExtensionRepositoryManager } from '../../5-platform/extensions/ExtensionRepositoryManager.js';
import { EnvironmentManager } from '../../5-platform/environments/EnvironmentManager.js';
import { WorkspaceManager } from '../../5-platform/workspace/WorkspaceManager.js';
import { GuardianHistoryManager } from '../../5-platform/guardian/GuardianHistoryManager.js';

/**
 * ManagerBootstrap
 * 
 * Layer: 1-kernel/boot
 * Responsibility:
 * Instantiates all headless domain state managers and populates the kernel bootstrap context.
 */
export class ManagerBootstrap {
    static async run(ctx) {
        ctx.managers.set('LogManager', new LogManager());
        
        const networkManager = new NetworkManager();
        ctx.managers.set('NetworkManager', networkManager);
        ctx.managers.set('WindowManager', new WindowManager());
        ctx.managers.set('WorkspaceManager', new WorkspaceManager());
        ctx.managers.set('DialogManager', new DialogManager());
        ctx.managers.set('EnvironmentManager', new EnvironmentManager());
        ctx.managers.set('ContextMenuManager', new ContextMenuManager());
        ctx.managers.set('ClipboardManager', new ClipboardManager());
        ctx.managers.set('ShortcutManager', new ShortcutManager());
        ctx.managers.set('ProcessManager', new ProcessManager());
        ctx.managers.set('IPCManager', new IPCManager());
        ctx.managers.set('NotificationManager', new NotificationManager());
        ctx.managers.set('SettingsManager', new SettingsManager());

        const themeRepositoryManager = new ThemeRepositoryManager();
        themeRepositoryManager.registerSource('builtin', new BuiltinThemeSource());
        ctx.managers.set('ThemeRepositoryManager', themeRepositoryManager);

        const widgetManager = new WidgetManager();
        ctx.managers.set('WidgetManager', widgetManager);

        const sessionManager = new SessionManager();
        sessionManager.startSystemSession();
        ctx.managers.set('SessionManager', sessionManager);

        ctx.managers.set('DiskManager', new DiskManager());

        ctx.permissionManager = new PermissionManager();
        ctx.managers.set('PermissionManager', ctx.permissionManager);

        ctx.userManager = new UserManager();
        ctx.managers.set('UserManager', ctx.userManager);

        ctx.userProfileManager = new UserProfileManager();
        ctx.managers.set('UserProfileManager', ctx.userProfileManager);

        ctx.userSettingsManager = new UserSettingsManager();
        ctx.managers.set('UserSettingsManager', ctx.userSettingsManager);

        ctx.securityManager = new SecurityManager();
        ctx.managers.set('SecurityManager', ctx.securityManager);

        ctx.trustManager = new TrustManager();
        ctx.managers.set('TrustManager', ctx.trustManager);

        ctx.recoveryManager = new RecoveryManager();
        ctx.managers.set('RecoveryManager', ctx.recoveryManager);

        ctx.restoreManager = new RestoreManager();
        ctx.managers.set('RestoreManager', ctx.restoreManager);

        ctx.managers.set('GuardianHistoryManager', new GuardianHistoryManager());

        ctx.appDbManager = new ApplicationDatabaseManager();
        ctx.managers.set('ApplicationDatabaseManager', ctx.appDbManager);

        ctx.extensionRepositoryManager = new ExtensionRepositoryManager(ctx.appDbManager);
        ctx.managers.set('ExtensionRepositoryManager', ctx.extensionRepositoryManager);

        ctx.repositoryManager = new RepositoryManager();
        ctx.repositoryManager.registerSource('builtin-official', new BuiltinRepositorySource(new URL('5-platform/packages/repositories/official.json', window.LDE_SOURCE_URL || window.LDE_BASE_URL).href));
        ctx.managers.set('RepositoryManager', ctx.repositoryManager);

        ctx.runtimeLoaderManager = new RuntimeLoaderManager();
        ctx.runtimeLoaderManager.registerLoader('builtin', new BuiltinRuntimeLoader());
        ctx.runtimeLoaderManager.registerLoader('lrfs', new LrfsRuntimeLoader(ctx.lrfs));
        ctx.managers.set('RuntimeLoaderManager', ctx.runtimeLoaderManager);

        ctx.appRegistry = new AppRegistry();
        BootLogger.success('State Managers initialized.');
    }
}
