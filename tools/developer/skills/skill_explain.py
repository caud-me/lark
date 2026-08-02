#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
skill_explain.py - Developer Platform Skill: Explain
Release 27.8.15 - Developer Platform & Self-Describing Skills

Generates an instant, natural architectural summary of any class, manager, or service
to give AI assistants and developers immediate understanding of a component before reading files.
"""

import os
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent.parent
MANIFEST_PATH = ROOT / "tools" / "audit" / "output" / "architecture_manifest.json"

SKILL_METADATA = {
    "name": "Explain",
    "command": "dev.py explain <Symbol>",
    "category": "Architectural Context",
    "purpose": "Generates an instant architectural overview and context profile of any symbol.",
    "inputs": "Symbol name (e.g. WindowService, FileService, DriverManager)",
    "outputs": "Human & AI readable context profile (Responsibility, Owner, Layer, Dependencies, Consumers, Laws)",
    "read_only": True,
    "constitution": "Section 10 (Architectural Discovery Principle) & Section 20 (Developer Assistance Principle)"
}

def load_manifest():
    if not MANIFEST_PATH.exists():
        # Auto-trigger manifest generation if missing
        audit_dir = ROOT / "tools" / "audit"
        if str(audit_dir) not in sys.path:
            sys.path.insert(0, str(audit_dir))
        import manifest_audit
        manifest_audit.run_manifest()

    try:
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"[ERR] Failed to read architecture manifest: {e}")
        return {}

def find_inbound_consumers(symbol_name, manifest):
    consumers = []
    symbol_lower = symbol_name.lower()

    for cls_name, item in manifest.items():
        if cls_name.lower() == symbol_lower:
            continue
        # Check imports or method signatures
        for imp in item.get("imports", []):
            if symbol_name in imp or symbol_lower in imp.lower():
                consumers.append(cls_name)
                break
    return sorted(list(set(consumers)))

def find_service_registration(symbol_name):
    boot_dir = ROOT / "src" / "1-kernel" / "boot"
    if not boot_dir.exists():
        return None

    for root, _, files in os.walk(boot_dir):
        for f in files:
            if not f.endswith(".js"):
                continue
            fp = Path(root) / f
            try:
                content = fp.read_text(encoding="utf-8")
                if f"'{symbol_name}'" in content or f'"{symbol_name}"' in content:
                    return str(fp.relative_to(ROOT)).replace("\\", "/")
            except Exception:
                pass
    return None

def execute(symbol_name, verbose=False):
    manifest = load_manifest()
    query_lower = symbol_name.lower()

    target_key = None
    for k in manifest.keys():
        if k.lower() == query_lower:
            target_key = k
            break

    if not target_key:
        # Partial search fallback
        matches = [k for k in manifest.keys() if query_lower in k.lower()]
        if not matches:
            print(f"\n[ERR] Symbol '{symbol_name}' not found in architecture manifest.")
            return False
        target_key = matches[0]

    item = manifest[target_key]
    consumers = find_inbound_consumers(target_key, manifest)
    reg_boot_file = find_service_registration(target_key)

    print("=" * 64)
    print(f"  Architectural Explanation: {target_key}")
    print("=" * 64)
    print(f"  Symbol:          {target_key}")
    print(f"  Owning Layer:    {item['layer']}")
    print(f"  File Path:       {item['file']}")
    
    if reg_boot_file:
        print(f"  Service Key:     Registered in ServiceRegistry via '{reg_boot_file}'")
    else:
        print(f"  Service Key:     Unregistered in ServiceRegistry (Component / Internal Class)")

    print(f"\n  Responsibility Overview:")
    if target_key.endswith("Service"):
        print(f"    Exposes public, permission-aware platform operations for '{target_key[:-7]}'.")
    elif target_key.endswith("Manager"):
        print(f"    Owns pure, headless runtime state container for '{target_key[:-7]}'. (Terminal UI Compliant)")
    elif target_key.endswith("Policy"):
        print(f"    Enforces security & authorization decisions for '{target_key[:-6]}'.")
    elif target_key.endswith("Driver"):
        print(f"    Abstracts hardware/storage capabilities for virtual device '{target_key[:-6]}'.")
    else:
        print(f"    Architectural subsystem component owning domain logic in layer '{item['layer']}'.")

    print(f"\n  Dependencies ({len(item['imports'])}):")
    if item['imports']:
        for imp in item['imports'][:6]:
            print(f"    • {imp}")
        if len(item['imports']) > 6:
            print(f"    • ... and {len(item['imports']) - 6} more")
    else:
        print("    • None (Self-contained leaf module)")

    print(f"\n  Inbound Consumers ({len(consumers)}):")
    if consumers:
        for c in consumers[:6]:
            print(f"    • {c}")
        if len(consumers) > 6:
            print(f"    • ... and {len(consumers) - 6} more")
    else:
        print("    • None detected in manifest index")

    print(f"\n  Governing Constitution Sections:")
    print("    • Section 2: Layer Ownership & Downward Dependency Law")
    if target_key.endswith("Service") or target_key.endswith("Manager"):
        print("    • Section 4: Single Responsibility & Service Ownership Law")
    print("    • Section 17: Deterministic Execution Law")

    print(f"\n  Applicable Audit Coverage:")
    print("    • audit.py architecture  (Layer structure & file presence)")
    print("    • audit.py dependencies  (Single-direction import enforcement)")
    if target_key.endswith("Service"):
        print("    • audit.py services      (ServiceRegistry key collision check)")
        print("    • audit.py api           (Public API contract snapshotting)")
    print("    • audit.py fallbacks     (Deterministic fallback & catch block scan)")

    print("\n" + "=" * 64)
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1:
        execute(sys.argv[1])
    else:
        print(f"Usage: python {sys.argv[0]} <Symbol>")
