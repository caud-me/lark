# Lark OS 27 Constitution

This document defines the immutable architectural laws, engineering principles, security rules, and governance policies of Lark OS 27.

These rules take precedence over implementation convenience. Architecture changes must always occur before feature additions. Any change that would violate these rules is strictly forbidden.

---

## 1. Domain-First Architecture

The domain-first repository structure is canonical. The system is divided rigidly into domains (`kernel`, `system`, `storage`, `platform`, `services`, `policies`, `application`, `sdk`, `apps`, `ui`). 

Code belongs in the domain that describes its core responsibility, not the domain that currently consumes it.

---

## 2. The Architectural Layer Stack & Downward Dependency Law

The architectural layer stack is rigid and unalterable:

```text
Browser Host
  ↓
Firmware (Hardware Inventory & VM Identity)
  ↓
Kernel (Boot Orchestration, Kernel APIs, Kernel Handles, KernelResourceManager)
  ↓
Drivers (Display, Storage, Network, Audio, Keyboard, Pointer)
  ↓
Platform Services (WindowService, FileService, NetworkService, etc.)
  ↓
Capabilities
  ↓
Shell Components / Surfaces
  ↓
Applications
```

### Downward Dependency Law
Dependencies must flow strictly downward. Do not bypass layers.
- **Applications** communicate exclusively through **Services** and **Capabilities**. They never access **Kernel**, **Drivers**, or **Firmware** internals directly.
- **Platform Services** consume **Kernel APIs** (`KernelDisplayAPI`, `KernelStorageAPI`, `KernelNetworkAPI`, `KernelAudioAPI`, `KernelInputAPI`) and **KernelResourceManager**. Platform Services **may never** instantiate or access drivers, hardware, or firmware directly.
- **Kernel APIs** and **Kernel Handles** insulate Platform Services from driver implementations.
- **Shell Surfaces** subscribe exclusively to **Services**. They never import **Managers** directly.
- **Managers** depend only on low-level infrastructure. They never depend on **Services** or **Shell Surfaces**.

### Law — Layer Ownership
A module belongs to the **lowest layer that owns its lifetime and responsibility**, not the layer that merely consumes it.
Examples:
- `BootLogger` belongs to the Kernel because the Kernel owns the boot lifecycle.
- `DriverManager` belongs to the Kernel because the Kernel owns hardware.
- `BootOrchestrator` belongs to Platform because Platform owns the desktop startup workflow.
- `SystemVersion` belongs to System because it is immutable metadata.

A utility must never be promoted into a higher layer simply because multiple layers reference it. Ownership always takes precedence over convenience.

### Law — No Upward Dependencies
Lower architectural layers must never import higher architectural layers.
- **Allowed:** `Platform` $\rightarrow$ `Kernel API` $\rightarrow$ `Kernel` $\rightarrow$ `Firmware`
- **Forbidden:** `Kernel` $\rightarrow$ `System`, `Firmware` $\rightarrow$ `Platform`, `Storage` $\rightarrow$ `Policies`

If a lower layer requires functionality from a higher layer, the ownership of that functionality is incorrect and must be relocated to the appropriate lower layer.

### Law — No Circular Layer Dependencies
Architectural layers must never depend on each other in both directions.
- **Forbidden:** `Kernel` $\rightarrow$ `System` while `System` $\rightarrow$ `Kernel`.

Even if JavaScript resolves the imports correctly, this is considered an architectural violation. A layer graph must always remain a Directed Acyclic Graph (DAG).

---

## 3. Single Responsibility Principle (SRP) & The Terminal UI Test

Every class, module, and file must own exactly one responsibility. If a module accumulates unrelated concerns, it must be refactored into distinct components.

### The Terminal UI Test for Managers
Every `*Manager` class must manage pure, headless domain state and pass the **Terminal UI Test**:
> *"If I replaced the desktop with a terminal UI tomorrow, would this Manager still work?"*
- **Yes**: The Manager manages pure domain state.
- **No** (because it creates DOM elements, injects CSS, or binds browser rendering APIs): The Manager owns rendering and violates SRP. Rendering belongs exclusively to **Shell Surfaces**.

