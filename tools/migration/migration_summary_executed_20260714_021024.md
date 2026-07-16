# LDE Migration Summary

**Mode:** Executed  
**Date:** 2026-07-14T02:10:24.541466  
**Tool:** v2.0  
**Python:** 3.12.0  
**Repository:** `C:\Users\ar\Documents\GitHub\lark-desktop-environment - experimental`  

---

## Results

| Metric | Value |
|---|---|
| Files moved | 129 |
| Imports rewritten | 284 |
| Files rewritten | 70 |
| Directories removed | 18 |
| Verification | **PASSED** |
| Warnings | 1 |
| Errors | 0 |
| Duration | 2.30s |

## Import Coverage

| | Count |
|---|---|
| Scanned | 524 |
| Updated | 284 |
| Skipped | 240 |
| Unknown syntax | 28 |

## Unknown Import Syntax

- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/system/environments/platform/PlatformEnvironmentRegistry.js:6: { id: 'sys.shutdown', type: 'platform-environment', entryPoint: '../system/environments/platform/Shutdown.js' },`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/services/PowerService.js:161: const { ShutdownPlatformEnvironment } = await import('./BootService.js');`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/kernel/kernel.js:187: this.repositoryManager.registerSource('builtin-official', new BuiltinRepositorySource('../src/system/repositories/official.json'));`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/system/environments/platform/PlatformEnvironmentRegistry.js:8: { id: 'sys.oobe', type: 'platform-environment', entryPoint: '../system/environments/platform/OOBE.js' },`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/kernel/AppRegistry.js:157: entryPoint: '../services/providers/PackageSearchProvider.js'`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/system/widgets/WidgetRegistry.js:29: entryPoint: '../../widgets/WeatherWidget.js',`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/system/environments/platform/PlatformEnvironmentRegistry.js:4: { id: 'sys.login', type: 'platform-environment', entryPoint: '../system/environments/platform/Login.js' },`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/system/environments/platform/PlatformEnvironmentRegistry.js:9: { id: 'sys.welcome', type: 'platform-environment', entryPoint: '../system/environments/platform/Welcome.js' }`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/sdk/index.js:1: export { ManifestBuilder } from './builders/ManifestBuilder.js';`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/kernel/AppRegistry.js:144: entryPoint: '../apps/system/SoftwareCenter.js',`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/system/widgets/WidgetRegistry.js:21: entryPoint: '../../widgets/CalendarWidget.js',`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/system/widgets/WidgetRegistry.js:37: entryPoint: '../../widgets/NotesWidget.js',`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/system/environments/platform/PlatformEnvironmentRegistry.js:7: { id: 'sys.recovery', type: 'platform-environment', entryPoint: '../system/environments/platform/Recovery.js' },`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/system/loaders/BuiltinRuntimeLoader.js:17: entryPoint = entryPoint.replace('../apps/', '../../apps/');`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/kernel/AppRegistry.js:113: entryPoint: '../apps/system/FileManager.js',`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/kernel/AppRegistry.js:65: entryPoint: '../apps/system/Terminal.js',`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/developer/quality/test-health.js:14: const kernelPath = '../kernel/kernel.js';`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/kernel/AppRegistry.js:126: entryPoint: '../services/providers/FileSearchProvider.js'`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/system/environments/platform/PlatformEnvironmentRegistry.js:5: { id: 'sys.lock', type: 'platform-environment', entryPoint: '../system/environments/platform/Lock.js' },`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/services/UserEnvironmentService.js:56: const { WelcomePlatformEnvironment } = await import('./BootService.js');`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/system/environments/desktop/DesktopEnvironmentRegistry.js:8: entryPoint: '../system/environments/desktop/Desktop.js'`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/kernel/AppRegistry.js:47: entryPoint: '../apps/system/TaskManager.js',`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/system/widgets/WidgetRegistry.js:13: entryPoint: '../../widgets/ClockWidget.js',`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/kernel/AppRegistry.js:95: entryPoint: '../apps/system/Settings.js',`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/developer/quality/test-health.js:13: const windowManagerPath = '../managers/WindowManager.js';`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/kernel/AppRegistry.js:83: entryPoint: '../services/providers/CommandSearchProvider.js'`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/system/loaders/BuiltinRuntimeLoader.js:16: if (entryPoint.startsWith('../apps/')) {`
- `C:/Users/ar/Documents/GitHub/lark-desktop-environment - experimental/src/kernel/AppRegistry.js:29: entryPoint: '../apps/system/EventViewer.js',`

## Verification Checks

### All destinations present — PASS
Checked: 129

### No duplicate destinations — PASS
Checked: 129

### All sources have destinations — PASS
Checked: 129

### No stale imports — PASS
Checked: 197

### All import targets exist — PASS
Checked: 197

## Warnings

- 29 unhandled relative path(s) found (see report)

## Files Moved

- `src/managers/EnvironmentManager.js` -> `src/platform/environments/EnvironmentManager.js`
- `src/managers/WindowManager.js` -> `src/platform/window/WindowManager.js`
- `src/managers/DialogManager.js` -> `src/platform/dialog/DialogManager.js`
- `src/managers/ContextMenuManager.js` -> `src/platform/contextmenu/ContextMenuManager.js`
- `src/managers/ClipboardManager.js` -> `src/platform/clipboard/ClipboardManager.js`
- `src/managers/ShortcutManager.js` -> `src/platform/shortcuts/ShortcutManager.js`
- `src/managers/ProcessManager.js` -> `src/platform/process/ProcessManager.js`
- `src/managers/SessionManager.js` -> `src/platform/session/SessionManager.js`
- `src/managers/SecurityManager.js` -> `src/platform/security/SecurityManager.js`
- `src/managers/UserManager.js` -> `src/platform/users/UserManager.js`
- `src/managers/UserProfileManager.js` -> `src/platform/users/UserProfileManager.js`
- `src/managers/UserSettingsManager.js` -> `src/platform/users/UserSettingsManager.js`
- `src/managers/LogManager.js` -> `src/platform/logging/LogManager.js`
- `src/managers/NetworkManager.js` -> `src/platform/network/NetworkManager.js`
- `src/managers/SettingsManager.js` -> `src/platform/settings/SettingsManager.js`
- `src/managers/DiskManager.js` -> `src/platform/filesystem/DiskManager.js`
- `src/managers/ApplicationDatabaseManager.js` -> `src/platform/packages/ApplicationDatabaseManager.js`
- `src/managers/RuntimeLoaderManager.js` -> `src/platform/packages/RuntimeLoaderManager.js`
- `src/managers/RepositoryManager.js` -> `src/platform/packages/RepositoryManager.js`
- `src/managers/PermissionManager.js` -> `src/platform/packages/PermissionManager.js`
- `src/managers/TrustManager.js` -> `src/platform/packages/TrustManager.js`
- `src/managers/ThemeRepositoryManager.js` -> `src/platform/theming/ThemeRepositoryManager.js`
- `src/managers/WidgetManager.js` -> `src/platform/widgets/WidgetManager.js`
- `src/managers/ExtensionRepositoryManager.js` -> `src/platform/extensions/ExtensionRepositoryManager.js`
- `src/managers/IPCManager.js` -> `src/platform/ipc/IPCManager.js`
- `src/managers/NotificationManager.js` -> `src/platform/notifications/NotificationManager.js`
- `src/managers/RecoveryManager.js` -> `src/platform/recovery/RecoveryManager.js`
- `src/managers/RestoreManager.js` -> `src/platform/recovery/RestoreManager.js`
- `src/services/ErrorService.js` -> `src/platform/logging/ErrorService.js`
- `src/services/LogService.js` -> `src/platform/logging/LogService.js`
- `src/services/NetworkService.js` -> `src/platform/network/NetworkService.js`
- `src/services/DownloadService.js` -> `src/platform/network/DownloadService.js`
- `src/services/WindowService.js` -> `src/platform/window/WindowService.js`
- `src/services/DialogService.js` -> `src/platform/dialog/DialogService.js`
- `src/services/ContextMenuService.js` -> `src/platform/contextmenu/ContextMenuService.js`
- `src/services/ClipboardService.js` -> `src/platform/clipboard/ClipboardService.js`
- `src/services/ShortcutService.js` -> `src/platform/shortcuts/ShortcutService.js`
- `src/services/SessionService.js` -> `src/platform/session/SessionService.js`
- `src/services/UserEnvironmentService.js` -> `src/platform/session/UserEnvironmentService.js`
- `src/services/PowerService.js` -> `src/platform/session/PowerService.js`
- `src/services/SecurityService.js` -> `src/platform/security/SecurityService.js`
- `src/services/UserService.js` -> `src/platform/users/UserService.js`
- `src/services/UserProfileService.js` -> `src/platform/users/UserProfileService.js`
- `src/services/UserSettingsService.js` -> `src/platform/users/UserSettingsService.js`
- `src/services/BootService.js` -> `src/platform/boot/BootService.js`
- `src/services/ShutdownService.js` -> `src/platform/boot/ShutdownService.js`
- `src/services/FileService.js` -> `src/platform/filesystem/FileService.js`
- `src/services/DiskService.js` -> `src/platform/filesystem/DiskService.js`
- `src/services/SettingsService.js` -> `src/platform/settings/SettingsService.js`
- `src/services/ThemeService.js` -> `src/platform/theming/ThemeService.js`
- `src/services/ExtensionService.js` -> `src/platform/extensions/ExtensionService.js`
- `src/services/WidgetService.js` -> `src/platform/widgets/WidgetService.js`
- `src/services/IPCService.js` -> `src/platform/ipc/IPCService.js`
- `src/services/CommandService.js` -> `src/platform/ipc/CommandService.js`
- `src/services/NotificationService.js` -> `src/platform/notifications/NotificationService.js`
- `src/services/ApplicationDatabaseService.js` -> `src/platform/packages/ApplicationDatabaseService.js`
- `src/services/ApplicationService.js` -> `src/platform/packages/ApplicationService.js`
- `src/services/ApplicationIntentService.js` -> `src/platform/packages/ApplicationIntentService.js`
- `src/services/AssociationService.js` -> `src/platform/packages/AssociationService.js`
- `src/services/RuntimeLoaderService.js` -> `src/platform/packages/RuntimeLoaderService.js`
- `src/services/PackageService.js` -> `src/platform/packages/PackageService.js`
- `src/services/RepositoryService.js` -> `src/platform/packages/RepositoryService.js`
- `src/services/PermissionService.js` -> `src/platform/packages/PermissionService.js`
- `src/services/TrustService.js` -> `src/platform/packages/TrustService.js`
- `src/services/RecoveryService.js` -> `src/platform/recovery/RecoveryService.js`
- `src/services/RestoreService.js` -> `src/platform/recovery/RestoreService.js`
- `src/services/SearchService.js` -> `src/platform/search/SearchService.js`
- `src/services/CapabilityService.js` -> `src/platform/capabilities/CapabilityService.js`
- `src/services/DesktopEnvironmentService.js` -> `src/platform/desktop/DesktopEnvironmentService.js`
- `src/services/StartupApplicationService.js` -> `src/platform/desktop/StartupApplicationService.js`
- `src/services/DeveloperOptionsService.js` -> `src/developer/DeveloperOptionsService.js`
- `src/services/providers/ApplicationSearchProvider.js` -> `src/platform/search/providers/ApplicationSearchProvider.js`
- `src/services/providers/SessionSearchProvider.js` -> `src/platform/search/providers/SessionSearchProvider.js`
- `src/services/providers/CommandSearchProvider.js` -> `src/platform/search/providers/CommandSearchProvider.js`
- `src/services/providers/FileSearchProvider.js` -> `src/platform/search/providers/FileSearchProvider.js`
- `src/services/providers/PackageSearchProvider.js` -> `src/platform/search/providers/PackageSearchProvider.js`
- `src/services/commands/DiskCommands.js` -> `src/commands/DiskCommands.js`
- `src/services/commands/FileCommands.js` -> `src/commands/FileCommands.js`
- `src/services/commands/HelpCommands.js` -> `src/commands/HelpCommands.js`
- `src/services/commands/IPCCommands.js` -> `src/commands/IPCCommands.js`
- `src/services/commands/NotificationCommands.js` -> `src/commands/NotificationCommands.js`
- `src/services/commands/PowerCommands.js` -> `src/commands/PowerCommands.js`
- `src/services/commands/ProcessCommands.js` -> `src/commands/ProcessCommands.js`
- `src/services/commands/SystemCommands.js` -> `src/commands/SystemCommands.js`
- `src/services/commands/UserCommands.js` -> `src/commands/UserCommands.js`
- `src/system/capabilities/CapabilityRegistry.js` -> `src/platform/capabilities/CapabilityRegistry.js`
- `src/system/capabilities/providers/CapabilityProvider.js` -> `src/platform/capabilities/providers/CapabilityProvider.js`
- `src/system/capabilities/providers/NetworkCapabilityProvider.js` -> `src/platform/capabilities/providers/NetworkCapabilityProvider.js`
- `src/system/capabilities/providers/DialogCapabilityProvider.js` -> `src/platform/capabilities/providers/DialogCapabilityProvider.js`
- `src/system/capabilities/providers/NotificationCapabilityProvider.js` -> `src/platform/capabilities/providers/NotificationCapabilityProvider.js`
- `src/system/capabilities/providers/ClipboardCapabilityProvider.js` -> `src/platform/capabilities/providers/ClipboardCapabilityProvider.js`
- `src/system/loaders/BuiltinRuntimeLoader.js` -> `src/platform/packages/loaders/BuiltinRuntimeLoader.js`
- `src/system/loaders/LrfsRuntimeLoader.js` -> `src/platform/packages/loaders/LrfsRuntimeLoader.js`
- `src/system/repositories/sources/BuiltinRepositorySource.js` -> `src/platform/packages/repositories/sources/BuiltinRepositorySource.js`
- `src/system/repositories/official.json` -> `src/platform/packages/repositories/official.json`
- `src/system/repositories/packages/example.notes.ldepkg` -> `src/platform/packages/repositories/packages/example.notes.ldepkg`
- `src/system/validation/ManifestValidator.js` -> `src/platform/filesystem/validation/ManifestValidator.js`
- `src/system/validation/rules/ExtensionRule.js` -> `src/platform/filesystem/validation/rules/ExtensionRule.js`
- `src/system/validation/rules/PermissionRule.js` -> `src/platform/filesystem/validation/rules/PermissionRule.js`
- `src/system/validation/rules/RequiredFieldRule.js` -> `src/platform/filesystem/validation/rules/RequiredFieldRule.js`
- `src/system/validation/rules/RuntimeRule.js` -> `src/platform/filesystem/validation/rules/RuntimeRule.js`
- `src/system/validation/rules/SdkVersionRule.js` -> `src/platform/filesystem/validation/rules/SdkVersionRule.js`
- `src/system/themes/BuiltinThemeSource.js` -> `src/platform/theming/themes/BuiltinThemeSource.js`
- `src/system/themes/dark.ldetheme` -> `src/platform/theming/themes/dark.ldetheme`
- `src/system/themes/light.ldetheme` -> `src/platform/theming/themes/light.ldetheme`
- `src/system/widgets/WidgetRegistry.js` -> `src/platform/widgets/WidgetRegistry.js`
- `src/system/widgets/ClockWidget.js` -> `src/platform/widgets/ClockWidget.js`
- `src/system/widgets/CalendarWidget.js` -> `src/platform/widgets/CalendarWidget.js`
- `src/system/widgets/WeatherWidget.js` -> `src/platform/widgets/WeatherWidget.js`
- `src/system/widgets/NotesWidget.js` -> `src/platform/widgets/NotesWidget.js`
- `src/system/screens/ShutdownScreen.js` -> `src/platform/desktop/shell/ShutdownScreen.js`
- `src/system/environments/desktop/Desktop.js` -> `src/platform/environments/desktop/Desktop.js`
- `src/system/environments/desktop/DesktopEnvironmentRegistry.js` -> `src/platform/environments/desktop/DesktopEnvironmentRegistry.js`
- `src/system/environments/platform/PlatformEnvironmentRegistry.js` -> `src/platform/environments/platform/PlatformEnvironmentRegistry.js`
- `src/system/environments/platform/Login.js` -> `src/platform/environments/platform/Login.js`
- `src/system/environments/platform/Lock.js` -> `src/platform/environments/platform/Lock.js`
- `src/system/environments/platform/OOBE.js` -> `src/platform/environments/platform/OOBE.js`
- `src/system/environments/platform/Recovery.js` -> `src/platform/environments/platform/Recovery.js`
- `src/system/environments/platform/Shutdown.js` -> `src/platform/environments/platform/Shutdown.js`
- `src/system/environments/platform/Welcome.js` -> `src/platform/environments/platform/Welcome.js`
- `src/ui/WindowFrame.js` -> `src/platform/window/WindowFrame.js`
- `src/ui/Taskbar.js` -> `src/platform/desktop/shell/Taskbar.js`
- `src/ui/Wallpaper.js` -> `src/platform/desktop/shell/Wallpaper.js`
- `src/ui/CommandPalette.js` -> `src/platform/search/CommandPalette.js`
- `src/ui/NotificationCenter.js` -> `src/platform/notifications/NotificationCenter.js`
- `src/ui/SettingsComponents.js` -> `src/platform/settings/SettingsComponents.js`
- `src/ui/dialogs/OpenWithDialog.js` -> `src/platform/window/dialogs/OpenWithDialog.js`
- `src/ui/dialogs/PropertiesDialog.js` -> `src/platform/window/dialogs/PropertiesDialog.js`
- `src/ui/boot/BootSplash.js` -> `src/platform/boot/BootSplash.js`

## Files Rewritten

- `src/platform/window/WindowManager.js` (3 imports)
- `src/platform/dialog/DialogManager.js` (1 import)
- `src/platform/contextmenu/ContextMenuManager.js` (1 import)
- `src/platform/clipboard/ClipboardManager.js` (1 import)
- `src/platform/shortcuts/ShortcutManager.js` (1 import)
- `src/platform/process/ProcessManager.js` (1 import)
- `src/platform/session/SessionManager.js` (1 import)
- `src/platform/users/UserManager.js` (1 import)
- `src/platform/settings/SettingsManager.js` (1 import)
- `src/platform/packages/ApplicationDatabaseManager.js` (1 import)
- `src/platform/widgets/WidgetManager.js` (1 import)
- `src/platform/extensions/ExtensionRepositoryManager.js` (1 import)
- `src/platform/recovery/RecoveryManager.js` (1 import)
- `src/platform/logging/ErrorService.js` (1 import)
- `src/platform/logging/LogService.js` (1 import)
- `src/platform/network/NetworkService.js` (1 import)
- `src/platform/network/DownloadService.js` (1 import)
- `src/platform/window/WindowService.js` (2 imports)
- `src/platform/dialog/DialogService.js` (1 import)
- `src/platform/contextmenu/ContextMenuService.js` (1 import)
- `src/platform/session/SessionService.js` (1 import)
- `src/platform/session/UserEnvironmentService.js` (4 imports)
- `src/platform/session/PowerService.js` (4 imports)
- `src/platform/security/SecurityService.js` (1 import)
- `src/platform/users/UserService.js` (1 import)
- `src/platform/users/UserProfileService.js` (1 import)
- `src/platform/users/UserSettingsService.js` (1 import)
- `src/platform/boot/BootService.js` (9 imports)
- `src/platform/boot/ShutdownService.js` (3 imports)
- `src/platform/filesystem/FileService.js` (1 import)
- `src/platform/filesystem/DiskService.js` (1 import)
- `src/platform/settings/SettingsService.js` (1 import)
- `src/platform/theming/ThemeService.js` (1 import)
- `src/platform/extensions/ExtensionService.js` (1 import)
- `src/platform/widgets/WidgetService.js` (1 import)
- `src/platform/ipc/IPCService.js` (1 import)
- `src/platform/ipc/CommandService.js` (10 imports)
- `src/platform/notifications/NotificationService.js` (1 import)
- `src/platform/packages/ApplicationDatabaseService.js` (1 import)
- `src/platform/packages/ApplicationIntentService.js` (1 import)
- `src/platform/packages/AssociationService.js` (1 import)
- `src/platform/packages/PackageService.js` (2 imports)
- `src/platform/packages/RepositoryService.js` (1 import)
- `src/platform/packages/PermissionService.js` (1 import)
- `src/platform/packages/TrustService.js` (1 import)
- `src/platform/recovery/RecoveryService.js` (2 imports)
- `src/platform/recovery/RestoreService.js` (1 import)
- `src/platform/search/SearchService.js` (1 import)
- `src/platform/capabilities/CapabilityService.js` (1 import)
- `src/platform/desktop/StartupApplicationService.js` (1 import)
- `src/commands/SystemCommands.js` (2 imports)
- `src/platform/environments/desktop/Desktop.js` (4 imports)
- `src/platform/environments/platform/Shutdown.js` (1 import)
- `src/platform/desktop/shell/Taskbar.js` (1 import)
- `src/platform/desktop/shell/Wallpaper.js` (1 import)
- `src/platform/notifications/NotificationCenter.js` (1 import)
- `src/apps/system/filemanager/FileListComponent.js` (2 imports)
- `src/apps/system/settings/AboutComponent.js` (1 import)
- `src/apps/system/settings/ApplicationsComponent.js` (1 import)
- `src/apps/system/settings/DeveloperComponent.js` (1 import)
- `src/apps/system/settings/GeneralComponent.js` (1 import)
- `src/apps/system/settings/PersonalizationComponent.js` (1 import)
- `src/apps/system/settings/RecoveryComponent.js` (1 import)
- `src/apps/system/settings/StorageComponent.js` (1 import)
- `src/apps/system/settings/UsersComponent.js` (1 import)
- `src/apps/system/settings/WidgetsComponent.js` (1 import)
- `src/developer/quality/HealthReporter.js` (1 import)
- `src/kernel/BootLoader.js` (1 import)
- `src/kernel/kernel.js` (82 imports)
- `tests/bootlogger-logservice.test.js` (2 imports)

## Files Deleted

- `src/managers/EnvironmentManager.js`
- `src/managers/WindowManager.js`
- `src/managers/DialogManager.js`
- `src/managers/ContextMenuManager.js`
- `src/managers/ClipboardManager.js`
- `src/managers/ShortcutManager.js`
- `src/managers/ProcessManager.js`
- `src/managers/SessionManager.js`
- `src/managers/SecurityManager.js`
- `src/managers/UserManager.js`
- `src/managers/UserProfileManager.js`
- `src/managers/UserSettingsManager.js`
- `src/managers/LogManager.js`
- `src/managers/NetworkManager.js`
- `src/managers/SettingsManager.js`
- `src/managers/DiskManager.js`
- `src/managers/ApplicationDatabaseManager.js`
- `src/managers/RuntimeLoaderManager.js`
- `src/managers/RepositoryManager.js`
- `src/managers/PermissionManager.js`
- `src/managers/TrustManager.js`
- `src/managers/ThemeRepositoryManager.js`
- `src/managers/WidgetManager.js`
- `src/managers/ExtensionRepositoryManager.js`
- `src/managers/IPCManager.js`
- `src/managers/NotificationManager.js`
- `src/managers/RecoveryManager.js`
- `src/managers/RestoreManager.js`
- `src/services/ErrorService.js`
- `src/services/LogService.js`
- `src/services/NetworkService.js`
- `src/services/DownloadService.js`
- `src/services/WindowService.js`
- `src/services/DialogService.js`
- `src/services/ContextMenuService.js`
- `src/services/ClipboardService.js`
- `src/services/ShortcutService.js`
- `src/services/SessionService.js`
- `src/services/UserEnvironmentService.js`
- `src/services/PowerService.js`
- `src/services/SecurityService.js`
- `src/services/UserService.js`
- `src/services/UserProfileService.js`
- `src/services/UserSettingsService.js`
- `src/services/BootService.js`
- `src/services/ShutdownService.js`
- `src/services/FileService.js`
- `src/services/DiskService.js`
- `src/services/SettingsService.js`
- `src/services/ThemeService.js`
- `src/services/ExtensionService.js`
- `src/services/WidgetService.js`
- `src/services/IPCService.js`
- `src/services/CommandService.js`
- `src/services/NotificationService.js`
- `src/services/ApplicationDatabaseService.js`
- `src/services/ApplicationService.js`
- `src/services/ApplicationIntentService.js`
- `src/services/AssociationService.js`
- `src/services/RuntimeLoaderService.js`
- `src/services/PackageService.js`
- `src/services/RepositoryService.js`
- `src/services/PermissionService.js`
- `src/services/TrustService.js`
- `src/services/RecoveryService.js`
- `src/services/RestoreService.js`
- `src/services/SearchService.js`
- `src/services/CapabilityService.js`
- `src/services/DesktopEnvironmentService.js`
- `src/services/StartupApplicationService.js`
- `src/services/DeveloperOptionsService.js`
- `src/services/providers/ApplicationSearchProvider.js`
- `src/services/providers/SessionSearchProvider.js`
- `src/services/providers/CommandSearchProvider.js`
- `src/services/providers/FileSearchProvider.js`
- `src/services/providers/PackageSearchProvider.js`
- `src/services/commands/DiskCommands.js`
- `src/services/commands/FileCommands.js`
- `src/services/commands/HelpCommands.js`
- `src/services/commands/IPCCommands.js`
- `src/services/commands/NotificationCommands.js`
- `src/services/commands/PowerCommands.js`
- `src/services/commands/ProcessCommands.js`
- `src/services/commands/SystemCommands.js`
- `src/services/commands/UserCommands.js`
- `src/system/capabilities/CapabilityRegistry.js`
- `src/system/capabilities/providers/CapabilityProvider.js`
- `src/system/capabilities/providers/NetworkCapabilityProvider.js`
- `src/system/capabilities/providers/DialogCapabilityProvider.js`
- `src/system/capabilities/providers/NotificationCapabilityProvider.js`
- `src/system/capabilities/providers/ClipboardCapabilityProvider.js`
- `src/system/loaders/BuiltinRuntimeLoader.js`
- `src/system/loaders/LrfsRuntimeLoader.js`
- `src/system/repositories/sources/BuiltinRepositorySource.js`
- `src/system/repositories/official.json`
- `src/system/repositories/packages/example.notes.ldepkg`
- `src/system/validation/ManifestValidator.js`
- `src/system/validation/rules/ExtensionRule.js`
- `src/system/validation/rules/PermissionRule.js`
- `src/system/validation/rules/RequiredFieldRule.js`
- `src/system/validation/rules/RuntimeRule.js`
- `src/system/validation/rules/SdkVersionRule.js`
- `src/system/themes/BuiltinThemeSource.js`
- `src/system/themes/dark.ldetheme`
- `src/system/themes/light.ldetheme`
- `src/system/widgets/WidgetRegistry.js`
- `src/system/widgets/ClockWidget.js`
- `src/system/widgets/CalendarWidget.js`
- `src/system/widgets/WeatherWidget.js`
- `src/system/widgets/NotesWidget.js`
- `src/system/screens/ShutdownScreen.js`
- `src/system/environments/desktop/Desktop.js`
- `src/system/environments/desktop/DesktopEnvironmentRegistry.js`
- `src/system/environments/platform/PlatformEnvironmentRegistry.js`
- `src/system/environments/platform/Login.js`
- `src/system/environments/platform/Lock.js`
- `src/system/environments/platform/OOBE.js`
- `src/system/environments/platform/Recovery.js`
- `src/system/environments/platform/Shutdown.js`
- `src/system/environments/platform/Welcome.js`
- `src/ui/WindowFrame.js`
- `src/ui/Taskbar.js`
- `src/ui/Wallpaper.js`
- `src/ui/CommandPalette.js`
- `src/ui/NotificationCenter.js`
- `src/ui/SettingsComponents.js`
- `src/ui/dialogs/OpenWithDialog.js`
- `src/ui/dialogs/PropertiesDialog.js`
- `src/ui/boot/BootSplash.js`
