# Lark OS Security & Authorization

This document is the canonical reference for Lark OS 27 filesystem security, permissions, and authorization rules. It defines how access is granted, how decisions are enforced, and who holds the authority.

---

## 1. Overview

Lark OS uses a strictly centralized, policy-based authorization architecture. 

The core philosophy is that **`SecurityPolicy` is the single source of truth** for all authorization decisions. Other system components, such as `FileService`, do **not** make authorization decisions. Services exist solely to fetch the necessary context and enforce the final decisions returned by the policy.

Policies do not hold state themselves. Instead, they dynamically evaluate context (such as the user's role, elevation status, and target path) alongside filesystem metadata (such as ownership) to return an explicit outcome: `ALLOW`, `DENY`, or `REQUIRES_ELEVATION`.

---

## 2. Security Flow

The authorization flow is strictly unidirectional, preventing "split-brain" security implementations across multiple services.

```text
Application
        │
        ▼ (Requests filesystem action)
 FileService
        │
        ▼ (Collects context, path, and metadata)
 SecurityPolicy
        │
        ▼ (Evaluates logic)
 Allow / Deny / Requires Elevation
        │
        ▼ (Enforces result)
 FileService
```

In this architecture, **ownership is policy input, not authorization logic**. Services collect metadata and pass it to the policy. The policy is the only component that decides whether ownership satisfies a security requirement.

---

## 3. Permission Matrix

The following matrix represents the canonical filesystem access rules enforced by `SecurityPolicy`.

| Directory | SYSTEM (Kernel) | ADMIN (Elevated) | USER (Standard) | Packages (Runtime) |
|---|---|---|---|---|
| `/system` | RW | Read | Read | Inherited Context |
| `/platform` | RW | Read | Read | Inherited Context |
| `/kernel` | RW | Read | Read | Inherited Context |
| `/config` | RW | RW | Read | Inherited Context |
| `/packages` | RW | RW | Read | Inherited Context |
| `/users/<user>` | RW | No (Policy Only) | RW (If Owner) | Inherited Context |
| `/tmp` | RW | RW | RW | Inherited Context |
| `/snapshots` | RW | Read | No | Inherited Context |

*Note: Any structural paths not explicitly defined in the matrix default to **DENY**.*

---

## 4. Roles

Lark OS uses runtime roles to categorize execution privileges:

* **SYSTEM**: Unrestricted. The highest privilege level, reserved for the Kernel and core OS infrastructure operations (such as initial provisioning). 
* **Administrator (Elevated)**: High-privilege maintenance role. Capable of modifying system configurations (`/config`) and managing installed software (`/packages`), but restricted from mutating immutable runtime directories (e.g., `/kernel`, `/system`).
* **Standard User**: The default interactive role. Confined entirely to their personal workspace (`/users/<user>`) and temporary directories (`/tmp`).
* **Package Runtime**: Packages **do not** possess independent filesystem privileges. They inherit the exact security context and role of the user that launched them. (e.g., A package launched by a Standard User can only write to that user's home directory).

---

## 5. Architectural Rules

When auditing, extending, or maintaining the security architecture, the following non-negotiable rules apply:

1. **`SecurityPolicy` is the only authorization authority.** No other component may independently decide what is allowed or denied.
2. **Services must never duplicate permission logic.** Services are enforcers, not evaluators.
3. **Metadata is input, not policy.** A file's owner does not implicitly grant access; the policy decides if the owner has access.
4. **Unknown structural paths should default to DENY.** Strict allow-listing ensures that new structural directories are purposefully modeled rather than accidentally exposed.
5. **Security rules should remain centralized.** Future revisions must update this document first, and then implement the changes within `SecurityPolicy` rather than scattering access checks throughout the repository.

---

## 6. Future Expansion

As the operating system matures, the security model is intended to expand. The following features represent the roadmap for future security enhancements that will be governed by this document:

* **ACLs:** Advanced Access Control Lists for fine-grained file permissions.
* **Group Permissions:** Defining access across multiple users.
* **Package Sandboxing:** Confining applications to strict execution constraints.
* **Capability-Based Permissions:** Shifting from pure path-based access to explicit OS capability requests.
* **Digital Signatures:** Cryptographic verification of packages and extensions.
* **Fine-Grained Package Permissions:** Moving beyond inherited contexts to restrict applications based on declared manifest permissions.
* **Network Permissions:** Regulating application access to external environments.
