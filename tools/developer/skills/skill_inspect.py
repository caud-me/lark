#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
skill_inspect.py - Developer Platform Skill: Inspect
Release 27.8.15 - Symbol Profiler & Architecture Confidence Calculator

Provides 360° symbol profiling derived directly from architecture_manifest.json and calculates
an Architecture Confidence Rating with explicit rationale.
"""

import os
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent.parent
MANIFEST_PATH = ROOT / "tools" / "audit" / "output" / "architecture_manifest.json"

SKILL_METADATA = {
    "name": "Inspect",
    "command": "dev.py inspect <Symbol> [--verbose]",
    "category": "360° Profiling & Confidence Rating",
    "purpose": "Inspects symbol methods, dependencies, consumers, and calculates Architecture Confidence Rating.",
    "inputs": "Symbol name, optional --verbose flag",
    "outputs": "Detailed symbol profile & Architecture Confidence Rating (0-100% with rationale)",
    "read_only": True,
    "constitution": "Section 10 (Architectural Discovery Principle) & Section 20 (Developer Assistance Principle)"
}

def load_manifest():
    if not MANIFEST_PATH.exists():
        audit_dir = ROOT / "tools" / "audit"
        if str(audit_dir) not in sys.path:
            sys.path.insert(0, str(audit_dir))
        import manifest_audit
        manifest_audit.run_manifest()

    try:
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}

def find_inbound_consumers(symbol_name, manifest):
    consumers = []
    symbol_lower = symbol_name.lower()

    for cls_name, item in manifest.items():
        if cls_name.lower() == symbol_lower:
            continue
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

def calculate_confidence(symbol_name, item, consumers, is_registered):
    score = 100
    reasons = []

    # Check manifest presence
    if not item:
        return 0, ["Symbol missing from architecture manifest."]

    # Check line count / file existence
    file_path = ROOT / item["file"]
    if not file_path.exists():
        score -= 40
        reasons.append("Physical source file missing from disk.")
    else:
        reasons.append("Symbol present in architecture manifest.")

    # Service registration check
    if symbol_name.endswith("Service"):
        if is_registered:
            reasons.append(f"Registered in ServiceRegistry via '{is_registered}'.")
        else:
            score -= 20
            reasons.append("Unregistered Service key in ServiceRegistry.")

    # Consumer references check
    if consumers:
        reasons.append(f"Referenced by {len(consumers)} inbound consumers.")
    else:
        if not symbol_name.endswith("App") and not symbol_name.endswith("Environment"):
            score -= 15
            reasons.append("Zero inbound consumers detected in manifest.")

    # Methods count check
    methods = item.get("methods", [])
    if methods:
        reasons.append(f"Defines {len(methods)} public methods.")
    else:
        score -= 10
        reasons.append("No public methods defined.")

    if score >= 90:
        reasons.append("No architectural ambiguity detected.")
    elif score < 70:
        reasons.append("Manual inspection recommended before modification.")

    return max(0, score), reasons

def execute(symbol_name, verbose=False):
    manifest = load_manifest()
    query_lower = symbol_name.lower()

    target_key = None
    for k in manifest.keys():
        if k.lower() == query_lower:
            target_key = k
            break

    if not target_key:
        matches = [k for k in manifest.keys() if query_lower in k.lower()]
        if not matches:
            print(f"\n[ERR] Symbol '{symbol_name}' not found in manifest index.")
            return False
        target_key = matches[0]

    item = manifest[target_key]
    consumers = find_inbound_consumers(target_key, manifest)
    reg_boot_file = find_service_registration(target_key)
    confidence, confidence_reasons = calculate_confidence(target_key, item, consumers, reg_boot_file)

    print("=" * 64)
    print(f"  Architectural Symbol Inspection: {target_key}")
    print("=" * 64)
    print(f"  Symbol:          {target_key}")
    print(f"  Owning Layer:    {item['layer']}")
    print(f"  File Path:       {item['file']}")

    print(f"\n  Architecture Confidence Score: {confidence}%")
    print("  Confidence Rationale:")
    for r in confidence_reasons:
        print(f"    • {r}")

    methods = item.get("methods", [])
    print(f"\n  Public Methods ({len(methods)}):")
    if methods:
        for m in methods[:10]:
            print(f"    • {m}")
        if len(methods) > 10:
            print(f"    • ... and {len(methods) - 10} more")
    else:
        print("    • None")

    print(f"\n  Dependencies ({len(item['imports'])}):")
    if item['imports']:
        for imp in item['imports'][:6]:
            print(f"    • {imp}")
        if len(item['imports']) > 6:
            print(f"    • ... and {len(item['imports']) - 6} more")
    else:
        print("    • None")

    if verbose:
        print(f"\n  [VERBOSE] Inbound Consumers ({len(consumers)}):")
        if consumers:
            for c in consumers:
                print(f"    • {c}")
        else:
            print("    • None detected")

        print(f"\n  [VERBOSE] ServiceRegistry Binding:")
        if reg_boot_file:
            print(f"    • Boot Registration: {reg_boot_file}")
        else:
            print("    • Not explicitly registered in kernel boot services")

        file_path = ROOT / item["file"]
        if file_path.exists():
            try:
                lines = file_path.read_text(encoding="utf-8").splitlines()
                print(f"\n  [VERBOSE] Module Size: {len(lines)} lines")
            except Exception:
                pass

    print("\n" + "=" * 64)
    return True

if __name__ == "__main__":
    verbose_flag = "--verbose" in sys.argv or "-v" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    if args:
        execute(args[0], verbose=verbose_flag)
    else:
        print(f"Usage: python {sys.argv[0]} <Symbol> [--verbose]")
