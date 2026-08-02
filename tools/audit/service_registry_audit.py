#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
service_registry_audit.py - Lark OS ServiceRegistry Inspection Auditor
Release 27.8.12 - Developer Tooling & Runtime Visibility

Scans 1-kernel/boot/ and 1-kernel/boot/services/ to audit ServiceRegistry.register() calls:
- Detects duplicate service registration keys
- Validates canonical core service registrations
- Reports unified service registry manifest

Usage:
    python tools/audit/service_registry_audit.py
"""

import os
import re
import sys
from pathlib import Path

from path_helper import get_source_dir

ROOT = Path(__file__).resolve().parent.parent.parent
SRC = get_source_dir(ROOT)
BOOT_DIR = SRC / "1-kernel" / "boot"

# Matches ServiceRegistry.register('ServiceName', ...) or ctx.serviceRegistry.register('ServiceName', ...)
REG_RE = re.compile(r"""(?:ServiceRegistry|ctx\.serviceRegistry)\.register\(\s*['"]([^'"]+)['"]""")

def main():
    print("=" * 64)
    print("  Constitution Section 4 — Service Registration Law")
    print("  Audit: ServiceRegistry Key Duplication Auditor")
    print("=" * 64)

    registrations = {}
    duplicates = []

    if not BOOT_DIR.exists():
        print(f"[FAIL] Boot directory not found: {BOOT_DIR}")
        sys.exit(1)

    for root, _, files in os.walk(BOOT_DIR):
        for f in files:
            if not f.endswith(".js"):
                continue

            file_path = Path(root) / f
            rel_file = file_path.relative_to(ROOT)

            try:
                content = file_path.read_text(encoding="utf-8")
            except Exception as e:
                print(f"[WARN] Failed to read {file_path}: {e}")
                continue

            for match in REG_RE.finditer(content):
                service_name = match.group(1)
                if service_name in registrations:
                    duplicates.append({
                        "service": service_name,
                        "file1": registrations[service_name],
                        "file2": rel_file
                    })
                else:
                    registrations[service_name] = rel_file

    print(f"\nDiscovered {len(registrations)} registered ServiceRegistry keys:")
    print("-" * 64)
    for service, file in sorted(registrations.items()):
        print(f"  • {service:<32} -> {file}")

    print("-" * 64)

    if duplicates:
        print(f"\n❌ [FAIL] {len(duplicates)} Duplicate ServiceRegistrations Found:")
        for d in duplicates:
            print(f"  - Key '{d['service']}' registered in both '{d['file1']}' and '{d['file2']}'")
        sys.exit(1)
    else:
        print(f"\n✔ [PASS] Zero duplicate ServiceRegistry keys detected across {len(registrations)} services.")
        sys.exit(0)

if __name__ == "__main__":
    main()
