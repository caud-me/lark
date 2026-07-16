# Architecture Principles

The Lark Desktop Environment (LDE) is built on a specific set of architectural principles. By following these, your applications will remain secure, performant, and aligned with the platform.

## 1. Applications do not access Managers
Applications run in an isolated `ApplicationContext`. You should never attempt to import or instantiate a `Manager` (e.g., `WindowManager`, `DiskManager`). Instead, applications request actions via **Services** and **Capabilities**.

## 2. Capabilities enforce Security
LDE uses a Capability Framework (`dialog:show`, `network:fetch`, etc.). If your application needs to do something outside its sandbox, it must declare that permission in its `manifest.json`.

## 3. The EventBus is for Inter-App Communication
Do not pass references between applications. If an application needs to broadcast state, it uses the global `EventBus`.

## 4. Extensions are Declarative
If you want to integrate with the OS (like adding a Widget or a Search Provider), you declare it in your manifest. The OS will instantiate your component when it needs it, keeping the shell lightweight.

## 5. UI is Component-Based
While you can build UI however you want inside your window, LDE provides `ApplicationComponent`. Composing small, isolated components with their own lifecycle is the recommended approach.
