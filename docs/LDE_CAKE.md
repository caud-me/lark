# The LDE Cake

This document establishes the canonical architectural layering model for the Lark Desktop Environment (LDE). It is the primary reference for understanding how responsibilities are divided across the OS.

---

## 1. Philosophy

LDE is built on the **Single Responsibility Principle** and **Strict Layering**. 
To prevent spaghetti code, enhance security, and keep the system beginner-friendly, components are organized into layers (the "Cake"). 

Each layer owns a specific responsibility and is strictly bound by dependency rules: **a layer may only depend on the layers beneath it, never above it.** Event-driven communication (`SystemEventBus`) is used to bubble information up from lower layers without introducing direct dependencies.

---

## 2. The LDE Cake

```text
┌─────────────────────────────────────────────┐
│                 Applications                │
├─────────────────────────────────────────────┤
│            Desktop Shell Components         │
├─────────────────────────────────────────────┤
│          Desktop Environment (LDE)          │
├─────────────────────────────────────────────┤
│        Platform Environments (Login,        │
│      Recovery, Shutdown, Lock, OOBE...)     │
├─────────────────────────────────────────────┤
│ Services • Managers • Policies • SDK        │
├─────────────────────────────────────────────┤
│          Kernel & Boot Infrastructure       │
└─────────────────────────────────────────────┘
```

---

## 3. Layer Responsibilities

### Applications
* **Purpose**: User-facing software and tools.
* **Ownership**: Owned by the user, managed by the ApplicationService.
* **Lifetime**: Launched and terminated dynamically by the user or system.
* **Examples**: `sys.terminal`, `sys.settings`, `sys.filemanager`.

### Desktop Shell Components
* **Purpose**: UI primitives that make up the desktop experience.
* **Ownership**: Owned by the Desktop Environment.
* **Lifetime**: Lives as long as the Desktop Environment is active.
* **Examples**: Taskbar, Notification Center, Command Palette, Widgets.

### Desktop Environment
* **Purpose**: The primary workspace and shell orchestrator for a logged-in user.
* **Ownership**: Owned by `DesktopEnvironmentService` and mapped to a specific user session.
* **Lifetime**: Created upon successful login; destroyed upon logout.
* **Examples**: `LDE Desktop` (`src/system/environments/desktop/Desktop.js`).

### Platform Environments
* **Purpose**: High-privilege, system-level execution contexts that operate outside of user sessions.
* **Ownership**: Owned directly by the system / `BootService` / `PowerService`.
* **Lifetime**: Active during specific system states (e.g., before a user logs in, or during shutdown).
* **Examples**: `sys.login`, `sys.lock`, `sys.oobe`, `sys.recovery`, `sys.shutdown`.

### Services, Managers, Policies, SDK
* **Purpose**: The runtime infrastructure. Services expose high-level APIs; Managers hold state; Policies enforce rules; SDK provides developer abstraction.
* **Ownership**: Registered centrally via `ServiceRegistry` and `ComponentRegistry`.
* **Lifetime**: Initialized during boot by `kernel.js`; persists until system power-off.
* **Examples**: `ProcessService`, `WindowManager`, `FileSystemPolicy`.

### Kernel & Boot Infrastructure
* **Purpose**: The lowest level of LDE. Bootstraps registries, event buses, and dependency injection.
* **Ownership**: The root execution context.
* **Lifetime**: From page load to page close.
* **Examples**: `kernel.js`, `SystemEventBus.js`, `ServiceRegistry.js`.

---

## 4. Allowed Dependencies

To maintain structural integrity, imports must strictly follow this matrix:

| Layer                | May Depend On                                  |
| -------------------- | ---------------------------------------------- |
| Applications         | SDK, Services                                  |
| Desktop Shell        | Desktop Environment, Services                  |
| Desktop Environment  | Services, SDK                                  |
| Platform Environment | Services, SDK                                  |
| Services             | Managers, Policies, Kernel                     |
| Managers             | Kernel                                         |
| Policies             | Kernel                                         |
| Kernel               | Standard web APIs, primitive data types        |

---

## 5. Forbidden Dependencies

Violating these rules compromises the LDE Cake and creates architectural debt.

* ❌ **Applications → Managers**: Apps must go through Services.
* ❌ **Managers → FileService**: Managers are state containers; Services perform orchestration/I/O.
* ❌ **Desktop Shell → Platform Environment**: UI components cannot depend on unrelated system states.
* ❌ **Platform Environment → Applications**: Environments must not rely on userland software to function.
* ❌ **Policies → UI**: Policies are pure logic evaluators. They do not render Dialogs or Alerts.
* ❌ **Services → Applications**: Services provide APIs; they do not hardcode behavior for specific apps.

*(Note: There are rare **Intentional Exceptions**, such as `BootService` orchestrating Platform Environments, which are justified by their architectural purpose.)*

---

## 6. Runtime Ownership (Lifecycle)

Ownership transfers cleanly as the system progresses through its lifecycle:

```text
Bootloader (`index.html`)
       ↓
Kernel (`kernel.js`) initializes Registries & Infrastructure
       ↓
`BootService` mounts the initial Platform Environment (e.g., `sys.oobe` or `sys.login`)
       ↓
User Authenticates -> `SessionService` creates session
       ↓
`ProcessService` mounts the Desktop Environment (`sys.desktop`)
       ↓
Desktop Environment renders Desktop Shell (Taskbar, Wallpaper)
       ↓
User launches Applications (`sys.terminal`)
       ↓
User initiates Shutdown -> `PowerService` mounts `sys.shutdown` Platform Environment
       ↓
System halts.
```

---

## 7. Repository Mapping

The physical filesystem mirrors the LDE Cake:

```text
src/
├── kernel/                       (Kernel & Boot Infrastructure)
├── managers/                     (State Containers — NOT under system/)
├── services/                     (High-Level APIs)
├── policies/                     (Access & Control Rules)
├── system/
│   ├── environments/
│   │   ├── platform/             (Platform Environments)
│   │   └── desktop/              (Desktop Environments)
├── storage/                      (Storage Drivers & LRFS)
├── application/                  (Application Framework)
├── sdk/                          (Developer Abstraction)
├── apps/                         (Userland Applications)
├── ui/                           (Desktop Shell UI Components)
└── developer/                    (Developer Tooling)
```
