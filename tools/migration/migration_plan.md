# LDE Repository Migration Tool — Design Reference

## Overview

This tool performs a deterministic, repeatable, and idempotent reorganization
of the LDE repository from the current flat `src/managers/` + `src/services/`
layout to a domain-first `src/platform/` structure.

The tool is **data-driven**: only `migration_map.json` needs to change for any
future reorganization. The Python logic is architecture-agnostic.

---

## Files

```
tools/migration/
├── migrate.py               Main script
├── migration_map.json       The data — every file move defined here
├── migration_plan.md        This document
├── verification_checklist.md  Human checklist for post-migration validation
└── migration_report_*.md    Generated after each run
```

---

## Migration Strategy

The strategy was deliberately chosen to avoid broken intermediate states:

```
Step 1:  Load and validate the migration map
Step 2:  Scan the repository (build index of all JS files)
Step 3:  Plan import rewrites (calculate changes, modify nothing)
Step 4:  Back up all files that will be touched
Step 5:  COPY all files to new locations  ← originals still exist
Step 6:  Rewrite imports inside new file locations
         (also rewrites unmoved files whose imports point to moved files)
Step 7:  VERIFY — no broken imports, no stale references, no missing files
Step 8:  DELETE originals only after verification passes
Step 9:  Generate migration report
```

**Why copy before rewriting, not rewrite then move?**

Copying first means:
- Both old and new locations exist simultaneously → project never in broken state.
- Import rewriting calculates paths relative to the file's **final** location,
  so the math is always correct.
- If anything fails, the originals are untouched. Rollback is `rm -rf src/platform/`.

---

## Import Rewriting Algorithm

The key insight: when a file is copied to a new location, its imports still
reference paths relative to the **old** location. The rewriter must:

1. Know where each file was **originally authored** (the reverse map).
2. Resolve each import relative to the original location → absolute target.
3. Check if that target also moved (forward map).
4. Calculate the new relative path from the file's **final** location to
   the target's **final** location.
5. Substitute.

```python
target_original = resolve_import(import_str, file_original_path)
target_final    = forward_map.get(target_original, target_original)
new_import      = relative_import(file_final_path.parent, target_final)
```

This handles all four cases:
- File moved, target moved → both recalculated
- File moved, target stayed → path recalculated from new file location
- File stayed, target moved → path recalculated to target's new location
- File stayed, target stayed → no change

---

## Import Patterns Detected

| Pattern                              | Example                                |
|--------------------------------------|----------------------------------------|
| Static default import                | `import X from '../services/X.js'`     |
| Static named import                  | `import { X } from '../services/X.js'` |
| Static namespace import              | `import * as X from '../services/X.js'`|
| Side-effect import                   | `import '../services/X.js'`            |
| Dynamic import                       | `await import('../services/X.js')`     |
| `new URL()`                          | `new URL('../data/x.json', import.meta.url)` |
| `fetch()`                            | `fetch('../data/x.json')`              |

**Only relative imports** (starting with `./` or `../`) are rewritten.
Bare specifiers (`import 'react'`) and absolute URLs are left unchanged.

---

## What Is Not Automated

The following require manual action after migration. They are surfaced in the
**Unknown Syntax** section of the dry-run report.

### `sw.js` — Service Worker Cache Manifest

This file contains a string array of every cached asset path. After migration,
update all `./src/services/...`, `./src/managers/...`, and `./src/system/...`
paths to their new `./src/platform/...` equivalents.

### `src/kernel/AppRegistry.js` — Application Entry Points

The `entryPoint` field in app registrations is a runtime string, not a static
import — the tool cannot rewrite it. After migration, update all `entryPoint`
strings that reference moved files (e.g. `../services/providers/FileSearchProvider.js`
→ `../platform/search/providers/FileSearchProvider.js`).

### `src/kernel/kernel.js` — `registerSource()` String Path

One call passes a path string to `registerSource()`:
```js
this.repositoryManager.registerSource('builtin-official', new BuiltinRepositorySource('../src/system/repositories/official.json'));
```
Update to point to `../src/platform/packages/repositories/official.json`.

### `index.html` — Static Asset `<link>` and `<script>` Tags

The tool does not rewrite HTML files. Verify:
- `<script type="module" src="...">` entry point path
- `<link rel="stylesheet" href="...">` CSS paths (`theme.css`, `omni.css`)

---

## Rollback Procedure

