# The Book of Lark OS

### *The Canonical Technical Reference Manual for Lark OS 27*

---

# Read This First

If you are a new developer or contributor to Lark OS:

1. **Read [`constitution.md`](file:///c:/Users/ar/Documents/GitHub/lark-desktop-environment%20-%20experimental/docs/constitution.md) first.** It contains the immutable laws, security principles, and architectural invariants of Lark OS 27.
2. **Read Part I (Introduction & Terminology), Part II (System Architecture), and Part III (Boot System)** in this book to understand the operating system core.
3. **Everything afterwards serves as the canonical technical reference manual** for Lark OS 27 (Series 10, 27.10.1).

---

# Table of Contents

- [Read This First](#read-this-first)
- [Part I — Introduction & Terminology](#part-i--introduction--terminology)
  - [Chapter 1: What is Lark OS?](#chapter-1-what-is-lark-os)
  - [Chapter 2: Design Philosophy & Architectural Goals](#chapter-2-design-philosophy--architectural-goals)
  - [Chapter 3: Platform Glossary & Core Terminology](#chapter-3-platform-glossary--core-terminology)
- [Part II — System Architecture](#part-ii--system-architecture)
  - [Chapter 1: The Layer Stack & Downward Dependency Law](#chapter-1-the-layer-stack--downward-dependency-law)
  - [Chapter 2: The Kernel & Subsystem Bootstrapping](#chapter-2-the-kernel--subsystem-bootstrapping)
  - [Chapter 3: Managers (State Owners) & The Terminal UI Test](#chapter-3-managers-state-owners--the-terminal-ui-test)
  - [Chapter 4: Services (Public APIs & Observability Encapsulation)](#chapter-4-services-public-apis--observability-encapsulation)
  - [Chapter 5: Orchestrators (Workflow Coordinators)](#chapter-5-orchestrators-workflow-coordinators)
  - [Chapter 6: Capabilities & Security Providers](#chapter-6-capabilities--security-providers)
  - [Chapter 7: Shell Components & Presentation Surfaces](#chapter-7-shell-components--presentation-surfaces)
  - [Chapter 8: Applications (User-space Executables)](#chapter-8-applications-user-space-executables)
- [Part III — Boot System & Lifecycle](#part-iii--boot-system--lifecycle)
  - [Chapter 1: The Boot Pipeline (Architectural Invariant)](#chapter-1-the-boot-pipeline-architectural-invariant)
  - [Chapter 2: BootOrchestrator Mechanics](#chapter-2-bootorchestrator-mechanics)
  - [Chapter 3: Platform Environments (Login, Lock, OOBE, Welcome, Recovery, Shutdown)](#chapter-3-platform-environments-login-lock-oobe-welcome-recovery-shutdown)
  - [Chapter 4: Session Startup & User Environment Restoration](#chapter-4-session-startup--user-environment-restoration)
  - [Chapter 5: System Teardown & ShutdownOrchestrator](#chapter-5-system-teardown--shutdownorchestrator)
- [Part IV — Desktop Environment & Shell Surfaces](#part-iv--desktop-environment--shell-surfaces)
  - [Chapter 1: Shell Philosophy & Composition](#chapter-1-shell-philosophy--composition)
  - [Chapter 2: LdeDesktopEnvironment vs MinimalDesktopEnvironment](#chapter-2-ldedesktopenvironment-vs-minimaldesktopenvironment)
  - [Chapter 3: Presentation Model Pattern (LauncherModel to TaskbarSurface)](#chapter-3-presentation-model-pattern-launchermodel-to-taskbarsurface)
  - [Chapter 4: Windowing Subsystem (WindowManager & WindowSurface)](#chapter-4-windowing-subsystem-windowmanager--windowsurface)
  - [Chapter 5: Modal Dialog Subsystem (DialogManager & DialogSurface)](#chapter-5-modal-dialog-subsystem-dialogmanager--dialogsurface)
  - [Chapter 6: Context Menu Subsystem (ContextMenuManager & ContextMenuSurface)](#chapter-6-context-menu-subsystem-contextmenumanager--contextmenusurface)
  - [Chapter 7: Notification Center & Toast Surface](#chapter-7-notification-center--toast-surface)
  - [Chapter 8: Widget Subsystem & Desktop Host Plane](#chapter-8-widget-subsystem--desktop-host-plane)
  - [Chapter 9: System Search & Command Palette](#chapter-9-system-search--command-palette)
  - [Chapter 10: Wallpaper Presentation Surface](#chapter-10-wallpaper-presentation-surface)
- [Part V — Process System & Package Management](#part-v--process-system--package-management)
  - [Chapter 1: Process Model & ProcessTable](#chapter-1-process-model--processtable)
  - [Chapter 2: Runtime Loader Strategies (Builtin vs LRFS)](#chapter-2-runtime-loader-strategies-builtin-vs-lrfs)
  - [Chapter 3: Package System (.ldepkg Architecture & PackageInstallOrchestrator)](#chapter-3-package-system-ldepkg-architecture--packageinstallorchestrator)
  - [Chapter 4: Application Database & Manifest Schema](#chapter-4-application-database--manifest-schema)
  - [Chapter 5: Application Intent Routing & Singleton Revivals](#chapter-5-application-intent-routing--singleton-revivals)
- [Part VI — Virtual Filesystem (LRFS)](#part-vi--virtual-filesystem-lrfs)
  - [Chapter 1: Virtual Filesystem (LRFS) & Storage Drivers](#chapter-1-virtual-filesystem-lrfs--storage-drivers)
  - [Chapter 2: Directory Taxonomy (/system, /users, /packages, /tmp)](#chapter-2-directory-taxonomy-system-users-packages-tmp)
  - [Chapter 3: Path Resolution & Security Policy Evaluation](#chapter-3-path-resolution--security-policy-evaluation)
  - [Chapter 4: Scoped FileService & Process Sandboxing](#chapter-4-scoped-fileservice--process-sandboxing)
- [Part VII — Security, Capabilities & Authorization](#part-vii--security-capabilities--authorization)
  - [Chapter 1: Security Model & Privilege Contexts](#chapter-1-security-model--privilege-contexts)
  - [Chapter 2: Capability Framework & Providers](#chapter-2-capability-framework--providers)
  - [Chapter 3: Scoped Service Registry & Identity Binding](#chapter-3-scoped-service-registry--identity-binding)
  - [Chapter 4: Package Trust Evaluation](#chapter-4-package-trust-evaluation)
  - [Chapter 5: Recovery Mode & Diagnostic Safe Guards](#chapter-5-recovery-mode--diagnostic-safe-guards)
- [Part VIII — Event System & Observability](#part-viii--event-system--observability)
  - [Chapter 1: SystemEventBus Architecture](#chapter-1-systemeventbus-architecture)
  - [Chapter 2: Event Naming Conventions](#chapter-2-event-naming-conventions)
  - [Chapter 3: Single Authoritative Emitter Invariant](#chapter-3-single-authoritative-emitter-invariant)
  - [Chapter 4: Semantic Subscription API Patterns](#chapter-4-semantic-subscription-api-patterns)
  - [Chapter 5: LogManager & BootLogger Pipeline](#chapter-5-logmanager--bootlogger-pipeline)
- [Part IX — User Sessions & Personalization](#part-ix--user-sessions--personalization)
  - [Chapter 1: Session State Machine (Active, Suspended, Ended)](#chapter-1-session-state-machine-active-suspended-ended)
  - [Chapter 2: User Account Administration (UserManager & UserProfileService)](#chapter-2-user-account-administration-usermanager--userprofileservice)
  - [Chapter 3: Theme Framework & CSS Variables](#chapter-3-theme-framework--css-variables)
  - [Chapter 4: User Preference Persistence (UserSettingsManager)](#chapter-4-user-preference-persistence-usersettingsmanager)
  - [Chapter 5: Startup Application Orchestrator](#chapter-5-startup-application-orchestrator)
- [Part X — UI Framework & Presentation Layer](#part-x--ui-framework--presentation-layer)
  - [Chapter 1: Shell CSS Design System](#chapter-1-shell-css-design-system)
  - [Chapter 2: Omni UI Framework vs Shell Independence](#chapter-2-omni-ui-framework-vs-shell-independence)
  - [Chapter 3: DOM Compositing & Z-Index Layering Planes](#chapter-3-dom-compositing--z-index-layering-planes)
  - [Chapter 4: Micro-Animation Guidelines](#chapter-4-micro-animation-guidelines)
- [Part XI — Stable Public Platform APIs Reference](#part-xi--stable-public-platform-apis-reference)
  - [Chapter 1: WindowService](#chapter-1-windowservice)
  - [Chapter 2: DialogService](#chapter-2-dialogservice)
  - [Chapter 3: ApplicationService](#chapter-3-applicationservice)
  - [Chapter 4: NotificationService](#chapter-4-notificationservice)
  - [Chapter 5: ProcessService](#chapter-5-processservice)
  - [Chapter 6: FileService](#chapter-6-fileservice)
  - [Chapter 7: CapabilityService](#chapter-7-capabilityservice)
  - [Chapter 8: SessionService](#chapter-8-sessionservice)
  - [Chapter 9: Experimental & Internal Subsystem APIs](#chapter-9-experimental--internal-subsystem-apis)
- [Part XII — Development Guide & Extension Standards](#part-xii--development-guide--extension-standards)
  - [Chapter 1: Repository Directory Organization](#chapter-1-repository-directory-organization)
  - [Chapter 2: Coding Conventions & JSDoc Header Annotations](#chapter-2-coding-conventions--jsdoc-header-annotations)
  - [Chapter 3: Creating a State Manager](#chapter-3-creating-a-state-manager)
  - [Chapter 4: Creating a Platform Service](#chapter-4-creating-a-platform-service)
  - [Chapter 5: Building User-Space Applications](#chapter-5-building-user-space-applications)
  - [Chapter 6: Creating a Custom Shell Surface](#chapter-6-creating-a-custom-shell-surface)
  - [Chapter 7: Contributing Manifest Extensions](#chapter-7-contributing-manifest-extensions)
- [Part XIII — Platform Evolution History](#part-xiii--platform-evolution--series-17-history)
  - [Chapter 1: Series 1–4 — Core Platform Infrastructure](#chapter-1-series-14--core-platform-infrastructure)
  - [Chapter 2: Series 5 — Security Hardening & Session Isolation](#chapter-2-series-5--security-hardening--session-isolation)
  - [Chapter 3: Series 6 — Replaceable Desktop Shells & Widgets](#chapter-3-series-6--replaceable-desktop-shells--widgets)
  - [Chapter 4: Series 7 — Lifecycle Standardization, Service Semantics & SRP Audits](#chapter-4-series-7--lifecycle-standardization-service-semantics--srp-audits)
  - [Chapter 5: LDE 27.7.9 Platform Stable Baseline](#chapter-5-lde-2779-platform-stable-baseline)
  - [Chapter 6: Architectural Retrospective & Lessons Learned](#chapter-6-architectural-retrospective--lessons-learned)

---

# Part I — Introduction & Terminology

## Chapter 1: What is Lark OS?
Lark OS (LDE 27) is a modular, web-native desktop operating system environment designed around strict software engineering principles: Single Responsibility Principle (SRP), Dependency Inversion, Process Isolation, Scoped Authority Binding, and Separation of Presentation from State.

Built in vanilla JavaScript, CSS, and HTML5 without external dependencies, Lark OS runs entirely in browser runtimes while providing standard OS primitives: multi-user authentication, virtual filesystem storage, process table management, window compositing, background service orchestration, and package installation.

## Chapter 2: Design Philosophy & Architectural Goals
1. **Modularity**: Every component has a distinct responsibility. Managers own state, Services own APIs, Orchestrators coordinate multi-step workflows, and Shell Surfaces handle visual rendering.
2. **Security**: Applications execute in isolated process contexts. Service access is scoped, stripping out untrusted caller parameters.
3. **Replaceable Desktop Shell**: System capabilities belong to the platform layer. The visual shell (`LdeDesktopEnvironment`, `MinimalDesktopEnvironment`) is merely an orchestrated collection of presentation surfaces.
4. **Beginner Readability**: Code is explicit, well-structured, and avoids dense one-liners or unnecessary magic abstractions.

## Chapter 3: Platform Glossary & Core Terminology
- **Kernel**: Central bootstrapper (`kernel.js`) that initializes storage, state managers, and platform services.
- **Manager**: Low-level, headless container of mutable runtime state (`ProcessManager`, `WindowManager`).
- **Service**: Safe, high-level public API exposed to applications and shell components (`FileService`, `WindowService`).
- **Orchestrator**: Specialized workflow manager coordinating multi-service transitions (`BootOrchestrator`, `PackageInstallOrchestrator`).
- **Capability**: Token-based security wrapper granting authorized access to platform features (`CapabilityService`).
- **Shell Surface**: Visual UI component extending `ShellComponent` that observes Services and renders DOM elements (`WindowSurface`, `DialogSurface`).
- **Platform Environment**: System-owned runtime stage (Login, Lock, OOBE, Recovery, Welcome, Shutdown).
- **Desktop Environment**: Session-owned workspace shell (`LdeDesktopEnvironment`).
- **LRFS**: Lark Real Filesystem — virtualized storage hierarchy backed by `LocalStorageDriver`.

---

# Part II — System Architecture

## Chapter 1: The Layer Stack & Downward Dependency Law
Architecture dependencies flow strictly downward:

```text
Kernel
  ↓
Managers
  ↓
Services ── Orchestrators
  ↓
Capabilities
  ↓
Shell Components / Surfaces
  ↓
Applications
```

- **Rule**: Higher layers consume lower layers. Lower layers never import higher layers.
- **Rule**: Applications never access Managers or Kernel internals directly.
- **Rule**: Shell Surfaces subscribe strictly to Services and never import Managers directly.

## Chapter 2: The Kernel & Subsystem Bootstrapping
`Kernel.js` is the root OS process. During `bootstrap()`, it executes four ordered boot stages:
1. `initStorage()`: Mounts `LocalStorageDriver` and initializes `LRFS`.
2. `initManagers()`: Instantiates 29 headless platform state managers into `ServiceRegistry`.
3. `initServices()`: Instantiates platform services and orchestrators, registering them with `ServiceRegistry`.
4. `startApplications()`: Hands off execution to `BootOrchestrator.start()`.

## Chapter 3: Managers (State Owners) & The Terminal UI Test
Managers maintain system state tables (e.g. process tables, window geometry, user accounts).

### The Terminal UI Test
All Managers must manage pure, headless state and pass the Terminal UI Test:
> *"If I replaced the desktop with a terminal UI tomorrow, would this Manager still work?"*
If no (because it creates DOM elements or binds browser layout APIs), it owns rendering and violates SRP. Rendering belongs exclusively to **Shell Surfaces**.

## Chapter 4: Services (Public APIs & Observability Encapsulation)
Services consume Managers and Policies to expose safe public APIs. Services encapsulate kernel `EventBus` subscriptions by exposing semantic observation methods (`onFocused`, `onClosed`, `onDialogChanged`, `onChange`) returning clean unsubscribe closures.

## Chapter 5: Orchestrators (Workflow Coordinators)
Orchestrators coordinate complex, multi-service operations without owning persistent runtime state:
- `BootOrchestrator`: Manages system boot stage transitions (OOBE, Recovery, Login).
- `ShutdownOrchestrator`: Coordinates graceful service teardown and process termination.
- `UserEnvironmentOrchestrator`: Restores user profile settings (themes, widgets, wallpaper).
- `StartupApplicationOrchestrator`: Auto-starts user applications on login.
- `PackageInstallOrchestrator`: Handles package verification, extraction, and installation.

## Chapter 6: Capabilities & Security Providers
Applications interact with privileged features (clipboard, dialogs, network, process control) through `CapabilityService`. `CapabilityService` checks `SecurityPolicy` before returning a scoped `CapabilityProvider`.

## Chapter 7: Shell Components & Presentation Surfaces
Presentation surfaces extend `ShellComponent` and follow a standard lifecycle:
`initialize(registry, environment)` ➔ `mount(container)` ➔ `resume()` ➔ `suspend()` ➔ `destroy()`.
Shell Surfaces contain **zero business logic**—they merely render state exposed by Services.

## Chapter 8: Applications (User-space Executables)
User applications execute in isolated process contexts. Applications extend `BaseApplication` and compose `ApplicationComponent` instances, communicating exclusively through Services and Capabilities.

## Chapter 9: Platform Design Contracts
The platform enforces strict architectural design contracts across all subsystems:
1. **Service Capability Boundary**: Platform services expose high-level operating system capabilities, never procedural implementation steps or internal driver details.
2. **Downward Communication Rule**: Applications and environments communicate exclusively through platform services. They must never directly depend on low-level storage drivers (`LocalStorageDriver`, `IndexedDBStorageDriver`), managers, or kernel internals.
3. **Environments and Storage Isolation**: Platform environments and workflow step modules must never manipulate `LRFS` directly or import storage driver classes.
4. **Standard Result Object Policy**: All state-mutating or failure-susceptible domain operations across platform services return unified, canonical result objects constructed via `Result.success(data, message)` or `Result.failure(code, message)`:
   ```javascript
   {
       success: boolean,
       code: string | null,
       message: string | null,
       data: any | null
   }
   ```
5. **Getter vs Domain Operation Policy**: Standard Result Objects apply to operations that can succeed or fail (`login`, `createUser`, `launch`, `destroyVolume`). Pure read-only getters (`getCurrentSession`, `getUser`, `isLoggedIn`, `getInstalledApplications`) continue returning plain native values without wrapping.
6. **Error Code Stability Law**: Error codes (`AUTH_FAILED`, `USER_EXISTS`, `USER_NOT_FOUND`, `APP_NOT_FOUND`, `DISK_BLOCKED`) are stable public operating system APIs. Messages may change; error codes must remain immutable across future releases.
7. **Development Governance Update (Post-27.8.3)**: Standalone audit releases (`27.8.3.x`) are discontinued. Each completed implementation milestone concludes with a comprehensive architectural walkthrough (`walkthrough.md`) establishing permanent transparency.
8. **Browser Environment Facts**: Browser environment facts (quota, persistence status, origin storage usage) are runtime capabilities owned by the browser. They are never persisted inside virtual disk metadata and are queried exclusively through `BrowserStorageService`.

## Chapter 10: Series 27.8.4 — Guardian Platform Health Utility
Series 27.8.4 introduces **Guardian** (`sys.guardian`), a first-party, macOS-inspired platform health, integrity, and architecture verification utility.

### Architectural Taxonomy
Guardian strictly adheres to Lark OS's canonical platform taxonomy:
- **GuardianHistoryManager**: Headless state manager owning in-memory scan records and retention statistics.
- **GuardianService**: Registered in `ServiceRegistry`. Exposes public OS capabilities (`runStartupValidation()`, `runQuickScan()`, `runFullRegression()`) and handles disk persistence (`/system/guardian_history.json`).
- **GuardianOrchestrator**: Multi-step workflow orchestrator coordinating validation module execution.
- **GuardianValidationRegistry**: Pluggable registry containing `ValidationModule` implementations (`ArchitectureValidationModule`, `DiskIntegrityValidationModule`, `StorageHealthValidationModule`, `ConfigurationValidationModule`, `PerformanceValidationModule`).
- **Guardian Application (`sys.guardian`)**: Presentation surface rendering 7 Omni Design System tabs (**Overview**, **Scans**, **Performance**, **Storage**, **Events**, **History**, **Developer**).


---

# Part III — Boot System & Lifecycle

## Chapter 1: The Boot Pipeline (Architectural Invariant)
The Lark OS boot sequence is an architectural invariant:

```text
Boot ➔ Kernel ➔ Managers ➔ Services ➔ Platform Environment ➔ Shell Surfaces ➔ Applications
```

## Chapter 2: BootOrchestrator Mechanics
`BootOrchestrator` acts strictly as a **boot stage resolver**, resolving which Platform Environment owns the current boot stage without accumulating workflow business logic:
1. Evaluates boot mode parameters (`normal`, `recovery`, `oobe`).
2. Probes installation metadata (`/system/installation.json`). If missing, mounts `SetupPlatformEnvironment` (Installer).
3. Detects post-install state (`oobeCompleted === false`) and mounts `OobePlatformEnvironment` directly at the account creation wizard.
4. Executes `transitionTo(nextEnvironment)` to switch between Platform Environments (`Setup`, `OOBE`, `Login`, `Lock`, `Recovery`, `Shutdown`).

## Chapter 3: Platform Environments & Lifecycle Pipeline
Platform Environments execute **outside of the Desktop Environment** and inherit from `BasePlatformEnvironment`:

```text
Unprovisioned
        ↓
SetupEnvironment (Disk discovery, provisioning, installation completion, restart handoff)
        ↓
Restart
        ↓
OobeEnvironment (User creation, credential validation, security hint, personalization)
        ↓
LoginPlatformEnvironment (Authentication)
        ↓
DesktopEnvironment (Shell & User Applications)
```

- **`PlatformEnvironmentSurface`**: Programmatically generates a DOM hierarchy matching [indexer.html](file:///c:/Users/ar/Documents/GitHub/lark-desktop-environment%20-%20experimental/indexer.html) (`.platform-environment > div > div > div`) and consumes `platform.css`.
- **`SetupEnvironment`**: Form-driven installer environment orchestrating system disk installation. Must never create users or handle personalization.
- **`OobeEnvironment`**: Form-driven OOBE environment orchestrating user creation and initial personalization. Must never format disks or mount storage backends.
- **Platform Environment Independence Invariant**: Every Platform Environment is independently mountable and receives context purely from `BootOrchestrator` without assuming prior environment state.
- **Composition**: Platform Environments compose `DialogSurface` and `ContextMenuSurface` in `#platform-host`, ensuring OS prompts render cleanly outside the Desktop Shell.

## Chapter 4: Session Startup & User Environment Restoration
Upon successful user authentication in `Login.js`:
1. `SessionService.login(username)` initiates an active session.
2. `UserEnvironmentOrchestrator` restores user preferences (wallpaper, active theme, widgets).
3. `BootOrchestrator` mounts `LdeDesktopEnvironment`.
4. `StartupApplicationOrchestrator` launches pinned startup applications.

## Chapter 5: System Teardown & ShutdownOrchestrator
When a user or process requests system shutdown:
1. `PowerService.shutdown()` invokes `ShutdownOrchestrator`.
2. `ShutdownOrchestrator` terminates active user processes via `ProcessService`.
3. Suspends and destroys live environment sessions.
4. Transitions `#platform-host` to `ShutdownPlatformEnvironment`.

---

# Part IV — Desktop Environment & Shell Surfaces

## Chapter 1: Shell Philosophy & Composition
The Desktop Shell is an orchestrated composition of independent presentation surfaces. Desktop environments (`LdeDesktopEnvironment`, `MinimalDesktopEnvironment`) instantiate shell components based on policy and mount them into session containers.

## Chapter 2: LdeDesktopEnvironment vs MinimalDesktopEnvironment
- **`LdeDesktopEnvironment`**: Full-featured shell composing wallpaper, taskbar, dock, widgets, watermarks, search, context menus, modal dialogs, and window hosts.
- **`MinimalDesktopEnvironment`**: Lightweight diagnostic shell omitting taskbar and widgets for high-performance or recovery scenarios.

## Chapter 3: Presentation Model Pattern (LauncherModel to TaskbarSurface)
The Taskbar operates on a presentation model pattern: `ApplicationService` ➔ `Desktop` ➔ `LauncherModel` (State) ➔ `TaskbarSurface` (View). `TaskbarSurface` is a pure component that renders state provided by `LauncherModel`.

## Chapter 4: Windowing Subsystem (WindowManager & WindowSurface)
- `WindowManager`: Headless state manager owning window ID maps, positioning (`x, y, w, h`), z-order compositor, snapping, minimize/maximize state, and workspace assignments.
- `WindowSurface`: Shell Surface extending `ShellComponent` that instantiates visual `WindowFrame` components and mounts them to the active environment's `windowHost`.

## Chapter 5: Modal Dialog Subsystem (DialogManager & DialogSurface)
- `DialogManager`: Pure headless queue managing active dialog state (`{ title, message, type, modal, buttons }`).
- `DialogSurface`: Shell Surface that subscribes to `DialogService.onDialogChanged()`, rendering backdrop overlays, modal frames, input fields, and action buttons in `#lde-dialog-layer`.

## Chapter 6: Context Menu Subsystem (ContextMenuManager & ContextMenuSurface)
- `ContextMenuManager`: Headless state container holding active menu definitions.
- `ContextMenuSurface`: Shell Surface observing `ContextMenuService.onMenuChanged()`, positioning context menus at target coordinates, and delegating item selection back to `ContextMenuService.dismissMenu()`.

## Chapter 7: Notification Center & Toast Surface
`NotificationSurface` observes `NotificationService.onChange()`, rendering transient toast alerts in the top-right screen corner and queuing historical notifications in the slide-out Notification Center.

## Chapter 8: Widget Subsystem & Desktop Host Plane
`WidgetManager` tracks active widget configurations. `WidgetSurface` hosts widget UI instances in `#lde-widget-layer`, managing widget lifecycles (`mount`, `update`, `unmount`) without assigning separate process handles.

## Chapter 9: System Search & Command Palette
`SearchService` aggregates results from registered `SearchProvider` adapters. The Command Palette surface listens for `Ctrl+Space` shortcuts, streaming search results asynchronously as the user types.

## Chapter 10: Wallpaper Presentation Surface
`WallpaperSurface` renders wallpaper graphics (solid color, gradient, or image canvas) on the root desktop plane, listening for `ThemeService` preference updates.

## Chapter 11: Keyboard Shortcut Pipeline & Browser Compatibility Law
- **Browser Runtime Invariant**: Lark OS executes inside a web browser host environment. Host browser and operating system keyboard shortcuts take absolute precedence and cannot be overridden or bypassed by web applications.
- **Host-Reserved Shortcuts**: Shortcuts intercepted by the host browser or OS before reaching JavaScript (such as bare `Alt + Letter` combinations: `Alt+D` address bar, `Alt+F` menu, `Alt+E` edit) are designated as **Host-Reserved** and must never be relied upon by platform surfaces or applications.
- **Browser-Deliverable Shortcut Standard**: Core platform shortcuts must strictly consume combinations guaranteed to reach JavaScript capture phase listeners:
  - `Ctrl + Space` (Spotlight Command Palette)
  - `Ctrl + Backtick` / `Ctrl + Shift + Backtick` (Window Switcher MRU Cycle)
  - `Alt + Arrow` (Window Snap / Maximize / Minimize)
  - `Alt + Shift + Arrow` (Window Moving)
  - `Alt + Ctrl + Arrow` (Window Resizing)
  - `Alt + Shift + C` / `Alt + Home` (Window Center & Recovery)

---

# Part V — Process System & Package Management

## Chapter 1: Process Model & ProcessTable
`ProcessManager` maintains the system process table. Every running application process is assigned a Process Record (`pid`, `appId`, `username`, `sessionId`, `desktopEnvironmentId`).

## Chapter 2: Runtime Loader Strategies (Builtin vs LRFS)
`RuntimeLoaderService` resolves app code using strategy adapters:
- `BuiltinRuntimeLoader`: Imports native ES modules from relative repository paths.
- `LrfsRuntimeLoader`: Evaluates packaged JavaScript bundles directly from virtual storage (`/packages/`).

## Chapter 3: Package System (.ldepkg Architecture & PackageInstallOrchestrator)
Applications are distributed as `.ldepkg` archives containing package manifests, assets, and executable code. `PackageInstallOrchestrator` handles extraction, validation against `SdkVersionRule`, and mounting into `/packages/{appId}/`.

## Chapter 4: Application Database & Manifest Schema
`ApplicationDatabaseManager` maintains installed application manifests (`appId`, `name`, `version`, `icon`, `exec`, `permissions`, `extensions`).

## Chapter 5: Application Intent Routing & Singleton Revivals
`ApplicationIntentService` routes semantic intents (`open-file`, `edit-text`). If an intent targets a running single-instance app, `ApplicationIntentService` focuses the existing window rather than spawning a duplicate process.

---

# Part VI — Virtual Filesystem (LRFS)

## Chapter 1: Virtual Filesystem (LRFS) & Storage Drivers
LRFS (Lark Real Filesystem) provides a POSIX-like virtual directory tree. Low-level I/O is handled by storage drivers (`LocalStorageDriver`, `IndexedDBStorageDriver`).
- **`LocalStorageDriver`**: Synchronous key-value driver for LocalStorage disks (`lde27_disk_*`).
- **`IndexedDBStorageDriver`**: Transactional block storage driver for IndexedDB databases (`lde27_indexeddb_disk`).
- **`StorageDiscoveryService`**: Read-only platform service inspecting available `LocalStorage` keys and `IndexedDB` block database metadata.
- **`VirtualDiskService`**: Provisioning service managing disk creation, formatting, and database wiping.

## Chapter 2: Directory Taxonomy (/system, /users, /packages, /tmp)
- `/system/`: Read-only system configuration and default themes.
- `/users/{username}/`: Isolated user home directories (`Desktop`, `Documents`, `Settings`).
- `/packages/`: Installed application binaries and package assets.
- `/tmp/`: Transient session files cleared on reboot.

## Chapter 3: Path Resolution & Security Policy Evaluation
All file access requests pass through `SecurityPolicy.canAccessPath(context, path, mode)`. Unauthorized path access throws security access exceptions.

## Chapter 4: Scoped FileService & Process Sandboxing
`ProcessService` provides applications with a `ScopedFileService` wrapper. The wrapper automatically binds the process's `pid` and home directory boundaries, preventing user-space processes from accessing other users' files.

---

# Part VII — Security, Capabilities & Authorization

## Chapter 1: Security Model & Privilege Contexts
Lark OS enforces multi-level security context objects (`{ pid, username, role }`). Roles include `SYSTEM`, `ADMIN`, and `USER`.

## Chapter 2: Capability Framework & Providers
Features requiring user authorization (file picker, process control, notifications) are exposed through `CapabilityProvider` adapters.

## Chapter 3: Scoped Service Registry & Identity Binding
During process spawning, `ProcessService` constructs a `ScopedServiceRegistry` for the child process. Wrappers strip out caller-supplied `pid` options, guaranteeing identity spoofing protection.

## Chapter 4: Package Trust Evaluation
`TrustService` verifies cryptographic signatures and publisher identity manifests before package installation.

## Chapter 5: Recovery Mode & Diagnostic Safe Guards
If system boot fails, `RecoveryManager` triggers `RecoveryPlatformEnvironment`, allowing users to restore disk snapshots or perform system resets safely.

---

# Part VIII — Event System & Observability

## Chapter 1: SystemEventBus Architecture
`SystemEventBus` is an asynchronous pub-sub event bus enabling decoupled system communication.

## Chapter 2: Event Naming Conventions
Events follow lowercase dot-notation (`domain.action`): `window.created`, `process.started`, `dialog.changed`, `session.ended`.

## Chapter 3: Single Authoritative Emitter Invariant
Every domain event has exactly one authoritative emitter service.

## Chapter 4: Semantic Subscription API Patterns
Services expose subscription methods returning unsubscribe closures:
```javascript
const unsub = windowService.onFocused((win) => { ... });
// Clean up
unsub();
```

## Chapter 5: LogManager & BootLogger Pipeline
`LogManager` maintains in-memory log rings categorized by severity (`INFO`, `WARN`, `ERROR`). `BootLogger` tracks millisecond boot stage benchmarks during initial startup.

---

# Part IX — User Sessions & Personalization

## Chapter 1: Session State Machine (Active, Suspended, Ended)
`SessionManager` maintains active user session records. Sessions transition through `ACTIVE`, `SUSPENDED` (locked/switched), and `ENDED` states.

## Chapter 2: User Account Administration (UserManager & UserProfileService)
`UserManager` manages user identity records (`username`, `role`, `passwordHash`). `UserProfileService` handles customizable profile attributes (display name, avatar).

## Chapter 3: Theme Framework & CSS Variables
`ThemeService` applies system CSS variable tokens (`var(--lde-bg-base)`, `var(--lde-accent)`) dynamically to `document.documentElement`.

## Chapter 4: User Preference Persistence (UserSettingsManager)
User preference mutations (wallpaper path, theme preference, desktop icon layout) are saved automatically to `/users/{username}/Settings/preferences.json`.

## Chapter 5: Startup Application Orchestrator
Upon session activation, `StartupApplicationOrchestrator` queries user startup preferences and launches designated applications automatically.

---

# Part X — UI Framework & Presentation Layer

## Chapter 1: Shell CSS Design System
The OS UI uses Vanilla CSS structured into CSS design tokens (`theme.css`) and glassmorphism presentation rules (`omni.css`).

## Chapter 2: Omni UI Framework vs Shell Independence
Omni (`lark/ui/`) provides application component primitives (buttons, text inputs, cards). Shell Surfaces (`lark/platform/desktop/shell/`) provide OS UI containers. The Shell never imports Omni components.

## Chapter 3: DOM Compositing & Z-Index Layering Planes
- `#desktop-host`: Root desktop plane (z-index: 0).
- `#window-host`: Application window frames (z-index: 100+).
- `#platform-host`: System overlay plane (z-index: 9000).
- `#lde-dialog-layer`: Modal dialog overlays (z-index: 99990).
- `#lde-context-menu-layer`: Context menu overlays (z-index: 99980).

## Chapter 4: Micro-Animation Guidelines
CSS cubic-bezier transitions (`cubic-bezier(0.2, 0.9, 0.3, 1.1)`) drive smooth window opening, dialog popups, and surface slides.

---

# Part XI — Stable Public Platform APIs Reference

## Chapter 1: WindowService
**STABLE PUBLIC PLATFORM API (v1)**
- `createWindow(options)`: Request a new window (`{ id, contentElement }`).
- `focusWindow(id)`: Bring window to front.
- `closeWindow(id)`: Close window.
- `minimizeWindow(id)` / `restoreWindow(id)`: Minimize or restore window.
- `onFocused(callback)` / `onClosed(callback)`: Semantic observers.

## Chapter 2: DialogService
**STABLE PUBLIC PLATFORM API (v1)**
- `alert(message, title)`: Promise<boolean> modal alert.
- `confirm(message, title)`: Promise<boolean> modal confirmation.
- `prompt(message, defaultValue, title, inputType)`: Promise<string|null> input prompt.
- `openFile(options)` / `saveFile(options)` / `openDirectory(options)`: System file pickers.
- `onDialogChanged(callback)`: Semantic observer.

## Chapter 3: ApplicationService
**STABLE PUBLIC PLATFORM API (v1)**
- `getInstalledApplications()`: List installed applications.
- `getApplication(appId)`: Get application manifest.
- `hasApplication(appId)`: Check if app exists.

## Chapter 4: NotificationService
**STABLE PUBLIC PLATFORM API (v1)**
- `post(options)`: Dispatch OS notification (`{ title, message, icon }`).
- `dismiss(id)`: Dismiss active notification.
- `onChange(callback)`: Semantic observer.

## Chapter 5: ProcessService
**STABLE PUBLIC PLATFORM API (v1)**
- `spawnProcess(appId, options)`: Spawn new application process.
- `terminateProcess(pid)`: Terminate process.
- `getProcess(pid)` / `getProcesses()`: Query process table.
- `onStarted(callback)` / `onTerminated(callback)`: Semantic observers.

## Chapter 6: FileService
**STABLE PUBLIC PLATFORM API (v1)**
- `readFile(path)`: Read file string.
- `writeFile(path, content)`: Write file string.
- `deleteFile(path)`: Delete file.
- `exists(path)`: Check file existence.
- `readDirectory(path)`: List directory contents.

## Chapter 7: CapabilityService
**STABLE PUBLIC PLATFORM API (v1)**
- `get(capabilityId)`: Request capability token.
- `has(capabilityId)`: Check capability availability.

## Chapter 8: SessionService
**STABLE PUBLIC PLATFORM API (v1)**
- `login(username)`: Initiate user login.
- `logout()`: Terminate active session.
- `getCurrentSession()`: Get active session record.
- `onStarted(callback)` / `onEnded(callback)`: Semantic observers.

## Chapter 9: Experimental & Internal Subsystem APIs
- `WidgetService`: Widget management.
- `DesktopEnvironmentService`: Environment instance control.
- `ThemeService`: Dynamic CSS variable application.
- `ExtensionService`: Extension discovery.

---

# Part XII — Development Guide & Extension Standards

## Chapter 1: Repository Directory Organization
```text
lark/
  ├── 0-firmware/    # Hardware inventory & VM identity
  ├── 1-kernel/      # Kernel core, bootloader & drivers
  ├── 2-storage/     # LRFS virtual filesystem & storage drivers
  ├── 3-system/      # SystemVersion, constants & error taxonomy
  ├── 4-policies/    # SecurityPolicy & InputPolicy
  ├── 5-platform/    # Managers, services, orchestrators & shell surfaces
  ├── 6-apps/        # User-space system & user applications
  ├── 7-sdk/         # Developer SDK & manifest builders
  ├── 8-developer/   # Developer stubs & quality placeholders
  └── 9-ui/          # Omni UI framework, theme.css & omni.css
```

## Chapter 2: Coding Conventions & JSDoc Header Annotations
Every core class must begin with a JSDoc header detailing:
```javascript
/**
 * ClassName
 *
 * STABLE PUBLIC PLATFORM API (LDE 27.7.9)
 *
 * Responsibility:
 * Clear 1-2 sentence description of single responsibility.
 *
 * Does NOT:
 * - List of explicit non-goals.
 */
```

## Chapter 3: Creating a State Manager
1. Place class in `lark/platform/{domain}/{Name}Manager.js`.
2. Ensure constructor initializes pure headless state maps/arrays.
3. Verify it passes the **Terminal UI Test** (no DOM or rendering logic).
4. Register in `kernel.js` under `initManagers()`.

## Chapter 4: Creating a Platform Service
1. Place class in `lark/platform/{domain}/{Name}Service.js`.
2. Pass required Manager and `ServiceRegistry` dependencies in constructor.
3. Expose safe public methods and return unsubscribe closures for semantic event observers.
4. Register in `kernel.js` under `initServices()`.

## Chapter 5: Building User-Space Applications
1. Create application manifest in `lark/apps/{appName}/manifest.json`.
2. Extend `BaseApplication` and compose `ApplicationComponent` modules.
3. Execute operations strictly via `FileService`, `WindowService`, and `CapabilityService`.

## Chapter 6: Creating a Custom Shell Surface
1. Create surface class in `lark/platform/desktop/shell/{Name}Surface.js` extending `ShellComponent`.
2. Implement `initialize()`, `mount()`, `resume()`, `suspend()`, and `destroy()`.
3. Subscribe strictly to Service semantic observers in `resume()`. Do NOT import Managers.

## Chapter 7: Contributing Manifest Extensions
Applications contribute system extensions via their manifest:
```json
{
  "extensions": [
    { "type": "search-provider", "entry": "SearchProvider.js" },
    { "type": "widget", "entry": "WidgetComponent.js" }
  ]
}
```

---

# Part XIII — Platform Evolution History

## Chapter 1: Series 1–4 — Core Platform Infrastructure
- **Series 1**: Domain-first repository structure, LRFS virtual filesystem, and initial desktop shell.
- **Series 2**: LocalStorage driver integration, path resolution, and security authorization rules.
- **Series 3**: BaseApplication framework, process tables, application intents, and package manifests.
- **Series 4**: Desktop environment abstraction, capability providers, and scoped service registries.

## Chapter 2: Series 5 — Security Hardening & Session Isolation
- Introduced `SecurityPolicy` evaluation context, multi-user authentication (`SessionManager`), process sandboxing via `ScopedServiceRegistry`, and implicit authority parameter stripping.

## Chapter 3: Series 6 — Replaceable Desktop Shells & Widgets
- Refactored graphical shell into pluggable environments (`LdeDesktopEnvironment`, `MinimalDesktopEnvironment`). Introduced presentation model pattern (`LauncherModel`) and widget host plane.

## Chapter 4: Series 7 — Lifecycle Standardization, Service Semantics & SRP Audits
- **Series 7.7.7**: Standardized Service semantic event observers (`onFocused`, `onClosed`) and introduced system `Orchestrator` classes (`BootOrchestrator`, `PackageInstallOrchestrator`).
- **Series 7.7.8**: Executed 29-Manager SRP Audit using the Terminal UI Test. Extracted rendering violations into Shell Surfaces (`WindowSurface`, `DialogSurface`, `ContextMenuSurface`).

## Chapter 5: LDE 27.7.9 Platform Stable Baseline & 27.8.1.x Evolutions
- Established frozen Platform Stable Baseline (27.7.9).
- Mounted modal surfaces across platform environments (`BasePlatformEnvironment`).
- Locked public platform API contracts and single event emitter ownership rules.
- **Series 27.8.1.2 Audit Remediation & UI Polish**:
  - **Windowing Animations**: Added fluid swing `cubic-bezier` keyframe animations (`ldeWindowOpen`, `ldeWindowClose`) for window open and close actions.
  - **Start Menu Retirement**: Retired legacy taskbar launcher menu in favor of Spotlight system search (`CommandPalette`).
  - **Tab Navigation & CSS**: Fixed tab selection and pointer event propagation across `.comp-sidebartab` and `.comp-tab-button` components.
  - **OOBE Lifecycle Finish**: Updated OOBE finish action to trigger full system restart (`PowerService.reboot()`) before mounting the login environment.
- **Series 27.8.1.3 Subsystem Polish & Standardization**:
  - **Generalized Opening Animations**: Generalized animation keyframes to `ldeFluidOpen`/`ldeFluidClose` and applied fluid opening animation across `WindowFrame`, Spotlight Search (`CommandPalette`), and `ContextMenuSurface`.
  - **Sidebar Storage Item Race Condition**: Fixed asynchronous rendering race condition in File Manager (`updateSidebar`) that caused duplicate Storage items.
  - **CSS Progress Bar**: Updated global progress bar height to 2px in `omni.css`.
  - **Recovery Environment Standardization**: Migrated `Recovery.js` to consume `PlatformEnvironmentSurface` canonical DOM hierarchy (`.platform-environment`).
  - **Terminal Commands**: Updated `users` command (`UserService.getUsers()`) and `disk` command (`FileService.getStorageInfo()`).
- **Series 27.8.1.4 Visual Refinements & Quota Corrections**:
  - **Fluid Fade Animations & Spotlight BlurIn**: Enhanced `@keyframes ldeFluidOpen` / `ldeFluidClose` with opacity scaling, and introduced dedicated `@keyframes ldeBlurIn` animation (`filter: blur(12px)` to `0px` in `0.5s ease`) for Spotlight Search.
  - **Glassmorphic Surface Blur & Saturation**: Enforced combined `backdrop-filter: blur(12px) saturate(2)` across Spotlight, Context Menu, and Taskbar surfaces.
  - **Window Controls Icon Glyphs**: Enclosed window control glyph labels inside `<i>` elements in `WindowFrame._createBtn` to ensure Segoe Fluent Icons load properly.
  - **Settings Account Profile**: Completely removed the 'Avatar URL' configuration field and update handler from `Settings.js`.
  - **Activity Monitor (TaskManager)**: Reordered navigation to place Performance at top of sidebar, set Performance as default tab, and set update cycle interval to 2 seconds.
  - **Storage Driver Quota Alignment**: Fixed LocalStorageDriver to return fixed 5MB capacity (5,242,880 bytes) instead of defaulting to browser origin quota (~10GB), and fixed Finder footer formatting to prevent `"null B"` outputs.
  - **Workspace Application Window Isolation**: Defined `.workspace-hidden` display rules and bound `WindowManager` window creation and reconciliation to hide non-active workspace windows cleanly.
- **Series 27.8.1.5 Glass Effects & System Recovery Reset**:
  - **Translucent Glass Blur**: Updated Taskbar and Context Menu background colors to translucent alpha channels (`rgba(20, 20, 20, 0.75)` and `rgba(26, 26, 26, 0.85)`), allowing `backdrop-filter: blur(12px) saturate(2)` to blur underlying desktop elements cleanly.
  - **Window Animation Cleanup**: Added `.opened` class assignment on `ldeFluidOpen` completion in `WindowFrame.js` and defined `.lde-window-frame.opened { animation: none !important; }` in `theme.css` to prevent windows from reanimating during workspace switching. Stripped `.opened` prior to applying `.closing` with `!important` rule to guarantee fluid exit animations execute on window close.
  - **System Recovery Reset PC**: Upgraded `Recovery.js` with an interactive "Reset this PC" workflow that presents a confirmation modal, wipes local storage and virtual disk volumes, and reboots back into the initial setup environment (OOBE).
- **Series 27.8.1.6 UI Glass Refinements & Step Context Icons**:
  - **Task Manager Live Refresh**: Removed unnecessary sidebar DOM teardown from the `safeUpdate` loop in `TaskManager.js` and enabled `triggerRefresh()` to update performance graphs, process tables, and session tables live every 2 seconds.
  - **Glass Frames & Borders**: Updated Taskbar and Context Menu to background `#10101080` and border `#80808010` to make backdrop blur pop.
  - **Active State Fill & Typography**: Updated `.comp-sidebartab.active` to use background fill `#80808010` and normal font weight (`font-weight: normal`). Removed taskbar item border-radius and bold font weights on active states across the system.
  - **Recovery Platform Standardization & Execution**: Refactored `Recovery.js` to use pure platform environment markup (`.omni-card-v`, `.radio`, `.layout-h`, `.layout-v`). Enhanced `DialogSurface` with `_syncEnvironmentMetadata()` to dynamically derive `data-environment-type` from active environment state (obeying SRP without hardcoded strings), allowing `InputPolicy` to validate modal events cleanly across all environments.
  - **Step Context Icons**: Audited and updated all platform environment step header icons (`welcomeStep`, `diskCheckStep`, `createDiskWizardStep`, `virtualDiskCreatedStep`, `installedConfirmationStep`, `oobeNameStep`, `oobePasswordStep`, `oobeConfirmPasswordStep`, `oobeHintStep`, `setupCompleteStep`) to match their specific context.
  - **Advanced Startup Reboot Confirmation**: Added `DialogService.confirm` shell dialog prompts in `Settings.js` before restarting into Recovery Mode or Safe Mode to inform users of the destination environment prior to execution.
- **Series 27.8.1.7 Multi-Disk Selection & OOBE UI Fillers**:
  - **Unlimited Pending LocalStorage Disks**: Refactored `createDiskWizardStep.js` and `diskCheckStep.js` to store pending unprovisioned disks in `ctx.pendingDisks`, allowing users to create multiple pending LocalStorage virtual drives and select between them before installation.
  - **IndexedDB Disk Selection Constraint**: Restricted creation of new IndexedDB virtual disks when an IndexedDB volume exists in disk selection (provisioned or pending in `ctx.pendingDisks`). Removing the disk from disk selection re-enables creation, while LocalStorage disk creation remains unlimited.
  - **OOBE Paragraph Fillers & Right-Aligned Button Layouts**: Audited and added descriptive `<p>` filler paragraphs under section headers across all OOBE steps (`oobeNameStep`, `oobePasswordStep`, `oobeConfirmPasswordStep`, `oobeHintStep`, `createDiskWizardStep`), added Back navigation buttons to all OOBE steps (excluding `setupCompleteStep`), and updated `platform.css` to enforce right-alignment (`align-self: flex-end; justify-content: flex-end;`) across all platform step button groups.
- **Series 27.8.1.8 Reboot Transition Hardening**:
  - **Login Environment Flash Prevention**: Updated `PowerService.reboot()` to transition to `ShutdownPlatformEnvironment` before terminating user processes and logging out sessions, preventing `BootOrchestrator` from triggering a split-second flash of `LoginPlatformEnvironment` before page reload.
- **Series 27.8.2 Kernel Architecture Review & SOLID Compliance Freeze**:
  - **Kernel Handoff & Boundary Audit**: Verified that pre-kernel startup (`BootLoader` -> `BootSplash` -> `Kernel`), state managers (`LogManager`, `WindowManager`, `DialogManager`, `SessionManager`, `UserManager`), and platform services strictly satisfy SRP and OCP contracts without business logic contamination.
  - **Logging Lifecycle Validation**: Audited the complete logging pipeline from early `BootLogger` CSS-styled console buffering, through single-pass `BootLogger.flush(logService)` transfer into `LogManager`, to post-handoff `BootLogger.deactivate()` enforcement.
  - **Manager Deduplication**: Resolved a duplicate `UserManager` instantiation artifact in `kernel.initManagers()`, confirming single canonical state ownership across all 24 registered platform managers.
- **Series 27.8.3 Developer Platform Architecture Validation Harness (AVA)**:
  - **Developer Validation Suite (`PlatformArchitectureValidation.js`)**: Implemented a self-contained 8-stage architecture validation harness in `lark/developer/PlatformArchitectureValidation.js` to stress-test capability isolation, service boundary encapsulation, ScopedRegistry property exposure, process boundary isolation, EventBus resilience, Result schema standard compliance, defensive input contracts, and asynchronous failure containment.
  - **Telemetry & Scorecard Report**: Emits a version-aware diagnostic report containing stage results (`PASS`/`WARNING`/`FAIL`), platform event counts, and an Architecture Integrity Scorecard.
  - **System App Registration (`sys.architecturevalidation`)**: Registered `ArchitectureValidationApp.js` in `AppRegistry.js` as a built-in system developer application (`🛡️ Architecture Validation`), allowing developers to launch and execute the suite directly from the Desktop App Launcher and Search.
- **Series 27.8.4 — Guardian Subsystem**:
  - **Purpose & Long-Term Goal**: Guardian is Lark OS's built-in platform health, integrity, and continuous architecture verification utility (`sys.guardian`). Promoted from a developer harness into a first-class OS capability, Guardian continuously monitors platform invariants, verifies LRFS disk structure, retains scan history, and alerts users to system degradation. Its long-term goal is to serve as the OS integrity daemon, orchestrating background diagnostics, disk health checks, contract regression audits, and automated recovery triggers.
  - **Subsystem Architecture**:
    - `GuardianService` (`lark/platform/guardian/GuardianService.js`): Public OS service registered in `ServiceRegistry`. Coordinates startup scans on `desktop.ready`, dispatches system notifications, and manages `/system/guardian_history.json` persistence.
    - `GuardianOrchestrator` (`lark/platform/guardian/GuardianOrchestrator.js`): Workflow coordinator constructing canonical `ValidationContext` instances and executing validation modules.
    - `GuardianHistoryManager` (`lark/platform/guardian/GuardianHistoryManager.js`): Headless state manager owning in-memory scan records (satisfies the Terminal UI Test).
    - `GuardianValidationRegistry` (`lark/platform/guardian/GuardianValidationRegistry.js`): Registry container enabling Open-Closed Principle (OCP) module discovery.
    - **Pluggable Validation Modules** (`lark/platform/guardian/modules/*`): `ArchitectureValidationModule`, `DiskIntegrityValidationModule`, `StorageHealthValidationModule`, `ConfigurationValidationModule`, `PerformanceValidationModule`.
  - **Canonical Omni Native Shell**:
    - [Guardian.js](file:///c:/Users/ar/Documents/GitHub/lark-desktop-environment%20-%20experimental/lark/apps/system/Guardian.js) uses 100% exact DOM architecture from `Settings.js` (`omni-layout-row` root, `omni-panel-1` sidebar nav, `omni-panel-2` viewport with `layout-max-w-512px`, and `omni-panel-3` Diagnostic Inspector). ZERO inline CSS styles.
  - **Startup Application Intent Registration**:
    - Declares `guardian.scan` startup intent in `AppRegistry.js` and normalizes manifest properties in `ApplicationDatabaseService.js`, registering Guardian under **Settings -> Startup Applications**.
- **Series 8 — Universal 3-Panel Omni Shell Standardization & Subsystem Health Milestone**:
  - **Universal Omni 3-Panel Standard**: Frozen the canonical 3-Panel Omni Application Shell architecture (`omni-layout-row` root, `omni-panel-1` sidebar navigation, `omni-panel-2` center content viewport with `layout-max-w-512px`, and `omni-panel-3` Diagnostic / Detail Inspector) across all native Lark OS system applications (`sys.settings`, `sys.eventviewer`, `sys.guardian`, `sys.activitymonitor`).
  - **Platform Health Subsystem Freeze**: Fully validated **Guardian** (`sys.guardian`) platform health service and **Activity Monitor** (`sys.activitymonitor`) live telemetry engine with 100% PASS scores across capability isolation, disk integrity audits, process delegation, and contract validation suites.
- **Series 27.8.14 — Deterministic Execution Law & Implicit Fallback Remediation**:
  - **Constitutional Amendment (Section 17 - Deterministic Execution Law)**: Amended `docs/constitution.md` with Section 17, mandating that every architectural component must either fulfill its documented contract or fail explicitly through the platform error pipeline. Prohibited silent fallbacks (`|| []`, `|| {}`, `?? default`, `|| new Class()`, or swallowed catch blocks) that disguise missing dependencies or broken execution paths.
  - **OS Error Taxonomy (`lark/3-system/errors/LarkErrors.js`)**: Established formal OS Error Taxonomy defining `LarkBaseError`, `KernelError` (`ContractViolationError`, `ServiceRegistrationError`, `DriverInitializationError`, `BootStageError`), and `RuntimeError` (`FileNotFoundError`, `PermissionDeniedError`, `NetworkOfflineError`, `PackageNotFoundError`).
  - **Deterministic ServiceRegistry (`lark/1-kernel/ServiceRegistry.js`)**: Updated `ServiceRegistry.get(name)` to throw `ServiceRegistrationError` when an unregistered service is requested, eliminating defensive checks across user-space and platform code.
  - **Developer Audit Toolkit Fallback & Orphan Auditors (`fallback_audit.py`, `orphan_audit.py`)**: Introduced `python tools/audit/audit.py fallbacks` to detect non-deterministic fallback patterns (remediated 51 violations down to 0) and `python tools/audit/audit.py orphans` to detect unlinked platform environments, unregistered apps, and abandoned policies. Removed deprecated `TextEdit.js` and `ArchitectureValidationApp.js`.
- **Series 27.8.15 — Developer Platform & Self-Describing Skills Subsystem**:
  - **Developer Platform CLI (`tools/developer/dev.py`)**: Established the unified Developer Platform CLI and modular **Developer Skills Subsystem** (`tools/developer/skills/`), providing read-only architectural understanding, code reviewing, and pre-flight developer tools without mutating source files.
  - **Constitutional Amendment (Section 20 - Developer Assistance Principle)**: Amended `docs/constitution.md` with Section 20, establishing that developer tools exist to reduce cognitive load rather than architectural rigor, and must never weaken constitutional guarantees or modify source code automatically.
  - **Developer Skills Engine**: Integrated 6 self-describing skills: `explain` (AI context explainer), `before` (pre-implementation checklist), `inspect` (360° symbol profiling & Architecture Confidence score), `review` (5-star Beginner Readability & SOLID scorecard), `identifier` (variable naming clarity inspector with whitelisting), and `metrics` (codebase LOC, layer density, governance coverage & historical growth timeline).
- **Series 27.8.16 — Architectural Baseline Freeze & Series 8 Milestone**:
  - **Series 8 Canonical Engineering Baseline**: Frozen the canonical architecture of Lark OS 27 (Series 8) with 100% PASS scores across all 8 constitutional auditors (`architecture`, `dependencies`, `services`, `assets`, `manifest`, `api`, `fallbacks`, `orphans`).
  - **Full Developer Platform Integration**: Fully validated `python tools/developer/dev.py` across 7 developer skills (`explain`, `before`, `inspect`, `review`, `identifier`, `metrics`, `audit`), achieving 0 orphan components, 0 fallback violations, and 29,541 lines of code across 257 modules.
  - **ProcessService & Notepad Intent Handoff Hotfix**: Resolved process options propagation in `ProcessService.js` and launch intent parsing in `Notepad.js`, restoring document opening from `FileManager`.
- **Series 27.8.17 — Engineering Knowledge Bundle & Temporary Isolation**:
  - **Engineering Knowledge Data Document (`data/walkthrough_history.json`)**: Introduced versioned canonical data document (`schemaVersion: 1`) storing release walkthroughs, engineering notes, and retrospectives.
  - **Knowledge Viewer App (`sys.walkthrough` / `KnowledgeViewer.js`)**: Built read-only, disposable 2-panel Omni presentation viewer (`KnowledgeViewer.js`) mapped to `sys.walkthrough`.
  - **Constitutional Amendments (Sections 21, 21.1 & 21.2)**: Amended `docs/constitution.md` with Section 21 (*Temporary Feature Isolation Principle*), Section 21.1 (*No Architectural Gravity*), and Section 21.2 (*Constitutional Sunset Clause*).
  - **Stricter Orphan Auditor (`TEMPORARY_FEATURE_GRAVITY`)**: Updated `orphan_audit.py` to inspect applications marked `"temporary": true` and emit a `TEMPORARY_FEATURE_GRAVITY` audit failure if any production module in `lark/` attempts to import a temporary feature.
- **Series 27.8.18 — Window Snapping & Declarative Logic Convention**:
  - **Native Window Snapping**: Implemented native window snapping (Left Half, Right Half, Top Maximize) directly inside `WindowService` and `WindowManager`.
  - **Constitutional Amendment (Section 22 - Declarative Logic Convention)**: Amended `docs/constitution.md` with Section 22, requiring pure top-level declarative geometry formulas (`formula_snapLeft`, `formula_snapRight`, `formula_snapMaximize`, `formula_detectSnapZone`).
  - **Translucent Snap Preview**: Added disposable translucent preview overlay (`.lde-snap-preview`) and preserved original floating bounds (`winState.saved`) for clean window restoration.
- **Series 27.8.19 — Architectural Flow Tracing Skill**:
  - **Architectural Flow Tracer (`tools/developer/skills/skill_trace.py`)**: Built `dev.py trace <Symbol>` skill statically analyzing ES module imports, ServiceRegistry lookups, EventBus emissions, formulas, and delegate methods to output ASCII call/event flow graphs.
  - **Series 27.8.20 — Hardware Capability Gating & Driver Integrity Audit**:
  - **Constitutional Amendment (Section 24 - Hardware Capability Gating Principle)**: Amended `docs/constitution.md` with Section 24, establishing that platform services must consume hardware state exclusively through Kernel Drivers (`DisplayDriver`, `AudioDriver`, `NetworkDriver`, `StorageDriver`).
  - **Hardware Domain Routing Audit**: Enforced 4-tier simulation pipeline (Firmware Adapter $\rightarrow$ Kernel Driver $\rightarrow$ Kernel Handle $\rightarrow$ Platform Service) across Display (`WindowService`, `WallpaperService`), Audio (`NotificationService`), Network (`NetworkService`, `DownloadService`), and Storage (`StorageBootstrap`, `LRFS`).
- **Series 27.8.21 — Presentation Integrity Audit & Semantic Rendering Law**:
  - **Constitutional Amendment (Section 25 - Presentation Integrity Principle)**: Amended `docs/constitution.md` with Section 25, Section 25.1 (Semantic Styling Law), Section 25.2 (No Inline Appearance Style Law), and Section 25.3 (Trusted Rendering Law).
  - **9th Constitutional Auditor (`tools/audit/presentation_audit.py`)**: Built automated presentation auditor inspecting inline appearance styles, unsafe HTML/XSS injection patterns, and semantic Omni Framework CSS class usage.
  - **Developer Skill Extension (`tools/developer/skills/skill_review.py`)**: Extended `dev.py review` with visual Presentation Integrity Scorecards.
- **Series 27.9 — Centralized Presentation Effects Framework & Governance**:
  - **PresentationEffectsService**: Headless platform policy engine evaluating motion and visual blur policies, emitting semantic presentation intents (presentation.policy.changed).
  - **DisplayGraphicsDriver**: Layer 1 kernel driver probing browser hardware acceleration and backdrop filter support.
  - **PresentationEffectsBridge**: Browser renderer adapter synchronizing semantic CSS root variables (--lde-glass-backdrop-filter, --lde-window-transition-duration).
- **Series 10 — Window Management Experience Completion, Stabilization & Omni Migration (27.10.12.3, Build 84)**:
  - **8-Way Window Resizing & Clamping**: Built 8-axis resize handles and visible titlebar screen boundary clamping in `WindowManager.js`.
  - **MRU Focus History Stack**: Implemented `mruFocusStack` window tracking exposed via public `WindowService.getMRUWindowList()`.
  - **Unified Pointer Events Architecture**: Standardized window interaction pipelines across mouse, touch, pen, and trackpad using W3C Pointer Events.
  - **Alt+Tab / Ctrl+Backtick Window Switcher**: Built `WindowSwitcherSurface` overlay for transient MRU window cycling with pure Omni CSS styling.
  - **Canonical Workspace Architecture**: Preserved underlying multi-workspace engine (`WorkspaceManager`, `WorkspaceService`, window assignment APIs, session restoration, and MRU infrastructure).
  - **Keyboard Input Normalization & Capture**: Normalized keyboard key/code layout handling in `InputPolicy._normalizeKeyEvent(e)` (`isBackquote`, `isArrow`, `isNavKey`) ensuring reliable global shortcut capture across international keyboards.
  - **Omni Design System Migration (`omni.css`)**: Removed inline presentation styling and migrated `WindowSwitcherSurface` CSS rules into `omni.css`, enforcing monochrome palette, SFI iconography (`<i>&#xE737;</i>`), and removing glow effects/colored accents (`--lde-accent`).
  - **Presentation Effects Integration**: Consumed `PresentationEffectsService.getMotionPolicy('general')` for motion timing, easing, and translucency policies across shell surfaces.
  - **Session Restoration & Window Rules**: Integrated per-app geometry/workspace rules and delayed post-initialization window session restoration in `UserEnvironmentOrchestrator.js`.
  - **Platform Milestone**: Advanced Lark OS version to `27.10.12.3` (Build 84). Mission Control presentation surface deferred to a future Omni UI shell series.
- **Series 10 — Experimental On-Screen Keyboard Surface (27.10.13, Build 85)**:
  - **OnScreenKeyboardSurface**: Built floating software keyboard shell surface (`OnScreenKeyboardSurface.js`) subscribing to `experimental.osk.*` namespace events (`toggle`, `show`, `hide`).
  - **Platform-Agnostic Layout Data**: Created `KeyboardLayouts.js` (`US_QWERTY`) under `lark/5-platform/input/` with semantic key categories (`character`, `modifier`, `system`, `navigation`, `editing`).
  - **Modern Standard Selection & Range Injection**: Implemented text input pipeline using `selectionStart`/`selectionEnd` for `<input>`/`<textarea>` and W3C `Selection`/`Range` APIs for `contenteditable`, dispatching `beforeinput` $\rightarrow$ text mutation $\rightarrow$ `input` without `change` per keystroke or `execCommand()`.
  - **Decoupled Taskbar & Auto-Show Policy**: Integrated `<i>&#xE765;</i>` OSK toggle in `TaskbarSurface` emitting `experimental.osk.toggle`, with `InputPolicy` auto-show policy requiring `dev.oskEnabled == true` and `matchMedia('(pointer: coarse)').matches`.
  - **Developer Options Feature Flag**: Persisted `dev.oskEnabled` setting in `UserSettingsService` exposed via Settings Developer Options.
- **Series 10 — Window Centering Capability & Recovery Shortcut (27.10.14, Build 86)**:
  - **WindowManager Center API**: Added `WindowManager.centerWindow(id)` method restoring minimized windows, clearing snap/maximize bounds, and centering window coordinates in active workspace.
  - **WindowService Public API**: Exposed public `WindowService.centerWindow(id)` emitting `windowService:center` telemetry event.
  - **Global Window Recovery Shortcuts**: Bound `Alt + Shift + C` and `Alt + Home` in `InputPolicy` to instantly center and focus lost or offscreen windows in the active workspace.
- **Series 10 — Fluid Window Motion & Transition Animation Engine (27.10.15, Build 87)**:
  - **Unified Presentation Motion Pipeline**: Standardized window motion events across `minimize`, `maximize`, `restore`, `snap`, and `center` actions in `WindowManager.js`, querying `PresentationEffectsService.getMotionPolicy(...)`.
  - **Fluid Cubic Bezier Transition**: Configured `.lde-window-frame.animating-motion` in `theme.css` with `cubic-bezier(0.16, 1, 0.3, 1)` easing across `left`, `top`, `width`, and `height` properties for 220ms fluid transitions.
  - **Walkthrough Artifact**: Generated complete technical walkthrough artifact (`walkthrough.md`) documenting On-Screen Keyboard, Window Centering, Browser Compatibility Hardening, and Fluid Window Motion.
- **Series 10 — Window Minimize & Maximize Fluid Animation (27.10.16, Build 88)**:
  - **Pre-DOM Motion Intent Pipeline**: Reordered `_emitMotionIntent(id, action)` to execute before `_applyState(id)` in `WindowManager.js` so `.animating-motion` and `.minimizing` classes are applied to window frames prior to DOM property mutations (`setPosition`, `setSize`, `style.display`).
  - **Minimize & Restore Animations**: Configured `.lde-window-frame.minimizing` in `theme.css` with `transform: translateY(30px) scale(0.85)` and `opacity: 0` using `cubic-bezier(0.16, 1, 0.3, 1)` easing over 220ms. `WindowSurface._handleMotionIntent` delays `style.display = 'none'` until the minimize animation completes, and handles two-frame `requestAnimationFrame` restore transitions.
- **Series 10 — Keyframe Minimize & Restore Fluid Downward Slide Engine (27.10.16.1, Build 89)**:
  - **Keyframe Motion Engine**: Created `@keyframes ldeFluidMinimize` (`0%` center to `100% translateY(120px) scale(0.65) opacity: 0`) and `@keyframes ldeFluidRestore` (`0% translateY(120px) scale(0.65) opacity: 0` to `100%` center `translateY(0) scale(1) opacity: 1`) using `cubic-bezier(0.16, 1, 0.3, 1)` over 240ms.
  - **AnimationEnd Event Lifecycle**: Replaced timeout delays in `WindowSurface._handleMotionIntent` with native `animationend` listeners (`ldeFluidMinimize`, `ldeFluidRestore`), mirroring the window closing lifecycle in `WindowFrame.js`.
- **Series 10 — Bottom-Center Taskbar Sink & Restore Motion Test (27.10.16.2, Build 90)**:
  - **Bottom-Center Taskbar Convergence**: Updated `@keyframes ldeFluidMinimize` and `@keyframes ldeFluidRestore` in `theme.css` to converge to `left: 50%; top: 100%; transform: translate(-50%, -100%) scale(0.3); opacity: 0`, creating a smooth bottom-center taskbar sink animation when minimizing and expanding outward when restoring.
- **Series 10 — Viewport Relative Motion Engine (27.10.16.3, Build 91)**:
  - **Viewport Height Scale Engine**: Configured `@keyframes ldeFluidMinimize` and `@keyframes ldeFluidRestore` with `transform: translateY(80vh) scale(0.2)`, allowing keyframe animations to override inline pixel `left`/`top` styles and slide the window 80% down the screen height while scaling down to 20% size and fading.
- **Series 10 — Drag Motion Class Stripping & Animation Cleanup (27.10.16.4, Build 92)**:
  - **Immediate Drag Motion Stripping**: Updated `WindowFrame.js` (`pointerdown` on `titleBar`) and `WindowManager.js` (`moveWindow`) to strip all transient animation/transition classes (`animating-motion`, `minimizing`, `restoring`, `closing`) immediately on drag start and add `.opened`.
  - **Drag Unsnap Bypass**: Dragging a maximized or snapped window to restore it immediately strips animation classes, allowing instantaneous 1-to-1 pointer tracking without lagging or triggering restore keyframe animations during drag gestures.
- **Series 10 — Window Transition State Machine Hardening (27.10.17.0, Build 94)**:
  - **Canonical `WindowTransition` Fact Event**: Established `WindowTransition` (`transitionId`, `windowId`, `pid`, `previousState`, `nextState`, `transitionReason`, `interactionSource`, `timestamp`) as a first-class immutable platform event emitted exclusively by `WindowManager.js` via `window.transition`.
  - **Decoupled Telemetry Pipeline**: `WindowManager` acts strictly as state owner emitting transition facts. `PresentationEffectsService` consumes facts, validates `transitionReason` against a data-driven `TRANSITION_MAP`, resolves `animationIntent` (`none`, `minimize`, `restore`, `maximize`, `restoreFromMaximize`, `snap`, `center`, `open`, `close`), and emits `presentation.motion.window`.
  - **Dumb View Renderer**: `WindowSurface.js` functions strictly as a dumb view renderer for `presentation.motion.window`, applying declarative CSS classes based on resolved `animationIntent` and policy without inspecting state or transition reasons.
  - **Deterministic Drag Unsnap**: Dragging a maximized or snapped window constructs `transitionReason: 'titlebarDrag'`, which resolves strictly to `animationIntent: 'none'`. Window follows pointer immediately with zero transition lag or spurious restore keyframe animations.
- **Series 10 — PresentationEffectsService Listener Resolution Hotfix (27.10.17.1, Build 95)**:
  - **Constructor Invocation**: Updated `PresentationEffectsService.js` constructor to invoke `this._subscribeToPlatformEvents()` instead of the legacy `this._setupWindowTranslators()`, eliminating boot panic and restoring clean desktop startup.
- **Series 10 — Reversed Minimize Acceleration Easing Curve (27.10.17.2, Build 96)**:
  - **Acceleration Easing Curve**: Replaced deceleration Ease-Out curve with time-reversed acceleration curve `cubic-bezier(0.7, 0, 0.84, 0)` in `theme.css` (`.lde-window-frame.minimizing`) and `PresentationEffectsService.js` (`minimize` policy). Minimizing windows now drop smoothly and accelerate rapidly into the taskbar plane without decelerating or stuttering at the end.
- **Series 10 — On-Screen Keyboard Surface Motion Synchronization (27.10.17.3, Build 97)**:
  - **Unified Motion Harmony**: Configured `omni.css` (`.lde-osk-overlay`) with `transition: transform 0.24s cubic-bezier(0.7, 0, 0.84, 0)` for dismiss/exit and `transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)` for entrance/showing (`.lde-osk-overlay.showing`), creating perfect motion synchronization across OSK floating surfaces and window restore/minimize animations.
- **Series 10 — Strict Viewport Boundary Lock & Overscroll Protection (27.10.17.4, Build 98)**:
  - **Viewport Boundaries Lock**: Configured `html`, `body`, `#desktop-root`, and `#window-host` in `theme.css` and `platform.css` with `width: 100vw; height: 100vh; max-width: 100vw; max-height: 100vh; position: fixed; overflow: hidden !important; overscroll-behavior: none !important; touch-action: none;`.
  - **Touch & Gesture Containment**: Eliminates infinite panning/scrolling beyond desktop bounds on touch displays and mobile browsers when dragging windows or floating surfaces.
- **Series 10 — WindowService resizeWindow Public API Signature Alignment (27.10.17.5, Build 99)**:
  - **Public API Contract**: Added `WindowService.resizeWindow(id, width, height)` public alias for `setWindowSize()` in `WindowService.js` and updated `InputPolicy.js` shortcut handlers, resolving `TypeError` during keyboard window resizing shortcuts (`Alt + Ctrl + Arrow`).
- **Series 10 — 100% Asset Cache Completeness & GitHub Pages Subpath Audit (27.10.17.6, Build 100)**:
  - **100% Asset Cache Integrity**: Updated `sw.js` `ASSETS_TO_CACHE` manifest and incremented cache version to `v117` to include all 299 platform JavaScript, CSS, JSON, icon, and document assets on disk.
  - **GitHub Pages Subpath Compatibility**: Verified all relative pathing (`./sw.js`, `lark/`, relative imports, and `window.LDE_BASE_URL` in `index.html`) guaranteeing flawless offline and online operation under subpath domains (e.g. `caud-me.github.io/lark/`).
















