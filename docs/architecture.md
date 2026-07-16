# LDE 27 Architecture

This document describes the high-level architecture of LDE 27, current as of Series 5.16.

## Core Philosophy

LDE 27 is built strictly on the **Single Responsibility Principle**.
Components are divided into three rigid layers:
1.  **Managers**: Low-level infrastructure and system state.
2.  **Services**: High-level public APIs and service orchestration.
3.  **Policies**: Independent rulesets evaluating contextual permissions and access control.
4.  **Applications**: UI clients that only communicate with Services.

## Boot & Session Lifecycle

The Lark OS boot and session composition follows a strict, layered orchestrator flow:

```text
Kernel
    │
    ▼
BootService
    │
    ├── Recovery Environment (sys.recovery)
    ├── OOBE Environment (OOBE.js - dynamic stage)
    └── Authentication Environment (sys.login)
            │
            ▼
SessionService
            │
            ▼
UserEnvironmentService
            │
            ├── Welcome Environment (Welcome.js - first login)
            └── Restore User Environment
                    │
                    ▼
Desktop Environment (sys.desktop)
```

## Runtime Environment Classification

Lark OS distinguishes between five runtime environment categories:

```text
Kernel
    ↓
Platform Services
    ↓
EnvironmentManager
    ↓
Platform Environments
        │
        ├── Login
        ├── Lock
        ├── Recovery
        ├── Welcome
        └── OOBE

Desktop Environments
        │
        └── LDE
                  │
                  ├── Wallpaper
                  ├── Widgets
                  ├── Dock
                  ├── Taskbar
                  ├── Window Host
                  └── Applications
```

### Environment Taxonomy
1. **Platform Environments**: Base environments mounted directly by the `BootService` (e.g., Login, Lock, Recovery, Welcome, OOBE). They represent stages of OS boot, setup, diagnostic, or security lifecycle. They are system-owned runtime shells.
2. **Desktop Environment**: The graphical shell interface (e.g., LDE) bound to a user session. Composes the session's wallpaper, widgets, taskbar, and acts as the parent container for all user-space application window frames.
3. **Applications**: User-space software (e.g., Settings, Files, Terminal) launched inside a specific user session and executing inside the Desktop Environment.

### Platform Ownership Table

| Component                 | Owns                                 | Never Owns                  |
| ------------------------- | ------------------------------------ | --------------------------- |
| Kernel                    | Platform initialization              | User state                  |
| BootService               | Boot flow                            | Desktop rendering           |
| EnvironmentManager        | Active environment reference         | Transition orchestration    |
| DesktopEnvironmentService | Desktop environment instances        | User settings               |
| Desktop Environment       | Wallpaper, taskbar, widgets, windows | Authentication, persistence |
| SessionService            | User sessions                        | UI composition              |
| WindowManager             | Window metadata/state                | Session visibility          |
| InputPolicy               | Event routing                        | Session logic               |
| UserEnvironmentService    | Restoring user environment           | Rendering desktop           |

## Event Philosophy

UI components should subscribe to **semantic domain events** rather than implementation events.
Because LDE is designed as a dynamic OS, components shouldn't tightly couple to specific managers or internal state mutations. For example, the Desktop listens to `application.database.changed` to re-render the taskbar, rather than listening to `package.install.completed`, because there are many ways the application list might change (sync, CLI, migrations) that don't involve the PackageService.

## Semantic UI Variables

Applications should never depend on hardcoded color values (like `#2e2e2e` or `rgb(10, 10, 10)`).
Instead, all components must use semantic variables exposed by the OS Theme Framework:
- `var(--lde-surface)`
- `var(--lde-text)`
- `var(--lde-border)`
- `var(--lde-accent)`

By relying strictly on these semantic variables, applications instantly and automatically inherit system-wide theme changes (like switching from Light to Dark mode, or applying custom user palettes) without requiring any code changes.

## System Namespace

The `src/system/` namespace contains global OS identity, constants, and immutable metadata.
*   **SystemVersion.js**: The single source of truth for the OS version and codename.

