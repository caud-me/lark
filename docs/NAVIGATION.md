# Lark OS — Repository Navigation Guide (Release 27.10.1)

*How to read the codebase, where new code belongs, and how the operating system loads.*

---

## The Core Principle

> **The folder tree is the architecture diagram.**

When you open `lark/` and expand folders in order, you are traversing the boot sequence of the operating system from host environment initialization to running user-space applications. Numbers are not decoration — they encode loading order and strict architectural dependency layers.

```
lark/
+-- 0-firmware/     <- Host environment POST & virtual hardware enumeration
+-- 1-kernel/       <- OS kernel bootstrap & service registry
+-- 2-storage/      <- LRFS virtual filesystem & storage drivers
+-- 3-system/       <- Constants & type definitions
+-- 4-policies/     <- Stateless security & input policies
+-- 5-platform/     <- All platform subsystems (domain-grouped)
+-- 6-apps/         <- User-space applications (system & user)
+-- 7-sdk/          <- Developer SDK & manifest builders
+-- 8-developer/    <- Diagnostics & architecture validation harness
\-- 9-ui/           <- CSS design framework & fonts
```

A new developer can understand the system simply by expanding these folders in sequence.

---

## Strict Dependency Direction

Numbered folders represent strict architectural dependency layers.

Dependencies must flow **downward only**:

```
6-apps (Applications)
    |
    v
5-platform (Subsystems & Shell)
    |
    v
4-policies (Stateless Rules)
    |
    v
3-system (Constants & Enums)
    |
    v
2-storage (Virtual Filesystem & Drivers)
    |
    v
1-kernel (OS Bootstrapper & Registries)
    |
    v
0-firmware (Virtual Hardware & POST)
```

**Rules:**
1. Higher layers may import from lower layers.
2. Lower layers must **NEVER** import from higher layers.
3. `0-firmware` depends on nothing inside `lark/`. It interacts strictly with browser host primitives.
4. `1-kernel` depends on `0-firmware` for hardware readiness, then boots `2-storage`, `3-system`, `4-policies`, and `5-platform`.
5. `6-apps` depends strictly on `5-platform` public services and `7-sdk`. Apps never import `1-kernel` or `0-firmware`.

---

## Loading Order

```
Browser loads index.html
    |
    v
lark/0-firmware/BootLoader.js          (HTML entry point, runs POST via HardwareRegistry)
    |
    v
lark/0-firmware/HardwareRegistry.js    (Probes Display, Storage, Input, Network virtual devices)
    |
    v
lark/1-kernel/kernel.js                (Instantiates ServiceRegistry, EventBus, managers & services)
    |
    +-- lark/2-storage/                (LRFS + storage drivers, mounted during kernel boot)
    +-- lark/3-system/                 (Constants read by Kernel and BootLogger)
    +-- lark/4-policies/               (Loaded before any platform service API is exposed)
    \-- lark/5-platform/               (Managers -> Services -> Orchestrators in order)
            |
            v
    lark/5-platform/boot/BootOrchestrator.js
            |
            v
    lark/5-platform/environments/        (Login, OOBE, Lock, Recovery...)
            |
            v
    lark/5-platform/desktop/             (Desktop environment + shell surfaces)
            |
            v
    lark/6-apps/                         (User-space applications launch last)
```

---

## Folder Reference

---

### `0-firmware/`

**Owner:** The firmware & platform architecture team.

**Why Firmware exists:**
In a WebOS, the browser environment is the physical machine. `0-firmware` represents everything that exists before the operating system kernel begins executing. It acts as the bridge between host browser primitives and the OS.

**What belongs here:**
- `BootLoader.js` — HTML entry point. Listens for DOM load, executes Power-On Self-Test (POST), mounts early `BootSplash`, and hands off execution to `coreKernel.bootstrap()`.
- `HardwareRegistry.js` — Probes, enumerates, and validates virtual hardware adapters and generates a persistent Virtual Machine Identity (`LARK-VM-XXXXXX`).
- `adapters/` — Modular virtual hardware adapters (`DisplayAdapter.js`, `StorageAdapter.js`, `KeyboardAdapter.js`, `PointerAdapter.js`, `NetworkAdapter.js`, `AudioAdapter.js`).

**What must NEVER be placed here:**
- Kernel state managers or service registries
- Application or shell presentation logic
- User policies or security authorization checks

**Rule:** `0-firmware` must be able to run in a bare browser window before any OS manager or service exists.

---

### `1-kernel/`

**Owner:** The kernel team.