### If migration failed mid-way:
```
# Delete the partially-migrated platform directory
rm -rf src/platform
rm -rf src/commands

# Restore from backup (all modified files are there)
cp -r migration_backup/* .
```

### If migration completed but something is wrong:
```
# The git history is the canonical rollback.
git checkout HEAD -- src/
# Or if you committed: git revert <commit>
```

---

## Running the Tool

### Prerequisites
- Python 3.8 or higher (stdlib only — no pip installs required)

### Commands

```powershell
# Preview everything — safe, reads only
python tools/migration/migrate.py --dry-run

# Execute the migration
python tools/migration/migrate.py --execute

# Re-verify after migration (or after manual fixes)
python tools/migration/migrate.py --verify
```

### Override repository root (if running from a different directory)
```powershell
python tools/migration/migrate.py --dry-run --repo-root "C:\path\to\repo"
```

---

## Updating the Map for Future Migrations

The tool is architecture-agnostic. To reorganize the repository again:

1. Open `migration_map.json`.
2. Add, remove, or change entries in the `"moves"` object.
3. Run `--dry-run` to preview.
4. Run `--execute` when satisfied.

No changes to `migrate.py` are required.

---

## Target Directory Structure (After Migration)

```
src/
├── kernel/                    # Kernel core (unchanged)
├── platform/
│   ├── boot/                  # BootService, ShutdownService, BootSplash
│   ├── capabilities/          # CapabilityService, CapabilityRegistry, providers/
│   ├── clipboard/             # ClipboardManager, ClipboardService
│   ├── contextmenu/           # ContextMenuManager, ContextMenuService
│   ├── desktop/               # DesktopEnvironmentService, StartupApplicationService
│   │   └── shell/             # Taskbar, Wallpaper, ShutdownScreen
│   ├── dialog/                # DialogManager, DialogService
│   ├── environments/          # EnvironmentManager
│   │   ├── desktop/           # Desktop.js, DesktopEnvironmentRegistry
│   │   └── platform/          # Login, Lock, OOBE, Recovery, Shutdown, Welcome
│   ├── extensions/            # ExtensionRepositoryManager, ExtensionService
│   ├── filesystem/            # FileService, DiskService, DiskManager
│   │   └── validation/        # ManifestValidator + rule files
│   ├── ipc/                   # IPCManager, IPCService, CommandService
│   ├── logging/               # LogManager, LogService, ErrorService
│   ├── network/               # NetworkManager, NetworkService, DownloadService
│   ├── notifications/         # NotificationManager, NotificationService, NotificationCenter
│   ├── packages/              # Package ecosystem (app DB, runtime, packages, repos)
│   │   ├── loaders/           # BuiltinRuntimeLoader, LrfsRuntimeLoader
│   │   └── repositories/      # BuiltinRepositorySource, official.json
│   ├── process/               # ProcessManager
│   ├── recovery/              # RecoveryManager, RestoreManager, RecoveryService, RestoreService
│   ├── search/                # SearchService, CommandPalette
│   │   └── providers/         # ApplicationSearchProvider, etc.
│   ├── security/              # SecurityManager, SecurityService
│   ├── session/               # SessionManager, SessionService, PowerService, UserEnvironmentService
│   ├── settings/              # SettingsManager, SettingsService, SettingsComponents
│   ├── shortcuts/             # ShortcutManager, ShortcutService
│   ├── theming/               # ThemeService, ThemeRepositoryManager
│   │   └── themes/            # BuiltinThemeSource, dark.ldetheme, light.ldetheme
│   ├── users/                 # UserManager, UserService, UserProfileService, UserSettingsService
│   ├── widgets/               # WidgetManager, WidgetService, WidgetRegistry, widget files
│   └── window/                # WindowManager, WindowService, WindowFrame
│       └── dialogs/           # OpenWithDialog, PropertiesDialog
├── commands/                  # Terminal command modules (DiskCommands, FileCommands, etc.)
├── policies/                  # Access control policies (unchanged)
├── storage/                   # Storage drivers (unchanged)
├── application/               # Application framework (unchanged)
├── sdk/                       # Developer SDK (unchanged)
├── system/                    # OS constants and base contracts (reduced — moved files gone)
├── apps/                      # User-space applications (unchanged)
├── ui/                        # theme.css, omni.css, sfi.ttf (static assets only)
└── developer/                 # DeveloperOptionsService + diagnostics
```
