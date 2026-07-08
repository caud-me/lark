# LDE 27 Architecture

This document describes the high-level architecture of LDE 27.

## Core Philosophy

LDE 27 is built strictly on the **Single Responsibility Principle**.
Components are divided into three rigid layers:
1.  **Managers**: Low-level infrastructure and system state.
2.  **Services**: High-level public APIs and policy enforcers.
3.  **Applications**: UI clients that only communicate with Services.

## System Namespace

The `src/system/` namespace contains global OS identity, constants, and immutable metadata.
*   **SystemVersion.js**: The single source of truth for the OS version and codename.

## Managers
Managers maintain underlying OS infrastructure and native states.
*   **ProcessManager**: Maintains the internal process table and PID map.
*   **WindowManager**: Manages the `#lde-window-layer` DOM element and z-index compositor.
*   **DialogManager**: Manages the `#lde-dialog-layer` DOM element for OS-level blocking overlays.
*   **IPCManager**: Routes messages between isolated execution contexts.

## Services
Services consume managers, enforce policies, and expose safe APIs to Applications.
*   **ProcessService**: Interacts with `ProcessPolicy` before instructing `ProcessManager` to spawn or kill.
*   **WindowService**: Creates structured window containers and binds events.
*   **DialogService**: Exposes promise-based `alert()`, `confirm()`, and `prompt()` APIs to applications.
*   **FileService**: Exposes high-level read/write/delete operations abstracted over `StorageDriver`.

Applications must use `DialogService` instead of native `window.alert`, `window.confirm`, or `window.prompt` to ensure consistent lifecycle and event handling.

## Versioning Scheme
LDE uses a custom OS release numbering scheme defined centrally in `SystemVersion.js`. The schema is intrinsically tied to the development lifecycle:
* **27** - Year Generation (e.g., 2027)
* **1** - Milestone (Series)
* **20** - Phase Completion
* **0** - Hotfix (post-phase patches)

For example, `27.1.20.0` signifies LDE 27, Series 1, Phase 20, with 0 hotfixes.
Each Series may also have a whimsical codename (e.g., "Waffle") intended to give the release personality. The Service Worker cache version (e.g., `v36`) is intentionally decoupled from the OS version.

## Directory Structure

```text
src/
    ├── apps/               # User-space applications (Terminal, FileManager, Settings)
    ├── ui/                 # Shared UI primitives (WindowFrame, SettingsComponents)
    ├── kernel/             # Bootloader, Event Bus, Registries
    ├── system/             # Global OS Identity and Constants (SystemVersion.js)
    ├── managers/           # Infrastructure Managers (WindowManager, ProcessManager, DialogManager)
    ├── services/           # Business Logic & APIs (FileService, WindowService, DialogService)
    ├── boot/               # Initial DOM mounting
```