## Managers
Managers maintain underlying OS infrastructure and native states.
*   **ProcessManager**: Maintains the internal process table and PID map.
*   **WindowManager**: Manages the `#lde-window-layer` DOM element, z-index compositor, and internal state machine. Emits semantic events like `window.focused`.
*   **DialogManager**: Manages the `#lde-dialog-layer` DOM element for OS-level blocking overlays.
*   **IPCManager**: Routes messages between isolated execution contexts.
*   **ContextMenuManager**: Manages the `#lde-context-menu-layer`.
*   **ShortcutManager**: Maintains global keyboard shortcuts.
*   **SettingsManager**: Manages system-wide configuration state.
*   **UserSettingsManager**: Manages per-user configuration state.
*   **SessionManager**: Manages concurrent authenticated sessions and tracks the active session. Also tracks session idle state.
*   **UserManager**: Maintains the in-memory state of local user accounts (no file I/O).
*   **UserProfileManager**: Stores mutable runtime state for user profiles (display name, avatar, account creation date).
*   **NotificationManager**: Manages transient OS notifications.
*   **DiskManager**: Provides disk snapshot capabilities.
*   **RestoreManager**: Owns mutable runtime state for active restore operations.
*   **ApplicationDatabaseManager**: Manages the persistence and cache of the installed applications database.
*   **PackageManager**: ⚠️ work in progress — Extraction and validation of `.ldepkg` files is currently handled inline by `PackageService`. A dedicated `PackageManager` state container is deferred to a future phase.
*   **RuntimeLoaderManager**: Maintains a registry of runtime loader strategies (e.g., `builtin`) to determine how an application's code is resolved.
*   **RepositoryManager**: Maintains configured repository sources, caches metadata, and delegates fetching to sources like `BuiltinRepositorySource`.
*   **PermissionManager**: Maintains the mutable state of granted, denied, and revoked permissions for applications.
*   **SecurityManager**: Owns the mutable security state for the current OS session (lockout counters, privilege levels).
*   **RecoveryManager**: Owns the mutable state for the active recovery session (safe mode flag, recovery context).
*   **TrustManager**: Evaluates and holds the trust state, publisher identity, and origin of packages.
*   **ThemeRepositoryManager**: Maintains a registry of available `.ldetheme` sources and caches theme manifests.
*   **PersonalizationManager**: ⚠️ work in progress — Active theme and wallpaper preference persistence is currently handled by `ThemeService`. A dedicated `PersonalizationManager` state container is deferred to a future phase.
*   **WidgetManager**: Owns mutable state of active widget instances and persists layout configurations.
*   **ExtensionRepositoryManager**: Maintains the registry of all extensions contributed by installed applications.
*   **NetworkManager**: Owns mutable network state, including online/offline connectivity and active request counts.
*   **LogManager**: Owns the mutable in-memory log buffer, consumed by `LogService` for queries and display.

## Services
Services consume managers and policies to expose safe APIs to Applications.
*   **ProcessService**: Interacts with `ProcessPolicy` before instructing `ProcessManager` to spawn or kill. It is a strictly generic process lifecycle manager.
*   **WindowService**: Exposes behavior-driven window lifecycle APIs (`createWindow`, `minimizeWindow`, `restoreWindow`, etc.). Does not manipulate the DOM directly.
*   **DialogService**: Exposes promise-based `alert()`, `confirm()`, and `prompt()` APIs.
*   **FileService**: Exposes high-level read/write/delete operations abstracted over `StorageDriver`.
*   **AssociationService**: Resolves application mappings for file paths based on `AppRegistry`.
*   **ApplicationIntentService**: The system's application router. Manages singleton application revivals, routes intents to running instances, and dispatches startup intents via process launch options. Enables **Discoverable Intents** by executing intents advertised directly by applications.
*   **SearchService**: Orchestrates system-wide search. Dynamically loads `SearchProvider` extensions. Includes the `IntentSearchProvider` which indexes discoverable intents advertised by the application layer.
*   **ApplicationService**: Exposes a public API for querying application metadata and identity.
*   **SettingsService**: API for reading/writing global system preferences inside `/system/`.
*   **UserSettingsService**: API for reading/writing per-user preferences inside `/users/{username}/Settings/`.
*   **BootService**: Orchestrates system boot environment selection (OOBE, Recovery, Login) and manages host default theme application.
*   **UserEnvironmentService**: Dynamically orchestrates the restoration of user-specific environments (themes, widgets) upon session activation using duck typing.
*   **ClipboardService**: Interacts with the OS clipboard.
*   **ContextMenuService**: Exposes context menus.
*   **ShortcutService**: Allows apps to bind lifecycle-managed shortcuts.
*   **ErrorService**: Unifies global error handling and reporting.
*   **LogService**: Unified syslogging interface.
*   **RestoreService**: Public API for System Restore functionality.
*   **SessionService**: Exposes a public API for user authentication and session state.
*   **UserService**: Owns all user persistence, home directory provisioning, and user account APIs.
*   **UserProfileService**: Public API for user identities (display name, avatar, metadata) and profile persistence.
*   **PowerService**: Handles lock, logout, and reboot capabilities.
*   **SearchService**: Orchestrates system-wide search through registered Provider Adapters, exposing an asynchronous iterator to stream results.
*   **ApplicationDatabaseService**: Protected API wrapper for the application database.
*   **RuntimeLoaderService**: Resolves execution modules using the appropriate runtime strategy.
*   **PackageService**: Orchestrates package installation and uninstallation workflows.
*   **RepositoryService**: Public API for searching and querying available packages from configured repositories.
*   **PermissionService**: Single public API evaluating an application's declared permissions against its granted state.
*   **TrustService**: Public API exposing trust metadata for UI evaluation and package installation validation.
*   **ThemeService**: API for querying available themes and automatically applying active CSS variables to the DOM based on user personalization.
*   **WidgetService**: Exposes a safe public API for adding, removing, and querying widgets. Emits system-wide semantic events when layouts change.
*   **ExtensionService**: Exposes a unified discovery API for all application-contributed extensions (e.g. search providers, widgets) and emits `extensions.changed`.
*   **NetworkService**: Core public OS API for external communication, wrapping native fetch and emitting semantic network events.
*   **DownloadService**: Pipeline abstraction for fetching and processing network assets, emitting semantic download events.

