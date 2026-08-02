#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
skill_before.py - Developer Platform Skill: Before
Release 27.8.15 - Pre-Flight Pre-Implementation Checklist Generator

Generates a tailored pre-implementation development checklist derived from the architecture
before a developer or AI assistant modifies a component.
"""

import sys
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent.parent
MANIFEST_PATH = ROOT / "tools" / "audit" / "output" / "architecture_manifest.json"

SKILL_METADATA = {
    "name": "Before",
    "command": "dev.py before <Symbol>",
    "category": "Pre-Implementation Checklist",
    "purpose": "Generates a pre-flight checklist, pre-flight audit steps, and related dependencies before modifying a symbol.",
    "inputs": "Symbol name (e.g. WindowService, FileService)",
    "outputs": "Tailored development checklist (Pre-flight commands, governing laws, related components)",
    "read_only": True,
    "constitution": "Section 14 (Code Readability) & Section 20 (Developer Assistance Principle)"
}

def execute(symbol_name):
    manifest = {}
    if MANIFEST_PATH.exists():
        try:
            manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass

    query_lower = symbol_name.lower()
    target_key = None
    for k in manifest.keys():
        if k.lower() == query_lower:
            target_key = k
            break

    if not target_key:
        target_key = symbol_name

    item = manifest.get(target_key, {})
    imports = item.get("imports", [])

    print("=" * 64)
    print(f"  Pre-Implementation Checklist: {target_key}")
    print("=" * 64)

    print("\n[1] Pre-Flight Commands (Run in sequence before editing):")
    print(f"  1. python tools/developer/dev.py explain {target_key}")
    print(f"  2. python tools/developer/dev.py inspect {target_key} --verbose")
    print(f"  3. python tools/audit/audit.py dependencies")
    print(f"  4. python tools/audit/audit.py api")

    print("\n[2] Relevant Constitutional Laws to Respect:")
    print("  • Section 2: Downward Dependency Law (Never import higher layers)")
    print("  • Section 3: Single Responsibility Principle & Terminal UI Test")
    print("  • Section 17: Deterministic Execution Law (No || [], || {}, or swallowed catch blocks)")
    print("  • Section 18: Architectural Ownership Law (Preserve registered ownership)")
    print("  • Section 20: Developer Assistance Principle (Maintain read-only tool boundaries)")

    print("\n[3] Closely Related Subsystems & Imports:")
    if imports:
        for imp in imports[:5]:
            print(f"  • {imp}")
    else:
        print("  • Standard platform dependencies")

    print("\n[4] Post-Implementation Verification Requirements:")
    print(f"  1. Run `python tools/developer/dev.py review <file>`")
    print(f"  2. Run `python tools/developer/dev.py identifier src/`")
    print(f"  3. Run `python tools/audit/audit.py all` (Must achieve 100% PASS)")
    print(f"  4. Update `docs/the_book.md` with release notes")
    print(f"  5. Publish `walkthrough.md` artifact")

    print("\n" + "=" * 64)
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1:
        execute(sys.argv[1])
    else:
        print(f"Usage: python {sys.argv[0]} <Symbol>")