---

## 4. Ownership & Rendering Invariants

Every responsibility inside Lark OS has exactly one owner:

- **Managers** own runtime state.
- **Services** own public APIs.
- **Orchestrators** own workflows (they coordinate existing Services and Managers, but do NOT own persistent runtime state).
- **Shell Surfaces** own rendering.
- **Capabilities** own authorization.
- **The Kernel** owns infrastructure.

> **Ownership Law:** **Ownership is never shared.** Components communicate through public APIs rather than manipulating another layer's internal state.

> **Shell Invariant:** **Shell Surfaces never contain business logic. They render platform state exposed by Services.**

---

## 5. Event Ownership & Observability Laws

Whenever a platform subsystem performs a significant state transition, it emits a semantic event through `SystemEventBus`.

> **Single Authoritative Emitter Law:** **Every domain event has exactly one authoritative emitter.** (e.g. `window.*` events are emitted exclusively by `WindowService`/`WindowManager`; `dialog.changed` is emitted exclusively by `DialogService`).

> **Encapsulation Law:** Kernel `EventBus` access is private infrastructure. Public Services encapsulate `EventBus` by exposing strongly-typed semantic observation APIs (`onFocused`, `onClosed`, `onDialogChanged`, `onChange`) returning clean unsubscribe closures.

---

## 6. Implicit Process Authority Binding & Sandboxing

Applications and untrusted callers cannot supply authority parameters (such as Process ID / `pid` or security `context` overrides) through public platform service APIs.

All public API boundaries (`FileService`, `CapabilityService`, `WindowService`, `ProcessService`) derive identity context implicitly from the calling process's scoped service registry boundary. The platform enforces authority binding strictly at the service wrapper level, preventing cross-process identity spoofing attempts.

---

## 7. Security & Text-by-Default Rendering Policy

`SecurityPolicy` is the sole authorization authority for filesystem and platform access. Services enforce `SecurityPolicy` decisions rather than inventing custom rules.

### Text-by-Default Rendering Law
Shell-owned UI must treat all runtime values as untrusted unless they originate from compile-time static markup. Dynamic values must be rendered using non-parsing DOM APIs (`textContent`, `setAttribute`, `appendChild`) rather than HTML-parsing DOM APIs (`innerHTML`, `outerHTML`).

---

## 8. Storage Abstraction & Virtual Filesystem

Applications and platform services must never directly invoke raw browser storage APIs (`localStorage`, `indexedDB`).
- All filesystem operations are abstracted through the Virtual Filesystem (`LRFS`).
- Physical persistence mechanisms belong exclusively to Storage Drivers (e.g., `LocalStorageDriver`).

---

## 9. Application & Process Lifecycle

- All applications must be spawned through `ProcessService`. Processes must never be manually constructed.
- Process ownership is tracked through unique Process IDs (`pid`).
- When a process terminates, all owned resources (windows, timers, temporary handles) must be automatically reclaimed by the OS.
- Cross-process runtime communication must use `ApplicationIntentService`.

---

## 10. Platform Feature Architecture Model

Any generic capability added to Lark OS must conform to the four-part layered model:
1. **Discovery (Repository / Manifest)**: How does the OS discover the capability?
2. **State (Manager)**: Headless runtime state container.
3. **Behavior (Service)**: Safe, permission-aware public API.
4. **Presentation (Shell Surface)**: Rendered purely via semantic events and shell-owned DOM elements.

---

## 11. Extension Framework & Self-Describing Ecosystem

The Kernel does not hardcode third-party subsystem registrations. Instead, applications advertise capabilities via their manifest `extensions` array. Platform subsystems discover and consume extensions dynamically via `ExtensionService`.

---

## 12. Omni vs. Shell Independence

