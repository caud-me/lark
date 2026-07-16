# Application Architecture Guidance

This document provides recommended architectural guidance for building applications in Lark OS 27. 

These are guidelines and best practices, not strict rules.

---

## 1. Application Philosophy

Applications are self-contained orchestrators. They pull together primitive components, attach behavior, and manage state. 

The typical flow of a single-file application or primary entry-point is:

```text
Application
    │
    ├── imports (Services, Omni components)
    │
    ├── optional styleblock (App-specific overrides)
    │
    ├── application logic (State, Event Handlers, Data Fetching)
    │
    └── DOM assembly (Composing the final HTML)
```

```javascript
// 1. Imports
import { EventBus } from '../../kernel/SystemEventBus.js';
import { omni_card, omni_button } from '../../ui/omni/omni.js';

// 2. Styleblock (Optional)
const styleblock = `
    .app-specific-class {
        margin-top: 16px;
    }
`;

// 3. Application Logic
class MyApplication {
    // State, event handlers, and data fetching
}

// 4. innerHTML / DOM Assembly
const html = `
    <style>${styleblock}</style>
    <div class="app-specific-class">
        ${omni_card('Content goes here')}
    </div>
`;

// 5. Exports
export default {
    run: async (registry, args) => { ... }
};
```

### Styleblock Rules
The `styleblock` is strictly for **application-specific styling** (e.g., custom grids, specific alignment overrides). 
Native Omni components should already look correct by default. Applications should not override component styling (like standard button colors or card shadows) unless absolutely necessary.

---

## 2. Hybrid Rendering Model

Lark OS encourages a hybrid rendering model where applications mix raw, native HTML with Omni component generators.

**Example:**
```javascript
let html = 
    `<h3>Storage</h3>` 
    + 
    omni_card(
        omni_listItem({ title: 'System Drive' }) 
        + 
        omni_input({ placeholder: 'Search...' })
    );
```

**Why this exists:**
This approach allows developers to write native, standard HTML where appropriate (like simple headers or containers) while seamlessly injecting complex, reusable native components—all without requiring a heavy Virtual DOM (like React or Vue) or build step.

---

## 3. Application Responsibilities

The Single Responsibility Principle (SRP) applies to applications just as it does to the OS. 

To reinforce the boundaries:
* **WindowManager** owns windows.
* **Omni** owns components.
* **Applications** own behavior.
* **Shell** owns the OS experience.

**Applications OWN:**
* Business logic
* Event handlers
* Data fetching
* Internal state
* DOM assembly (composing the interface)

**Applications do NOT own:**
* Window creation (Delegated to `WindowService` / `WindowManager`)
* Shell behavior (Delegated to the Shell)
* Native application component implementation (Delegated to Omni)
* Global styling (Delegated to `design.css` and `omni.css`)

---

## 4. Migration State (Series 6)

Lark OS 27 is currently transitioning to the Omni framework. 

Legacy, domain-specific component folders are now **deprecated**. 
Examples of deprecated patterns include:
* Settings components (`src/apps/system/settings/components/`)
* File Manager components (`src/apps/system/filemanager/components/`)
* Software Center components

These bespoke, app-specific UI components are actively being replaced by generic Omni primitives to ensure visual consistency across the entire operating system.