## Policies
Policies enforce rules, authorization, and capabilities, cleanly decoupling "what is allowed" from "how it is executed".
*   **InputPolicy**: Intercepts all DOM input events and routes them based on `data-environment-type` attributes, blocking cross-environment input leakage. Installed last in the boot sequence after all services are registered.
*   **ProcessPolicy**: Enforces rules regarding process spawning, isolation, and singleton constraints.
*   **SecurityPolicy**: Core policy evaluating generic system privileges against the current session or context.
*   **RecoveryPolicy**: Rules governing access to recovery mode and diagnostic environments.
*   **RestorePolicy**: Determines if specific system restore or snapshot operations are permitted.

## Widget Philosophy

Widgets are persistent, lightweight desktop components hosted by the Desktop shell.
- Widgets are **not** applications.
- Widgets do **not** own processes.
- Widgets do **not** own windows.
- Widgets communicate exclusively through Capabilities and semantic events.

Because widgets run within the Desktop shell's process rather than their own, they have an extended lifecycle (`initialize`, `mount`, `update`, `onThemeChanged`, `unmount`, `destroy`) which allows the shell to temporarily suspend or re-render them without terminating their configuration state.

## The Presentation Model Architecture

The Desktop Shell architecture operates on a strict downward dependency flow using the presentation model pattern:

```text
ApplicationService
        ↓
Desktop (UI Orchestrator)
        ↓
LauncherModel (State)
        ↓
Taskbar (View)
```

The Taskbar is treated as a pure component. It doesn't know *where* data comes from or *how* to execute actions. It simply receives state from `LauncherModel` and invokes callbacks bound by the `Desktop`.

## Versioning Scheme
LDE uses a custom OS release numbering scheme defined centrally in `SystemVersion.js`:
* **27** - Year Generation (e.g., 2027)
* **1** - Milestone (Series)
* **20** - Phase Completion
* **0** - Hotfix (post-phase patches)

## Repository Tree (Domain-First)

```text
src/
    ├── kernel/             # Kernel core: bootloader, event bus, service registry, app catalog
    ├── system/             # OS constants, base contracts, environment types, boot infrastructure
    ├── storage/            # Storage drivers and LRFS virtual filesystem
    ├── platform/           # Subsystems, Managers, and specialized domain logic
    ├── services/           # Platform Services: high-level APIs consumed by apps and environments
    ├── policies/           # Access Control Policies: pure rule evaluators (SecurityPolicy)
    ├── application/        # Application framework: BaseApplication, ApplicationComponent
    ├── sdk/                # Developer SDK: ManifestBuilder, ApiRegistry
    ├── apps/               # User-space applications (FileManager, Settings, SoftwareCenter, Terminal)
    └── ui/                 # Desktop shell UI: Taskbar, Wallpaper, WindowFrame, CommandPalette
```

## Virtual Filesystem
The virtual filesystem (`LRFS`) now treats `/packages` as the canonical installation root for `.ldepkg` applications.