- **Omni** (`lark/ui/`) is the native application component framework (buttons, cards, input fields) intended for user-space applications.
- **Shell** (`lark/platform/desktop/shell/`) represents operating system infrastructure UI (Taskbar, WindowSurface, DialogSurface, NotificationSurface).

The Shell does **not** import Omni components. Platform infrastructure UI and application UI primitives are strictly independent presentation domains.

---

## 13. Theme Variable Standardization

No application or platform component may use hardcoded color hex values or static inline styling for background, text, or border colors. All presentation elements must use semantic CSS variables (`var(--lde-bg-base)`, `var(--lde-text-primary)`, `var(--lde-accent)`) defined by the OS Theme Framework.

---

## 14. Code Readability & Beginner-Friendly Architecture

- **Readability Over Cleverness**: Code must be explicit and self-documenting. Avoid dense shorthand, nested ternary chains, or compressed one-liners.
- **Deferred Implementation Principle**: Build architecture first, then public APIs, then wire integrations. If an actual feature implementation belongs to a future phase, use the exact phrase `'⚠️ work in progress'` as a placeholder rather than simulating fake logic.
- **Document the "Why"**: Document non-obvious design decisions, boundary rules, and non-goals using clear JSDoc class headers and inline comments.

---

## 15. Platform Stability Policy (Series 10 Baseline)

> **LDE Platform Status: 27.10.1 — Series 10, Platform Stable.**
> The platform architecture is considered stable. New capabilities are added to existing owners without violating layer boundaries. Audits at this stage confirm implementation correctness, not architectural validity. Breaking architectural changes require a new major architecture milestone.

---

## 16. Developer Audit Principle

Repetitive architectural verification should be automated whenever practical.

If a rule can be checked deterministically by tooling, prefer implementing it as part of the **Developer Audit Toolkit** (`tools/audit/`) rather than relying solely on manual inspection.

Human review remains responsible for design quality, while audit tools are responsible for validating measurable architectural constraints.

---

## 17. Deterministic Execution Law

Every architectural component must either:

* fulfill its documented contract, or
* fail explicitly through the platform error pipeline.

Components must never silently substitute alternate values, default implementations, compatibility paths, legacy behavior, or swallowed exceptions merely to continue execution.

The operating system models valid operational states (e.g. offline network, unmounted volume, disabled capability, Safe Mode) explicitly. Silent fallbacks (`|| []`, `|| {}`, `?? default`, `|| new Class()`, or swallowed `catch` blocks) that disguise missing dependencies or broken execution paths are strictly forbidden.

---

## 18. Architectural Ownership Law

Every source file, platform environment, policy, manager, and application in Lark OS must have explicit architectural ownership.

- **Platform Environments** must be registered in `PlatformEnvironmentRegistry.js` or actively imported by an environment orchestrator.
- **Applications** in `lark/6-apps/` must be registered in `AppRegistry.js` / `official.json` repository manifest or imported by a system loader.
- **Policies** in `lark/4-policies/` must have active consumers in platform or kernel code.
- **Managers** must be wrapped by a registered Service or owned by a kernel/boot context.

Components that lose architectural ownership are considered orphaned debt and must be refactored or purged.

---

## 19. Governance & Enforcement (Developer Audit Toolkit Mapping)

Governance (Constitutional Laws) binds directly to Enforcement (Audit Tooling). Every sub-auditor in the **Developer Audit Toolkit** (`python tools/audit/audit.py`) exists to statically enforce one or more Constitutional Laws:

```text
Constitution (Governance Law)
       ↓
Audit Command (Enforcement CLI)
       ↓
Python Implementation Tool
```

### Constitutional Law to Enforcement Tool Mapping

