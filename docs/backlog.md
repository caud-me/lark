# LDE 27 Backlog

This backlog tracks deferred features and future ideas, categorized by Series and domain.

---

## Series 2: Platform & Stabilization

### Platform & OS Core
* Advanced Access Control Lists (ACLs) with group-level permissions
* Multi-user concurrent sessions (Switch User capability)
* Persistent sessions (tokens/cookies) across reloads
* CPU usage tracking & Memory estimation
* Process priorities & background applications
* Advanced IPC request/response patterns
* Dynamic `/system/apps.json` Manifest Loading
* Plug-in capability for Kernel Boot stages

### Refactoring & Tech Debt
* **UI Layer Extraction (High Priority)**: Move UI creation out of Managers. `WindowManager` creates `WindowFrame` and `DialogManager` creates DOM elements. Managers should become pure state holders, and Services should instantiate UI (e.g. `WindowService` -> `WindowUI` -> `WindowManager`).
* **WidgetService SRP Review (Medium Priority)**: Split `WidgetService` which currently handles native widgets, extension widgets, and merging logic. Target: `NativeWidgetRegistry` + `ExtensionWidgetProvider` -> `WidgetService` orchestrator.
* **Event Timeline Improvements (Medium Priority)**: Improve runtime ordering, timestamp precision, and optional merged chronological views for Event Viewer.
* **Beginner Philosophy Audit (Medium Priority)**: Conduct a pass over the repository to ensure naming, comments, folder placement, public APIs, and abstractions are beginner-friendly.
* **Lifecycle Event Taxonomy (Medium Priority)**: Formalize lifecycle contracts for Series 6 (e.g. `kernel.ready`, `platform.ready`, `desktop.ready`, `application.ready`) to disambiguate environment handoffs.
* Extract `StringMatcher` utility to deduplicate text-matching logic across Search Providers (e.g. `ApplicationSearchProvider` and `ApplicationService.searchApplications()`).
* Extract `SearchService` provider registration in `kernel.js` into an `_initSearchProviders()` helper.
* Document `CommandPalette` displayResults ordering contract explicitly in `update()`.

