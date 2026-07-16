# LDE Migration Summary

**Mode:** Dry Run  
**Date:** 2026-07-14T02:09:49.432423  
**Tool:** v2.0  
**Python:** 3.12.0  
**Repository:** `C:\Users\ar\Documents\GitHub\lark-desktop-environment - experimental`  

---

## Results

| Metric | Value |
|---|---|
| Files moved | 129 |
| Imports rewritten | 0 |
| Files rewritten | 0 |
| Directories removed | 0 |
| Verification | **FAILED** |
| Warnings | 0 |
| Errors | 0 |
| Duration | 0.47s |

## Import Coverage

| | Count |
|---|---|
| Scanned | 0 |
| Updated | 0 |
| Skipped | 0 |
| Unknown syntax | 0 |

## Verification Checks

### All destinations present — FAIL
Checked: 129
- `MISSING: src/platform/environments/EnvironmentManager.js`
- `MISSING: src/platform/window/WindowManager.js`
- `MISSING: src/platform/dialog/DialogManager.js`
- `MISSING: src/platform/contextmenu/ContextMenuManager.js`
- `MISSING: src/platform/clipboard/ClipboardManager.js`
- `MISSING: src/platform/shortcuts/ShortcutManager.js`
- `MISSING: src/platform/process/ProcessManager.js`
- `MISSING: src/platform/session/SessionManager.js`
- `MISSING: src/platform/security/SecurityManager.js`
- `MISSING: src/platform/users/UserManager.js`
- `MISSING: src/platform/users/UserProfileManager.js`
- `MISSING: src/platform/users/UserSettingsManager.js`
- `MISSING: src/platform/logging/LogManager.js`
- `MISSING: src/platform/network/NetworkManager.js`
- `MISSING: src/platform/settings/SettingsManager.js`
- `MISSING: src/platform/filesystem/DiskManager.js`
- `MISSING: src/platform/packages/ApplicationDatabaseManager.js`
- `MISSING: src/platform/packages/RuntimeLoaderManager.js`
- `MISSING: src/platform/packages/RepositoryManager.js`
- `MISSING: src/platform/packages/PermissionManager.js`
- ... and 109 more

### No duplicate destinations — PASS
Checked: 129

### All sources have destinations — PASS
Checked: 129

### No stale imports — FAIL
Checked: 197
- `src/apps/system/filemanager/FileListComponent.js:292: still imports old path '../../../ui/dialogs/OpenWithDialog.js'`
- `src/apps/system/filemanager/FileListComponent.js:324: still imports old path '../../../ui/dialogs/PropertiesDialog.js'`
- `src/apps/system/settings/AboutComponent.js:2: still imports old path '../../../ui/SettingsComponents.js'`
- `src/apps/system/settings/ApplicationsComponent.js:2: still imports old path '../../../ui/SettingsComponents.js'`
- `src/apps/system/settings/DeveloperComponent.js:2: still imports old path '../../../ui/SettingsComponents.js'`
- `src/apps/system/settings/GeneralComponent.js:2: still imports old path '../../../ui/SettingsComponents.js'`
- `src/apps/system/settings/PersonalizationComponent.js:2: still imports old path '../../../ui/SettingsComponents.js'`
- `src/apps/system/settings/RecoveryComponent.js:2: still imports old path '../../../ui/SettingsComponents.js'`
- `src/apps/system/settings/StorageComponent.js:2: still imports old path '../../../ui/SettingsComponents.js'`
- `src/apps/system/settings/UsersComponent.js:2: still imports old path '../../../ui/SettingsComponents.js'`
- `src/apps/system/settings/WidgetsComponent.js:2: still imports old path '../../../ui/SettingsComponents.js'`
- `src/developer/quality/HealthReporter.js:4: still imports old path '../../system/validation/ManifestValidator.js'`
- `src/kernel/BootLoader.js:2: still imports old path '../ui/boot/BootSplash.js'`
- `src/kernel/kernel.js:91: still imports old path '../managers/NetworkManager.js'`
- `src/kernel/kernel.js:92: still imports old path '../managers/LogManager.js'`
- `src/kernel/kernel.js:93: still imports old path '../managers/WindowManager.js'`
- `src/kernel/kernel.js:94: still imports old path '../managers/ProcessManager.js'`
- `src/kernel/kernel.js:95: still imports old path '../managers/SettingsManager.js'`
- `src/kernel/kernel.js:96: still imports old path '../managers/UserManager.js'`
- `src/kernel/kernel.js:97: still imports old path '../managers/UserProfileManager.js'`
- ... and 107 more

### All import targets exist — PASS
Checked: 197
