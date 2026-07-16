# LDE Startup And Desktop Environment Flow

This diagram traces LDE from a blank browser page to a running desktop environment, then shows how launching and interacting with applications flows through the system.

## Zero To Desktop Environment

```mermaid
flowchart TD
    A["Browser opens index.html"] --> B["DOM contains #desktop and #window-host"]
    B --> C["BootLoader waits for DOMContentLoaded"]
    C --> D["coreKernel.bootstrap()"]

    D --> E["Stage 1: Storage subsystem"]
    E --> E1["LocalStorageDriver"]
    E1 --> E2["LRFS mounts virtual filesystem"]

    E2 --> F["Stage 2: State managers"]
    F --> F1["Log, Network, Window, Process, IPC, Repository"]
    F --> F2["Dialog, Context Menu, Clipboard, Shortcut"]
    F --> F3["Settings, User, Session, Disk, Trust"]
    F --> F4["PermissionManager loads state"]
    F4 --> F5["SessionManager starts system session"]
    F5 --> F6["AppRegistry loads default apps"]
    F6 --> F7["ThemeRepository, Personalization, WidgetRepository, WidgetManager"]

    F6 --> G["Stage 3: System services"]
    G --> G1["Services wrap managers with public APIs"]
    G1 --> G2["FileService, WindowService, ProcessService, PackageService"]
    G1 --> G3["ApplicationService, SessionService, UserService"]
    G1 --> G4["Search, Power, IPC, Notification, Dialog"]
    G1 --> G7["PermissionService, TrustService, CapabilityService"]
    G1 --> G9["ThemeService, WidgetService, NetworkService, DownloadService"]
    G1 --> G10["RepositoryService (fetches via NetworkService)"]
    G4 --> G5["Search providers registered"]
    G5 --> G6["InputPolicy installed"]
    G6 --> G8["CapabilityRegistry and Providers initialized"]
    G8 --> H["Stage 4: Application startup"]

    H --> I{"Does /system/installed.json exist?"}
    I -- "No, first boot" --> J["Start sys.oobe"]
    J --> K["OOBE creates setup window"]
    K --> L["Creates directories, user, installed.json"]
    L --> M["OOBE process terminates"]
    M --> N["Start sys.login"]
    I -- "Yes, normal boot" --> N

    N --> O["Login creates login window"]
    O --> P["User logs in through SessionService"]
    P --> Q["ApplicationService returns startup apps"]
    Q --> R["ProcessService starts sys.desktop"]
    R --> S["Desktop app assembles desktop environment"]
    S --> S1["Wallpaper"]
    S --> S5["Widget Layer (loads active widgets via WidgetService)"]
    S --> S2["Taskbar"]
    S --> S3["Notification Center"]
    S --> S4["Command Palette"]
    S --> T["Desktop environment ready"]
```

## Running An Application

```mermaid
flowchart TD
    A["User clicks app in Taskbar launcher"] --> B["Desktop onAppClick(appId)"]
    B --> C["ProcessService.startProcess(appId)"]
    C --> D["ApplicationService looks up AppRegistry metadata"]
    D --> E{"Singleton already running?"}

    E -- "Yes" --> F["WindowService restores and focuses existing PID"]
    F --> G["Optional intent sent to existing app"]
    G --> Z["User sees existing app"]

    E -- "No" --> H["SessionService provides owner identity"]
    H --> I["ProcessManager creates process record and PID"]
    I --> J["EventBus emits process.started"]
    J --> K["ProcessService asks RuntimeLoaderService for module"]
    K --> L1["RuntimeLoaderManager determines loader strategy"]
    L1 --> L2["Selected Loader (e.g. BuiltinRuntimeLoader) loads module"]
    L2 --> L3["App module run(registry, pid, args)"]
    L3 --> M["App requests WindowService.createWindow(...)"]
    M --> N["WindowManager creates WindowFrame"]
    N --> O["Frame appended to #window-host"]
    O --> P["WindowManager focuses window and emits events"]
    P --> Q["Desktop listens and re-renders Taskbar state"]
    Q --> Z["User sees and interacts with app"]
```

## Window Lifecycle

```mermaid
flowchart TD
    A["Window Created"] --> B["Window Normal (Visible)"]
    B --> C["User clicks Minimize"]
    B --> D["User clicks Maximize"]
    
    C --> E["WindowService.minimizeWindow()"]
    E --> F["WindowManager sets WindowStates.MINIMIZED"]
    F --> G["EventBus emits window.minimized"]
    G --> H["Desktop app applies 'display: none' to window DOM"]
    H --> I["Taskbar app item marked as minimized"]
    
    I --> J["User clicks Taskbar item"]
    J --> K["WindowService.restoreWindow()"]
    K --> L["WindowManager sets WindowStates.NORMAL"]
    L --> M["EventBus emits window.restored"]
    M --> N["Desktop app removes 'display: none'"]
    N --> B
    
    D --> O["WindowService.maximizeWindow()"]
    O --> P["WindowManager saves geometry and sets WindowStates.MAXIMIZED"]
    P --> Q["EventBus emits window.maximized"]
    Q --> B
```

## Interaction Loop

```mermaid
flowchart LR
    U["User input"] --> UI["WindowFrame, Taskbar, Command Palette, Desktop background"]
    UI --> SVC["Services"]
    SVC --> MGR["Managers"]
    MGR --> STATE["Process, window, session, file, settings state"]
    STATE --> EVT["EventBus events"]
    EVT --> SHELL["Desktop shell updates"]
    SHELL --> UI

    SVC --> FS["LRFS virtual filesystem"]
    FS --> LS["localStorage driver"]

    SVC --> APP["Application run() code"]
    APP --> UI
```

## Main Responsibilities

| Layer | Files | Role |
| --- | --- | --- |
| Browser entry | `index.html`, `src/kernel/BootLoader.js` | Creates the DOM host and hands control to the kernel. |
| Kernel | `src/kernel/kernel.js` | Runs boot stages and decides whether to launch OOBE or Login. |
| Registry and events | `src/kernel/AppRegistry.js`, `src/kernel/ServiceRegistry.js`, `src/kernel/SystemEventBus.js` | Keeps app/service lookup and system-wide event signaling centralized. |
| Storage | `src/storage/drivers/LocalStorageDriver.js`, `src/storage/lrfs/LRFS.js` | Persists the virtual filesystem. |
| Managers | `src/managers/*` | Own raw runtime state such as windows, processes, sessions, disks, and logs. |
| Services | `src/services/*` | Expose safe APIs to apps and enforce higher-level behavior. |
| System apps | `src/apps/system/OOBE.js`, `Login.js`, `Desktop.js` | Move the system from setup/login into the visible desktop environment. |
| UI | `src/ui/*` | Renders reusable desktop components, frames, taskbar, wallpaper, dialogs, and command palette. |

## Mental Model

LDE boots like a tiny operating system inside the browser:

1. `index.html` creates the desktop host.
2. `BootLoader` starts the kernel.
3. The kernel mounts storage, creates managers, registers services, and starts the first app.
4. OOBE runs only until installation metadata exists.
5. Login starts the user session.
6. The Desktop app becomes the desktop environment shell.
7. Every later app launch goes through `ProcessService`, gets a PID from `ProcessManager`, imports its app module, then creates visible UI through `WindowService` and `WindowManager`.
