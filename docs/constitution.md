# LDE 27 Constitution

This document defines the architectural rules of LDE 27.

These rules take precedence over implementation convenience. Any change that would violate these rules should be discussed before implementation.

---

# Rule 1 — Respect the Architecture

The architecture is the foundation of LDE.

Do not bypass layers simply because it is easier.

Dependencies must always flow downward.

```text
Applications
    ↓
Services
    ↓
Policies
    ↓
Managers
    ↓
Storage / UI
    ↓
Browser APIs
```

Applications never communicate directly with Managers.

Managers never expose themselves directly to Applications.

Browser APIs (`localStorage`, DOM APIs, etc.) should always remain behind an abstraction layer.

---

# Rule 2 — One Responsibility Per Module

Every folder and every file should have one clear responsibility.

If a module begins solving unrelated problems, it should be split rather than expanded indefinitely.

---

# Rule 3 — Prefer Extension Over Modification

When adding a new system capability, prefer creating new Services, Managers, or Applications instead of modifying unrelated existing modules.

The architecture should grow horizontally rather than becoming increasingly coupled.

---

# Rule 4 — Readability Over Cleverness

Write code that is easy to understand months later.

Avoid unnecessary shorthand, overly clever abstractions, or compressed one-line solutions.

Readable code is preferred over shorter code.

---

# Rule 5 — Stop Before Breaking the Architecture

If an implementation requires violating any architectural rule, stop and explain why before making the change.

Architectural decisions should be intentional, not accidental.

---

# Rule 6 — Temporary Code Must Stay Temporary

Debug tools, temporary workarounds, experimental implementations, and testing utilities must never become permanent architecture.

If temporary code remains useful, it should either:

* Be promoted into a proper architectural component, or
* Be removed once its purpose has been fulfilled.

Production architecture should never depend on debugging or testing code.

---

# Rule 7 — Event-Driven Architecture

Whenever a subsystem performs a significant operating system action, it should emit an event through `SystemEventBus`.

Subsystems should never assume who is listening.

Consumers (such as `SyslogService`) subscribe to events independently.

This keeps producers and consumers loosely coupled.

---

# Rule 8 — Application Lifecycle

All applications must be launched through `ProcessService`.

Applications must not manually create process records.

Process ownership must be tracked through PID.

When a process terminates, all owned resources must be cleaned up.

---

# Rule 9 — Command Architecture

Commands must never bypass public services.

A command requiring new functionality must extend an existing service rather than directly accessing internal components.

Terminal is not privileged compared to other applications.

---

# Rule 10 — Storage Abstraction

Applications and services must never depend on browser storage APIs.

Filesystem behavior belongs to LRFS.

Persistence mechanisms belong to storage drivers.