| Constitutional Law / Principle | Audit Command | Python Tool | Description |
| :--- | :--- | :--- | :--- |
| **Layer Ownership Law** (Section 2) | `audit.py architecture` | `architecture_audit.py` | Validates numbered 10-layer hierarchy & entry points |
| **Downward Dependency Law** & **No Circular Dependency Law** (Section 2) | `audit.py dependencies` | `dependency_audit.py` | Scans ES module imports for layer boundary violations |
| **Service Registration Law** (Section 4) | `audit.py services` | `service_registry_audit.py` | Inspects `ServiceRegistry` entries for duplicate keys |
| **Architectural Discovery Principle** (Section 10) | `audit.py manifest` | `manifest_audit.py` | Generates system architectural index & instant search |
| **Asset Integrity Principle** (Section 15) | `audit.py assets` | `assets_audit.py` | Validates asset paths and fonts against physical disk |
| **Public API Stability Principle** (Section 4) | `audit.py api` | `api_audit.py` | Generates & compares public service method contracts |
| **Deterministic Execution Law** (Section 17) | `audit.py fallbacks` | `fallback_audit.py` | Scans codebase for non-deterministic fallback patterns |
| **Architectural Ownership Law** (Section 18) | `audit.py orphans` | `orphan_audit.py` | Scans for unlinked platform environments, apps, and policies |

---

## 20. Developer Assistance Principle

Developer tools exist to reduce cognitive load rather than architectural rigor. They may summarize, explain, critique, and visualize the system, but they must never weaken constitutional guarantees or modify source code automatically.

---

## 21. Temporary Feature Isolation Principle

Temporary features may depend on the operating system, but the operating system must never depend on temporary features. Experimental or transitional features must own all of their data, UI, and registrations. Their complete removal should require only deleting the feature itself and unregistering it, without modifying unrelated subsystems.

### Section 21.1 — No Architectural Gravity
Temporary features must not accumulate architectural gravity. They may not become required dependencies for future features, services, or workflows. Their removal must not require behavioral changes outside their own registration boundary.

### Section 21.2 — Constitutional Sunset Clause
At the start of every new Series, all components marked `temporary: true` must be reviewed. Each component must either be removed, have its temporary lifetime extended with documented justification, or be redesigned as permanent architecture under the normal constitutional process.

---

## 22. Declarative Logic Convention

Deterministic logic, geometry calculations, decision trees, and state transitions must be declared as pure, top-level declarative structures or formulas before procedural execution code begins. The algorithm must be readable independently of event handling and DOM rendering.

---

## 23. Architectural Traceability Principle

Every significant platform operation should be traceable through deterministic architectural relationships. Developer tooling may reconstruct execution paths using declared architectural conventions, but must never infer behavior beyond predictable static patterns.

---

## 24. Hardware Capability Gating Principle

Browser capabilities represent simulated hardware. Platform Services must consume hardware state exclusively through Kernel Drivers. Firmware owns capability discovery, Kernel Drivers own operational state, and Platform Services own feature behavior. Hardware capability must never be duplicated across architectural layers.

---

## 25. Presentation Integrity Principle

User interface presentation must be deterministic, semantic, and framework-governed. Platform components must render through approved rendering patterns and semantic Omni Framework classes. Inline presentation logic, inline styling, and unsafe HTML injection are prohibited unless explicitly authorized by platform policy.

### Section 25.1 — Semantic Styling Law
Presentation styling belongs to the Omni Framework. Components shall express intent through semantic CSS classes (`omni-panel`, `omni-window`, `omni-toolbar`, `omni-sidebar`) rather than directly manipulating visual appearance.

### Section 25.2 — No Inline Appearance Style Law
CSS owns visual appearance (colors, fonts, backgrounds, borders, shadows). JavaScript owns geometry and interaction (dynamic `top`, `left`, `width`, `height`, drag `transform`, animation state). Setting visual appearance via inline styles or direct `.style.*` property assignment is strictly prohibited.

### Section 25.3 — Trusted Rendering Law
Unsafe DOM rendering patterns (`document.write`, `Range.createContextualFragment`, unescaped variable injection) are prohibited. User-controlled data must default to safe text rendering or structured DOM element creation.




