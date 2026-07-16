# Lark Desktop Environment (LDE)

LDE is a web-based desktop environment built with a modular, layered architecture.

## Learning Path (Architecture Documentation)

LDE is built on a strict layered architecture to prevent spaghetti code and maintain stability. If you are new to the project, please read the documentation in this specific order to understand how LDE is built:

1. **[The LDE Cake](docs/architecture/LDE_CAKE.md)**: Start here. This document explains the high-level layers of the OS (Bootloader -> Kernel -> Services -> Environments -> Apps) and the dependency rules between them.
2. **[The Constitution](docs/constitution.md)**: Read the guiding principles and rules that govern all code contributions.
3. **[Runtime Hierarchy](docs/architecture/lde_runtime_hierarchy.md)**: Understand the concrete lifecycle components, from Platform Environments to Desktop Shells.
4. **[SDK Documentation](docs/sdk/)**: Learn how to build applications on top of the established OS APIs.

## Directory Structure

* **`src/kernel/`** → Core initialization and registries.
* **`src/system/managers/`** → Internal state orchestration.
* **`src/system/environments/`** → High-privilege platform and desktop execution contexts.
* **`src/policies/`** → System security and operational rules.
* **`src/services/`** → Public OS APIs.
* **`src/sdk/`** → Developer-facing SDK.
* **`src/apps/`** → Userland applications.
