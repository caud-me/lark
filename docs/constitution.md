# Lark OS 27 Constitution

This document defines the architectural rules of Lark OS 27.

These rules take precedence over implementation convenience. Architecture changes must always occur before feature additions. Any change that would violate these rules should be discussed before implementation.

---

# Rule 1 — Domain-First Architecture

The domain-first repository structure is canonical. 
The system is divided rigidly into domains (e.g., `kernel`, `platform`, `services`, `policies`, `apps`, `ui`). 
Code belongs in the domain that describes its responsibility, not the domain that currently consumes it.

---

# Rule 2 — The Dependency Hierarchy

The architecture is the foundation of Lark OS 27.
Dependencies must always flow downward. Do not bypass layers simply because it is easier.

```text
Applications
    ↓
Shell (Operating System UI)
    ↓
Services (Public APIs)
    ↓
Policies (Authorization & Rules)
    ↓
Managers (State & Infrastructure)
    ↓
Storage / Native APIs
```

Applications never communicate directly with Managers.
Managers never expose themselves directly to Applications.
UI components must never manipulate Managers directly. They rely on Services to orchestrate behavior.

---

# Rule 3 — One Responsibility Per Module

Every folder and every file should have one clear responsibility.
If a module begins solving unrelated problems, it should be split rather than expanded indefinitely.

**Strict SRP applies to every layer:**
* **WindowManager:** creates windows only.
* **Omni:** creates reusable generic UI primitives only.
* **Applications:** compose interfaces and own all application logic.
* **Shell:** orchestrates the operating-system interface (Desktop, Taskbar, Login).
* **SecurityPolicy:** the sole authorization authority for the filesystem and OS actions. Services must enforce its decisions, not invent new rules.

Each layer only fulfills requests. Never responsibilities belonging to another layer. No layer should know another layer's implementation details.

---

# Rule 4 — Prefer Extension Over Modification

When adding a new system capability, prefer creating new Services, Managers, or Applications instead of modifying unrelated existing modules.

The architecture should grow horizontally rather than becoming increasingly coupled.

---

# Rule 5 — Readability Over Cleverness

Write code that is easy to understand months later.
Avoid unnecessary shorthand, overly clever abstractions, or compressed one-line solutions.
Readable code is preferred over shorter code.

---

# Rule 6 — Stop Before Breaking the Architecture

If an implementation requires violating any architectural rule, stop and explain why before making the change.
Architectural decisions should be intentional, not accidental.

---

# Rule 7 — Temporary Code Must Stay Temporary

Debug tools, temporary workarounds, experimental implementations, and testing utilities must never become permanent architecture.

If temporary code remains useful, it should either:
* Be promoted into a proper architectural component, or
* Be removed once its purpose has been fulfilled.

---

# Rule 8 — Event-Driven Architecture

Whenever a subsystem performs a significant operating system action, it should emit an event through `SystemEventBus`.
Consumers subscribe to events independently. This keeps producers and consumers loosely coupled.

---

# Rule 9 — Application Lifecycle

All applications must be launched through `ProcessService`.
Applications must not manually create process records.
Process ownership must be tracked through PID.
When a process terminates, all owned resources must be cleaned up.

---

# Rule 10 — Application Intents

Runtime communication to already-running applications must use `ApplicationIntentService`.
Do not manually invoke `run()` multiple times on a singleton application. Provide file handoffs and other actions through standard intents (e.g., `open-file`).

---

# Rule 11 — Storage Abstraction

Applications and services must never depend on browser storage APIs.
Filesystem behavior belongs to LRFS.
Persistence mechanisms belong to storage drivers.

---

# Rule 12 — Platform Feature Model

Any new generic capability in the operating system should follow a four-part layered model:

1. **Discovery (Repository):** How does the OS know it exists? 
2. **State (Manager):** What is the current configuration or state? 
3. **Behavior (Service):** The safe public API for interactions.
4. **Presentation (Shell):** Handled purely via semantic events and shell-owned DOM.

The underlying principle is that the system state is decoupled from its presentation layer.

---

# Rule 13 — Extension over Modification

As the platform matures, **the Kernel stops managing lower-level subsystem registrations**. 
Instead, applications contribute functionality through the **Extension Framework**.

1. **Self-Describing Ecosystem:** Applications declare what they provide via their `extensions` array in the manifest.
2. **Discovery via ExtensionService:** Subsystems query `ExtensionService` to discover available implementations.
3. **Parent / Child Lifecycle Analogy:** The Kernel raises the core systems. Those systems manage their own children.

---

# Rule 14 — System Application Lifecycle

Complex applications should act as orchestrators rather than renderers. Presentation should be delegated to long-lived UI components that own their lifecycle and react independently to semantic platform events.

---

# Rule 15 — Application Architecture Agnosticism

The operating system defines application lifecycle contracts, not application folder structures.
Applications are free to organize their own internal architecture as long as they expose the expected entry point in their manifest.

---

# Rule 16 — Omni vs Shell Independence

**Omni** is the native component framework (buttons, cards, inputs). 
**Shell** is the operating system UI (Desktop, Taskbar, Window Chrome).

The Shell does **not** consume Omni. The Shell represents platform infrastructure, while Omni provides primitives for applications. They are strictly independent presentation domains.

---

# Rule 17 — No Hardcoded Presentation Colors

No application or platform component may hardcode presentation colors.
All UI text, backgrounds, borders, shadows, and interactive states must use semantic CSS variables defined by the Theme system (e.g., `var(--lde-bg-base)`).

---

# Rule 18 — Document the "Why" at API Boundaries

When fixing a bug caused by a tricky architectural boundary, a non-obvious lifecycle requirement, or an inherited data structure, always leave an inline "dangling comment" near the code.
