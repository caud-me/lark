# Architectural Evolution

This document serves as a chronological record of the major architectural shifts across Lark OS 27 development series. It provides high-level context on why and when significant changes occurred.

---

## Series 1
**Desktop foundation**
Established the initial graphical shell, taskbar, wallpaper, and basic window manager capabilities.

## Series 2
**Boot architecture**
Introduced the `BootService`, Environment mapping, and the distinction between Platform Environments (Login, Lock) and Desktop Environments.

## Series 3
**Application runtime**
Formalized the `BaseApplication` and `ApplicationComponent` lifecycle. Shifted from single-file scripts to a structured MVC-like UI orchestration approach.

## Series 4
**SDK**
Defined public interfaces and the Capability framework. Allowed applications to communicate with OS services without tight coupling to internal Managers.

## Series 5
**Operating system architecture**
The project graduated from an experimental desktop into a structured OS. 
- Introduced a strict Domain-First repository layout (`kernel`, `platform`, `services`, `policies`).
- Established `SecurityPolicy` as the sole authorization authority for the filesystem permission matrix.
- Separated `PackageService` (`/packages`) from source applications.
- Formalized the Omni component framework as the native primitive UI foundation, distinctly separate from the Shell.

## Series 6
**Omni Design Language**
(Active Series) Focuses entirely on the presentation layer, separating structural layout (`omni.css`) from visual language (`design.css`), and building robust native components.