**What belongs here:**
- `kernel.js` — The OS root orchestrator process (~65 LOC). Coordinates boot stages by executing dedicated stage registrars in `boot/`.
- `KernelBootstrapContext.js` — Lightweight shared state container passed between kernel boot stages.
- `KernelResourceManager.js` — Single canonical owner of machine runtime state, boot timelines, driver status tables, storage metrics, and process counts.
- `PanicHandler.js` — Dedicated renderer for Kernel Panic screens, formatting syslog events, backtraces, and structured panic metadata.
- `boot/` — Dedicated kernel boot subsystem (`DriverBootstrap.js`, `StorageBootstrap.js`, `ManagerBootstrap.js`, `ServiceBootstrap.js`, `ApplicationBootstrap.js`).
- `boot/services/` — Internal service registrar delegates (`CoreServices.js`, `UserServices.js`, `FilesystemServices.js`, `ApplicationServices.js`, `DesktopServices.js`, `CapabilityServices.js`).
- `api/` — Stable Kernel APIs (`KernelDisplayAPI`, `KernelStorageAPI`, `KernelNetworkAPI`, `KernelAudioAPI`, `KernelInputAPI`) consumed by Platform Services.
- `handles/` — Abstract kernel device handles (`DisplayHandle`, `StorageHandle`, `NetworkHandle`, `AudioHandle`, `InputHandle`).
- `DriverManager.js` — Instantiates, initializes, and binds kernel drivers to 0-firmware virtual hardware devices.
- `DriverRegistry.js` — Central driver lookup and driver class registration container (enables OCP driver extension).
- `drivers/` — Kernel driver contracts (`BaseDriver.js`, `DisplayDriver.js`, `StorageDriver.js`, `KeyboardDriver.js`, `PointerDriver.js`, `NetworkDriver.js`, `AudioDriver.js`).
- `ServiceRegistry.js` — The global service locator holding registered managers and services.
- `SystemEventBus.js` — The central async pub-sub event backbone.
- `AppRegistry.js` — Declares all built-in application manifests.
- `ServiceWorkerManager.js` — Manages browser service worker lifecycle.

**What must NEVER be placed here:**
- Feature business logic
- Domain state managers or services
- Presentation or DOM manipulation

**Rule:** Platform Services **may never** instantiate drivers, hardware, or firmware directly. Platform services interact strictly with **Kernel APIs** and **KernelResourceManager**.

---

### `2-storage/`

**Owner:** The storage subsystem team.

**What belongs here:**
- `LRFS.js` — Virtual filesystem POSIX-like abstraction.
- `LocalStorageDriver.js` — Key-value synchronous LocalStorage driver.
- `IndexedDBStorageDriver.js` — Transactional block storage driver.

**What must NEVER be placed here:**
- High-level platform services (`FileService` or `DiskService` belong in `5-platform/filesystem/`)
- Security policy checks
- UI or presentation logic

---

### `3-system/`

**Owner:** The core platform team.

**What belongs here:**
- Immutable constants and type definitions: `SystemVersion.js`, `BootMode.js`, `LogSeverity.js`, `LogCategory.js`, `EnvironmentType.js`, `WindowStates.js`.
- `BootLogger.js` — Pre-handoff logging buffer.
- `Environment.js` — Browser runtime environment detection.

---

### `4-policies/`

**Owner:** Security & governance team.

**What belongs here:**
- `SecurityPolicy.js`, `InputPolicy.js`, `ProcessPolicy.js`, `RecoveryPolicy.js`, `RestorePolicy.js`.

**Rule:** Policies are pure, stateless rule evaluators: `evaluate(context, action) -> decision`. No side effects or DOM rendering.

---

### `5-platform/`

**Owner:** Platform engineering team.

Contains all domain-grouped platform subsystems. Every subsystem follows the canonical four-part architecture:
```
5-platform/{domain}/
    {Domain}Manager.js          <- Headless state container (passes Terminal UI Test)
    {Domain}Service.js          <- Safe public API with semantic observers
    {Domain}Orchestrator.js     <- Multi-service workflow coordinator (optional)
```

---

### `6-apps/`

**Owner:** Application developers.

Contains user-space executables under `6-apps/system/` (system built-in apps) and `6-apps/user/` (user installed packages). Apps communicate exclusively via public platform services.

---

### `7-sdk/`

**Owner:** SDK & developer tools team.

Contains `index.js`, `ManifestBuilder.js`, `ApiRegistry.js`, and starter templates (`minimal`, `background`, `dialog`, `search-provider`, `widget`).

---

### `8-developer/`

**Owner:** Internal quality & diagnostics team.

Contains `PlatformArchitectureValidation.js`, `DeveloperOptionsService.js`, `quality/ArchitectureLinter.js`, and test helpers.

---

### `9-ui/`

**Owner:** UI framework team.

Contains `omni.css`, `theme.css`, design tokens, and fonts (`sfi.ttf`). Zero JavaScript.

---

## Future Framework Scaling Strategy

As Lark OS evolves into a modular platform, the repository hierarchy remains stable:
- **New Virtual Hardware Adapters:** Place in `0-firmware/adapters/` (e.g. `AudioAdapter.js`, `GPUAdapter.js`).
- **New Platform Subsystems:** Place in `5-platform/{domain}/` following the Guardian pattern (`Manager`, `Service`, `Orchestrator`).
- **New Shell Surfaces:** Place in `5-platform/desktop/shell/`.
- **New Platform Environments:** Place in `5-platform/environments/`.
- **New Applications:** Place in `6-apps/system/` or distribute as `.ldepkg`.

---

## Quick Decision Matrix

| Question | Destination |
| :--- | :--- |
| Pre-boot POST or hardware probing? | `0-firmware/` |
| Kernel lifecycle or service registration? | `1-kernel/` |
| Raw Virtual Disk I/O driver? | `2-storage/` |
| System version or enum constant? | `3-system/` |
| Stateless security evaluation? | `4-policies/` |
| Platform state, API, or shell surface? | `5-platform/{domain}/` |
| User application executable? | `6-apps/` |
| Public API contract for developers? | `7-sdk/` |
| Architecture validation harness? | `8-developer/` |
| Global CSS or font file? | `9-ui/` |

---

*Lark OS 27.10.1 Canonical Architecture Reference.*
