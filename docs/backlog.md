# Project Rule – Deferred Implementations

From this point forward, any feature, improvement, optimization, or architectural idea that is identified but falls outside the current phase must **not** be implemented immediately.

Instead:

1. Add it to `/docs/backlog.md`.
2. Briefly explain why it is being deferred.
3. If applicable, suggest the phase where it would naturally belong.
4. Continue implementing only the approved scope of the current phase.

The goal is to prevent scope creep while ensuring good ideas are never lost.

Examples of items that belong in the backlog:

* Future OS services
* Performance optimizations
* UI improvements
* Architectural refinements
* Advanced window management
* Filesystem enhancements
* Package management
* Accessibility features
* Multi-user support
* Plugin systems

`backlog.md` is a planning document, not an implementation checklist. Features should only move from the backlog into development when they become part of an approved phase.

---

# LDE 27 Backlog

Ideas captured here are intentionally deferred.

---

# Window System
* Context menu
* Widgets
* Multiple wallpapers
* Multi-monitor support
* Dock indicating running apps and allowing restoration of minimized windows
* Advanced Window Policies (always-on-top, modal windows, parent/child windows)

---

# Storage

* Full disk snapshot storage
* Full disk restoration / Time Machine style backups
* Disk import/export
* Disk repair tools
* Storage compression
* Disk format migration tools

---

# LRFS

* File permissions
* Symbolic links
* Journaling
* Snapshots (Time Machine)
* Restore points
* Search indexing
* Disk quota monitoring
* Recursive directory renaming
* Recursive directory deletion

---

# Applications

* Package installation
* Application uninstall
* Application updates
* LRFS-based application discovery
* Default application selection
* File association editor

---

# Process System

* Background applications
* Startup applications
* Process priorities

---

# LDE 27 Series 1 Backlog

## Completed
*   [x] File System Drivers
*   [x] Process & Window Managers
*   [x] CLI Terminal
*   [x] Desktop UI
*   [x] Event Viewer
*   [x] Application Registry metadata mapping
*   [x] Unified Settings UI
*   [x] OOBE Multi-step Wizard
*   [x] Dialog Subsystem
*   [x] Series 1 Architecture Freeze (v1.0.0 Waffle)

---

# Settings

* Settings application
* Theme system
* Accent colors
* Appearance customization

---

# Performance

* Lazy application loading
* Window virtualization
* Asset optimization
* Cache management

---

# Developer Experience

* Developer Tools
* Event Viewer
* Task Manager
* Logging console
* Debug overlay
* Plugin system

---

# Future Ideas

* IndexedDB storage driver
* Cloud storage driver
* Accessibility framework
* Localization / Internationalization
* Scripting / Automation API

---

# Logging

* Persistent volume management
* Disk partitioning simulation
* Symbolic links
* Live log streaming
* Crash reports
* Log rotation
* Log retention policies

---

# Process Management

* CPU usage tracking
* Memory estimation
* Process priority
* Process tree visualization
* User permissions
* User-configurable startup applications (via Settings)

---

# User & Session Management

* Advanced Access Control Lists (ACLs) with group-level permissions
* Multi-user concurrent sessions (Switch User capability)
* File permission modifying commands (`chmod`, `chown`)
* True `root` or `admin` role elevation for standard users (e.g., `sudo`)
* Persistent sessions (e.g., tokens or cookies) across browser reloads
* Password hashing and encryption
* Suspend / Sleep (Requires state serialization)

---

# Event System & Communication

* Notification history UI
* Notification actions (buttons)
* Advanced IPC request/response patterns
* Clipboard integration
* Plugin/event hooks
* Automation/event scripting
* Telemetry subscribers

---

# Terminal System

* Command history persistence
* Tab completion
* Command aliases
* Pipes
* Shell scripting
* Environment variables
* Shell extensions


## Series 2 Architecture Features
- Dynamic `/system/apps.json` Manifest Loading
- Network, Applications, Privacy, and Updates Settings Panels
- Plug-in capability for Kernel Boot stages