## Package Metadata vs Application Metadata
LDE strictly separates metadata responsibilities:
1. **Application Manifest**: Describes how an application *runs* and what capabilities it requires (e.g., `runtime.loader`, `install.version`, `permissions`). It belongs to the `ApplicationDatabaseManager`.
2. **Package Manifest**: Describes how software is *discovered* and distributed (e.g., `screenshots`, `homepage`, `license`, `tags`). It belongs to the `RepositoryManager`.

## Security Flow & Authorization Architecture
Permissions, Trust, and Filesystem Authorization are strictly decoupled:

1. **Filesystem Authorization**: `SecurityPolicy` is the sole authorization authority for all filesystem actions. Services (like `FileService`) do not invent their own security rules. They fetch the context and metadata, pass it to `SecurityPolicy.canAccessPath`, and blindly enforce the result.
2. **Application Capabilities**: `PermissionService` evaluates an application's declared permissions against the mutable `PermissionManager` state.
3. **Package Trust**: `TrustService` evaluates cryptographic trust during installation.

The **Application Database** owns what an application *asks for*, the **Permission Manager** owns what the user *has granted*, and the **Permission Service** evaluates the two together.

## Public OS API & Capability Framework
To provide a stable, permission-aware interface for applications, LDE is migrating towards a Capability-based OS API. Instead of applications consuming internal OS services directly, they request capabilities via the `CapabilityService`.

```text
Application
        │
        ▼
CapabilityService
        │
        ▼
CapabilityRegistry
        │
        ▼
Capability Provider
        │
        ▼
Internal OS Service
        │
        ▼
OS Manager
```

This enforces a strict architectural boundary. Future features—such as third-party apps, extensions, runtime permission checks, and sandboxing—will build on this single boundary.

## Software Center & Repositories
The **Software Center** allows users to discover and install software. It queries `RepositoryService` for available packages and orchestrates installations via `PackageService`. Repositories are fetched via `RepositoryManager` which delegates to **Repository Sources** (like `BuiltinRepositorySource`), cleanly separating origin fetching from repository state management.

## Extension Framework
Applications can contribute features (like Widgets or Search Providers) directly to the OS through their `extensions` manifest array. The **ExtensionRepositoryManager** caches these globally, while **ExtensionService** acts as the public discovery layer for subsystems to consume. This eliminates the need for hardcoded subsystem registrations within the Kernel.

## Application Architecture
Complex applications (like Settings, Software Center, etc.) act as orchestrators using the platform's native Application Architecture (`src/application/`). Rather than manually rebuilding the DOM on every state change, they follow a standardized, component-driven lifecycle.

Importantly, **the operating system only provides the lifecycle contracts**. Third-party applications are completely free to organize their files and folders however they like.

```text
Application Startup (invoked by OS)
        ↓
   app.initialize()
        ↓
   WindowService provides Window
        ↓
   app.mount(window) (builds shell layouts, instantiates components)
        ↓
   component.mount(container)
        ↓
   component.start() (subscribes to EventBus, starts timers)
        ↓
   component.refresh() (updates UI when state changes)
```

The orchestrator (`BaseApplication`) manages the components, but does not own the `Window`. The `WindowService` remains the sole authority for creating and tracking windows. Components cleanly clean up their subscriptions in `destroy()`.

## Application Classification
Not every application in the OS uses the full `BaseApplication` framework. The OS categorizes applications based on architectural complexity, preventing over-engineering where simplicity suffices.

### Shell Components
**Examples:** `Desktop Environment (LDE)`, `Platform Environments (Login, Lock, OOBE, Welcome, Recovery)`
These are environment controllers, not conventional applications. They do not own a `WindowService` window. `Desktop` acts as the root shell orchestrator for user sessions, while `Platform Environments` act as system-owned shells. They should never be forced into the application framework.

### Tier 1 — Simple Applications
**Examples:** `Shutdown`, `WindowTest`, `EventViewer`
Single, atomic views (often dialogs or fullscreen overlays). They do not maintain complex mutable state, lack sub-panels, and have minimal event subscriptions. They remain single-file scripts.

### Tier 2 — Deferred Applications
**Examples:** `Terminal`, `TaskManager`
Medium-complexity apps that currently function as a single viewport or list. They are deferred from migration until they accumulate enough independent views (e.g., Terminal tabs, Task Manager performance graphs) to warrant componentization.

### Tier 3 — Complex Applications
**Examples:** `Settings`, `SoftwareCenter`, `FileManager`
Highly complex windowed applications maintaining significant state, managing navigation, and utilizing multiple logical views or panels. These are built fully upon the `BaseApplication` and `ApplicationComponent` framework.