### Shell & UI
* **Application Shell Primitives**: Sidebar, Toolbar, StatusBar, Inspector, SplitView
* Third-party Widgets & Widget Marketplace
* Interactive Widget resizing and positioning GUI
* Widget Context Menu (Configure, Refresh, Duplicate, Remove, Pin)
* Widget Scheduler (Shell-owned timers rather than widget-owned intervals)
* Pinned Applications on Taskbar
* Virtual Desktops / Workspaces
* Notification history UI and Notification actions
* Desktop icons and desktop file management
* Multi-workspace selection synchronization
* Clipboard history and Image clipboard support
* Context Menu: nested submenus and plugin API
* Dialog templating system and Wizard framework
* Appearance customization (Accent colors, Theme system)
* Advanced Window Behaviors: Exposé, Snap (Tiling), Mission Control, Workspace switching
* Z-Index manager for Desktop compositor
* Context menu positioning bounds logic (ensure menus don't render off-screen)

### File Management & Storage
* Trash / Recycle Bin
* Undo/Redo for filesystem operations
* Cross-filesystem copy optimization
* Background file transfer jobs with progress reporting
* Disk import/export & repair tools
* LRFS native recursive directory move (avoid copy-then-delete workaround in FileService)

---

## Series 3: Advanced Ecosystem

### Runtime Loader
* Implement `ServiceWorkerRuntimeLoader` (or equivalent) for robust ES module resolution from LRFS.
* Support multi-file package loading without Blob URL limitations.
* Add runtime loader cache and cache invalidation.
* Hot-reload support for development.
* Runtime loader diagnostics and error reporting.

### Package System
* Atomic package installation (filesystem transactions).
* Atomic package uninstallation.
* Rollback on failed install/update.
* Package migration framework for manifest schema changes.
* Package integrity verification.
* Package delta updates.
* Dependency resolution.
* Optional package dependencies.
* Package conflict detection.
* Package repair/reinstall.
* **Lifecycle Hooks:** `beforeInstall`, `afterInstall`, `beforeUninstall`, `afterUninstall`, `beforeUpdate`, `afterUpdate` (for data migration, cache cleanup, etc.)

### Repository System
* `LRFSRepositorySource`
* `HTTPRepositorySource`
* Multiple repository support.
* Repository priority ordering.
* Repository refresh scheduling.
* Repository signatures.
* Repository metadata caching.
* Offline repository synchronization.

### Trust & Security
* Digital signatures.
* Publisher certificates.
* Trust chain verification.
* Repository trust verification.
* Permission prompts.
* Runtime permission enforcement.
* Permission groups/hierarchy.
* Permission auditing.
* Sandboxing architecture.
* Capability-based permission model (future consideration).
* Scoped SYSTEM elevation API (`SecurityService.runAsSystem(callback)`) to replace manual context assignment, along with strict elevation auditing.

### Filesystem
* Filesystem transactions.
* Journaling.
* Recovery after interrupted installs.
* File locking.
* Copy-on-write support (future).
* Snapshot support (future).

### Software Center
* Package details page.
* Screenshots.
* Changelog viewer.
* Ratings/reviews (if desired).
* Update management.
* Installed size reporting.
* Disk usage reporting.
* Version history.
* Search filters.
* Categories.
* Featured applications.

### Search
* Installed vs available ranking.
* Package category filtering.
* Search result grouping.
* Repository-aware search.
* Semantic package search.

### Ecosystem
* Package updates.
* Automatic updates.
* Background update service.
* Release channels (Stable/Beta/Nightly).
* Package pinning.
* Import/export installed applications.

### Capability Framework
* Capability Versioning (e.g. `dialogs@1`, `dialogs@2`).
* Capability Context (passing `appId`, `pid`, `windowId`, `scopes` in `capabilityService.get()`).
* Runtime capability enforcement.
* Dynamic capability enablement/disablement.

### Personalization Framework
* Theme inheritance (e.g. Dark -> Graphite -> Custom Accent).
* Icon packs.
* Wallpapers (actual image rendering).
* Fonts.
* Animations.
* Sound themes.
* Asset Package Manager (merging themes/widgets with PackageManager).

### Extension Framework
* First-class extension metadata (`minimumOsVersion`, `permissions`, `enabled`).
* Extension enablement/disablement state persistence.
* Dynamic loading/unloading of extensions based on OS version compatibility.
* Subsystem sandboxing for third-party extensions.

### Network Framework
* HTTP caching layer
* Resumable downloads
* WebSockets support
* Proxy configuration support
* TLS certificate management
* Offline cache / ServiceWorker integration
* Bandwidth limiting
* Network diagnostics and request history

### Architecture Principles
* Continue auditing responsibilities after every phase.
* Continue documenting every architectural change.
* Keep SRP enforcement strict.
* Prefer new subsystems over expanding existing ones.
* Remove temporary compatibility layers once migrations are complete.

---

## Series 5: System Recovery & Protection

### Recovery Environment
* Full Filesystem Scan (fscheck) implementation to detect orphaned directories, verify metadata integrity, and repair corruptions.
* System Restore & Snapshot mechanism to rollback system states.

### System Restore
* Filesystem transactions (transactional boundaries for reliable rollback).
* Copy-on-write mechanisms for efficient snapshotting.
* Restore verification (validating snapshot integrity before restore).
* Incremental snapshots (delta restores).
* Automatic restore points (triggering snapshots before major system changes).
* Package rollback (isolated rollbacks for specific installed applications).
* Rollback after failed updates (automatic recovery).

### Identity & Multi-User
* Credential subsystem extraction (`AuthenticationService` / `CredentialService` to own passwords, hashes, and login verification instead of `UserService`).
* Formalize Boot & Welcome Environments as dedicated platform constructs (`BootEnvironment` interfaces).
* Expand user session restoration to comprehensively load Dock, widgets, desktop icons, file manager state, preferences, and recent files from the user's home folder.
* Rename Task Manager representation and labels from "Desktop Workspace" to "Desktop Environment" to align with its true lifecycle scope.
* Guest accounts (ephemeral home directory, destroyed on logout). (Placeholder ready)
* Keep Home Folder / Delete Home Folder option when deleting users.
* Concurrent active desktops (running multiple shell instances simultaneously).
* Remote sessions (RDP/VNC style).
* Domain accounts / Network authentication.
* Per-user file encryption (automatically mounting decrypted home directory on login).
* Session migration (moving sessions between devices).

---

## Research & Exploration

* IndexedDB Storage Driver
* Cloud storage driver (e.g. Google Drive, Dropbox)
* Wayland-style compositor ideas
* Accessibility framework and Localization (i18n)
* Disk snapshots (Time Machine style)
* Live log streaming & Crash reports telemetry

# Backlog Addition — Future Platform Refactor: Subsystem-Oriented Source Tree

## Category

Architecture Evolution (Post-Series 4)

## Background

The current source tree is intentionally organized by architectural role (services, managers, pplication, system, etc.) because Series 3 is focused on proving the platform architecture itself.

This layout maximizes discoverability while the platform is still evolving.

However, as the operating system grows, individual subsystems (Search, Networking, Packages, Widgets, Windows, Processes, etc.) will accumulate enough files that architectural locality becomes more important than role-based grouping.

This is **not** technical debt and should **not** be addressed during Series 3.

---

## Future Goal

When the platform reaches sufficient maturity, reorganize the source tree around **subsystems** rather than **artifact types**.

For example:

Current

`	ext
services/
managers/
system/
`

may evolve toward

`	ext
platform/
    window/
    process/
    search/
    network/
    widgets/
    packages/
    filesystem/
`

Each subsystem may internally contain its own:

* Managers
* Services
* Policies
* Runtime objects
* Utilities
* Models

This change is intended purely for developer ergonomics and source locality.

---

## Constraints

This migration must satisfy all of the following:

* Zero behavioral changes.
* Zero architectural changes.
* Zero public API changes.
* Preserve all Constitution rules.
* Preserve the Manager/Service separation.
* Preserve dependency directions.
* Preserve Extension Framework behavior.
* Preserve Capability architecture.

Only the physical file organization should change.

---

## Trigger Criteria

Do **not** begin this migration until most of the following are true:

* Multiple subsystems exceed ~10–15 files.
* Developers regularly navigate across several directories to understand a single subsystem.
* Platform architecture has stabilized.
* Developer Platform (Series 4) is complete.
* Public APIs are considered stable.

---

## Planning Requirement

Before any subsystem reorganization begins:

1. Perform a complete Architecture Audit.
2. Identify candidate subsystems.
3. Produce a migration plan.
4. Verify import compatibility.
5. Execute incrementally.
6. Confirm zero functional regressions.

---

## Design Philosophy

Series 3 optimizes for understanding the architecture.

Future platform cleanup will optimize for understanding individual subsystems.

The architecture itself should never change during this migration—only its physical organization.

# Architectural Evolution — UI Shell Subsystems

## Category

Architecture Evolution (Post-Series 4)

## Background

The dependency audit at the conclusion of Series 3 correctly identified that WindowManager, DialogManager, and ContextMenuManager currently own presentation responsibilities, directly creating DOM elements and manipulating the HTML shell.

However, these are not isolated violations—they represent an entire category of platform infrastructure: **Shell UI Subsystems** (window compositor, modal compositor, popup compositor).

Refactoring them during Series 3 would introduce a major architectural change before the platform has stabilized its basic APIs. They are functionally working and correctly exposed to applications via WindowService and DialogService.

---

## Future Target Architecture

When the platform reaches the "Desktop Shell Modernization" phase (likely late Series 4 or beyond), introduce dedicated shell presentation components to decouple rendering from state management.

`	ext
WindowManager       -> owns window state only
WindowService       -> lifecycle API
WindowShell         -> renders WindowFrames

DialogManager       -> owns dialog queue only
DialogService       -> dialog API
SystemDialogs       -> renders dialogs

ContextMenuManager  -> owns menu state only
ContextMenuService  -> menu API
SystemContextMenus  -> renders menus
`

Every subsystem will follow the standard LDE model:

Manager -> Service -> Shell/UI Renderer

## Trigger Criteria

* Do NOT execute this extraction until standard platform development necessitates a cohesive ShellRenderer layer (e.g., when adding complex notifications, docks, mission control, or workspaces).

---

## Series 5.16: Architectural Debt — Formally Deferred

All items below were identified during the Series 5 architectural audit and intentionally deferred. Each item includes a clear trigger criterion so future contributors know when (and whether) to act.

---

### Boot & Lifecycle

**Evaluate extraction of Platform Environment classes from `BootService.js`**
`LoginPlatformEnvironment`, `LockPlatformEnvironment`, `RecoveryPlatformEnvironment`, `OobePlatformEnvironment`, `WelcomePlatformEnvironment`, `ShutdownPlatformEnvironment` are intentionally co-located in `BootService.js`. They are boot states, not general-purpose UI environments. Co-location avoids unnecessary file scatter.
**Trigger:** Extract only if `BootService.js` exceeds ~600 lines or if the classes require independent version history, cross-importing, or their own unit tests.

---

### State Layer

**Create `PackageManager.js` as a pure state container**
Package extraction and validation currently live inline in `PackageService`. A dedicated `PackageManager` would own the active installation state separately.
**Trigger:** When `PackageService` exceeds ~500 lines or when active installation state needs to persist across service restarts.

**Create `PersonalizationManager.js`**
Active theme and wallpaper preference persistence is currently handled by `ThemeService` directly. A dedicated `PersonalizationManager` would own this mutable preference state.
**Trigger:** When personalization state grows to include more than theme + wallpaper (e.g., accent color, icon pack, font scale).

---

### Service API Surface Hardening

The Series 5 Service API Audit identified a pattern throughout the service layer: Manager instances are exposed as public `this.managerName` properties on Services. This is the root cause of the DIP violations fixed in 5.16. The following items address the remaining instances.

**Priority 1 — Security-critical (address in earliest Series 6 patch)**

- **`UserService.getUsers()` / `getUser()` return `passwordHash` in raw user objects.** Every caller of these methods receives credential hashes. Add scrubbing: strip `passwordHash`, `passwordHint`, `passwordInitialized` from returned user objects in `getUsers()` and `getUser()`. Internal methods that need the full object should use `this.userManager.getUser()` directly.

- **`SecurityService.securityManager` is a public property.** Any caller can call `securityService.securityManager.addElevation(pid)` to grant arbitrary processes elevated privileges without going through `canElevate()`. Privatize: rename to `_securityManager`, add a `hasElevation(pid)` public method if needed.

- **`ProcessService` accesses `securityService.securityManager` directly (L107).** `ProcessService` calls `securityManager.compareRoles()` internally. Add a `SecurityService.compareRoles(contextA, contextB)` public method and update `ProcessService` to use it.

- **`DiskService.lrfs` is a public property.** Any caller can access the raw LRFS filesystem object and bypass `FileService`'s `_checkAccess()` entirely. Privatize: rename to `_lrfs`. `DiskService`'s public API is already correct (`getDiskInfo()`, `getSnapshots()`).

**Priority 2 — Medium risk (address during first Series 6 hardening pass)**

- **`SessionService.sessionManager` and `.userManager` are public.** Callers can bypass login logic entirely. Privatize both to `_sessionManager` and `_userManager`.
- **`ProcessService.processManager` is public.** Callers can bypass `ProcessPolicy` by calling `terminateProcess()` directly on the manager. Privatize to `_processManager`. Requires auditing all external call sites.
- **`DesktopEnvironmentService.providers` and `.environments` are public Maps.** Callers can inject rogue providers or destroy live environments directly. Privatize both.
- **`SearchService.providers` is a public mutable array.** Should be privatized to `_providers`. Add `getProviders()` returning a defensive copy if needed by the command palette.
- **`PermissionService.manager` is public.** Callers can set permission state without going through `requestPermission()` (which emits audit events). Privatize to `_manager`.

**Priority 3 — Low risk (address when touching the relevant subsystem)**

- **`WidgetService.widgetManager`, `.extensionService`, `.serviceRegistry` are public.** Callers can bypass `save()` and the `widget.changed` event. Privatize.
- **`IPCService.ipcManager` is public.** Callers can disconnect processes' IPC subscriptions directly. Privatize.
- **`NetworkService.manager` is public.** Callers can fake online/offline state. Privatize.
- **`NotificationService.notificationManager` is public.** Low risk but inconsistent. Privatize.
- **`ThemeService.themeRepositoryManager` is public.** Callers can wipe all themes. Privatize.
- **`PackageService.fileService` is public.** Callers get a pre-permissioned filesystem handle. Privatize.
- **`DiskService.diskManager` is public (alongside `lrfs`).** Privatize.
- **`WindowService.windowManager` and `.registry` are public.** The two new accessor methods (`getActiveWindowEnvironmentType()`, `getWindowEnvironmentType()`) are correct but a determined caller still bypasses them via `windowService.windowManager`. Privatize `windowManager` and `registry` in a future window hardening pass.

---

### Naming Consistency

**`ShutdownService.emitPhase()` should be `_emitPhase()`**
This method is purely internal — only called by `execute()`. The missing underscore signals a public API that doesn't exist.
**Trigger:** Next time `ShutdownService` is touched.

**`BootService.applyHostTheme()` should be `_applyHostTheme()`**
Only called internally within `BootService` (3 call sites). Public by name but private by use.
**Trigger:** Next time `BootService` is touched.

---

### Architecture

**`EnvironmentType.BOOT` ambiguity**
`OobePlatformEnvironment` uses `EnvironmentType.BOOT` as its type. OOBE is semantically distinct from the initial boot process. Consider adding `EnvironmentType.OOBE` or renaming `BOOT` → `OOBE`. Symbol rename propagates through `InputPolicy`, `BootService`, `EnvironmentManager`, and all DOM containers.
**Trigger:** When the OOBE environment is next reworked or when a separate boot diagnostic screen is added that would also need `EnvironmentType.BOOT`.

**`PowerService` direct Manager access**
`PowerService` holds `ProcessManager` and `SessionManager` directly and force-terminates processes via `processManager.terminateProcess()`, bypassing `ProcessService` and `ProcessPolicy`. This is intentional for force-kill during logout but is undocumented as an intentional architectural bypass. Add an explicit comment in `PowerService._terminateUserProcesses()` explaining why the Policy bypass is deliberate. Long-term: introduce `ProcessService.forceTerminateAll(sessionId)` with its own bypass comment, so `PowerService` can use the public API.
**Trigger:** When `ProcessPolicy` grows to enforce more nuanced rules during logout.

**Repository reorganization**
~~**Repository reorganization**~~
**✅ Completed in Series 6.0.**

The domain-first `src/platform/` reorganization was executed successfully.
- 129 files moved, 97 imports rewritten across 14 files.
- Minor manual import adjustments made post-run.
- Environment registries served as natural rerouting points.
- `tools/migration/` is retained for future reorganizations (update `migration_map.json` only).

See Series 6.0 in `phases.md` for the full record.

