# Presentation Architecture

This document defines the canonical presentation architecture for Lark OS 27 (Series 6 and beyond).

The presentation layer is strictly divided into three distinct architectural concerns:

```text
Design Language
├── Omni
│     primitive components
│
├── Shell
│     operating system UI
│
└── Design
      visual language
```

This is not merely a CSS methodology—it defines architectural responsibilities and dependency direction.

## 1. Omni

### Purpose
Omni is the native component framework for Lark OS. It provides reusable, primitive UI components that can be composed to build complex interfaces.

**Omni does NOT know anything about applications or the operating system.** It only answers generic requests like *"Give me a card"* or *"Give me a button."*

### Component Boundaries
Omni components must remain purely structural and generic.

**Examples of GOOD components (Primitives):**
* `omni_card()`
* `omni_button()`
* `omni_sidebar()`
* `omni_listItem()`
* `omni_preferenceItem()`
* `omni_searchbox()`
* `omni_input()`
* `omni_selectbox()`

**Examples of BAD components (Domain-Coupled):**
* `omni_taskbar()` — This is a Shell concept.
* `omni_settingsSection()` — This is an Application concept.
* `omni_shell()` — This is a Shell concept.
* `omni_desktop()` — This is a Shell concept.
* `omni_fileManagerSidebar()` — This is an Application concept.

---

## 2. Shell

### Purpose

The Shell is the operating system's presentation layer.

It is **not** built using the Omni framework.

The Shell has its own architecture, lifecycle, styling, and rendering responsibilities because it represents platform infrastructure rather than an application.

Examples include:

* Desktop
* Taskbar
* Login Screen
* Recovery Environment
* OOBE / Welcome
* Shutdown UI
* System Dialogs
* Wallpaper
* Boot Environment

These are platform components, not application components.

---

### Relationship with Omni

Shell and Omni are completely separate presentation systems.

```
Applications
      │
      ▼
   Omni Framework
      │
      ▼
 Browser DOM

Shell
      │
      ▼
 Browser DOM
```

Neither depends on the other.

The Shell never imports Omni components.

Omni never imports Shell functionality.

Both ultimately render to the browser DOM, but they solve different problems.

---

### Design Philosophy

The Shell is responsible only for operating-system presentation.

It should never contain reusable application widgets.

Likewise, Omni should never contain operating-system concepts.

Examples:

✅ Shell

* Taskbar
* Desktop
* Login Screen
* Recovery
* Window chrome
* Workspace switching

✅ Omni

* Card
* Button
* Sidebar
* List Item
* Input
* Select Box
* Search Box

The distinction is intentional:

> **Shell builds the operating system. Omni builds applications.**

---

## 3. Design (CSS Split)

### Purpose
Lark OS separates layout from appearance. Instead of one gigantic `theme.css`, responsibilities are separated into distinct files to allow for scalable theming.

### `omni.css`
Handles pure structural layout. Future themes should rarely need to modify this file.
* Layout
* Flex
* Spacing
* Sizing
* Structure

**Example:**
```css
.comp-searchbox {
    display: flex;
    flex-direction: row;
    gap: var(--gap-by8);
    padding: var(--padding-by8);
}
```

### `design.css`
Handles the visual language. Future themes will primarily replace or modify this file.
* Colors
* Visual language
* Shadows
* Animations
* Borders
* Typography

**Example:**
```css
.comp-searchbox {
    background: var(--lde-bg-input);
    border: 1px solid var(--lde-border-default);
    box-shadow: var(--lde-shadow-sm);
}
```
