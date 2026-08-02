#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
api_audit.py - Lark OS Public API Snapshot Auditor
Release 27.8.13 - Developer Audit Toolkit CLI

Snapshots public methods for all registered ServiceRegistry keys, Kernel APIs,
and Driver APIs into tools/audit/output/api_snapshot.json. Compares against
previous baseline snapshots to detect breaking contract changes.

Usage:
    python tools/audit/api_audit.py
"""

import json
import sys
from pathlib import Path
from manifest_audit import extract_manifest

ROOT = Path(__file__).resolve().parent.parent.parent
OUTPUT_DIR = ROOT / "tools" / "audit" / "output"

def run_api_audit():
    print("=" * 64)
    print("  Constitution Section 4 — Public API Stability Principle")
    print("  Audit: Public API Contract & Snapshot Auditor")
    print("=" * 64)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    snapshot_file = OUTPUT_DIR / "api_snapshot.json"

    old_snapshot = {}
    if snapshot_file.exists():
        try:
            old_snapshot = json.loads(snapshot_file.read_text(encoding="utf-8"))
        except Exception:
            old_snapshot = {}

    manifest = extract_manifest()

    # Filter for Service, API, Manager, Driver classes
    api_classes = {
        cls: {
            "file": item["file"],
            "methods": item["methods"]
        }
        for cls, item in manifest.items()
        if cls.endswith("Service") or cls.endswith("API") or cls.endswith("Driver") or cls.endswith("Manager")
    }

    warnings = []
    if old_snapshot:
        for cls, old_item in old_snapshot.items():
            if cls not in api_classes:
                warnings.append(f"Class '{cls}' was removed from public API manifest.")
            else:
                old_methods = set(old_item.get("methods", []))
                new_methods = set(api_classes[cls]["methods"])
                dropped = old_methods - new_methods
                if dropped:
                    warnings.append(f"Class '{cls}' dropped methods: {', '.join(dropped)}")

    snapshot_file.write_text(json.dumps(api_classes, indent=2), encoding="utf-8")
    print(f"\nSnapshotted {len(api_classes)} Public API / Service classes -> {snapshot_file.relative_to(ROOT)}")

    if warnings:
        print("\n⚠ [WARN] API Contract Differences Detected:")
        for w in warnings:
            print(f"  • {w}")
    else:
        print("✔ [PASS] Zero breaking API contract changes detected.")

    print("=" * 64)
    sys.exit(0)

if __name__ == "__main__":
    run_api_audit()
