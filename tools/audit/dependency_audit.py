#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
dependency_audit.py - Lark OS Layer Dependency Auditor
Release 27.8.12 - Developer Tooling & Runtime Visibility

Scans all JavaScript source files in src/ for architectural import violations:
- Upward layer imports (lower layer importing higher layer)
- Direct 5-platform -> 0-firmware imports (bypassing 1-kernel)
- Direct 6-apps -> 1-kernel imports (bypassing 5-platform)

Usage:
    python tools/audit/dependency_audit.py
"""

import os
import re
import sys
from pathlib import Path
from path_helper import get_source_dir

ROOT = Path(__file__).resolve().parent.parent.parent
SRC = get_source_dir(ROOT)

# Matches ES6 import statements capturing relative module paths
IMPORT_RE = re.compile(r"""(?:import|from)\s+['"](\.[\.\w/\-]+\.js)['"]""")

LAYER_RANK = {
    "0-firmware": 0,
    "1-kernel": 1,
    "2-storage": 2,
    "3-system": 3,
    "4-policies": 4,
    "5-platform": 5,
    "6-apps": 6,
    "7-sdk": 7,
    "8-developer": 8,
    "9-ui": 9,
}

def resolve_layer(file_path):
    """Determines layer name from relative file path under src/."""
    rel = file_path.relative_to(SRC)
    parts = rel.parts
    if parts and parts[0] in LAYER_RANK:
        return parts[0]
    return None

def resolve_imported_layer(file_path, import_path):
    """Resolves imported layer from relative ES6 import path."""
    try:
        resolved = (file_path.parent / import_path).resolve()
        if resolved.is_relative_to(SRC):
            rel = resolved.relative_to(SRC)
            parts = rel.parts
            if parts and parts[0] in LAYER_RANK:
                return parts[0]
    except Exception:
        pass
    return None

def main():
    print("=" * 64)
    print("  Constitution Section 2 — Downward Dependency Law")
    print("  Audit: Module Layer Dependency Auditor")
    print("=" * 64)

    violations = []
    total_files = 0
    total_imports = 0

    for root, _, files in os.walk(SRC):
        for f in files:
            if not f.endswith(".js"):
                continue

            file_path = Path(root) / f
            src_layer = resolve_layer(file_path)
            if not src_layer:
                continue

            total_files += 1
            src_rank = LAYER_RANK[src_layer]

            try:
                content = file_path.read_text(encoding="utf-8")
            except Exception as e:
                print(f"[WARN] Failed to read {file_path}: {e}")
                continue

            for match in IMPORT_RE.finditer(content):
                imp_str = match.group(1)
                target_layer = resolve_imported_layer(file_path, imp_str)
                if not target_layer:
                    continue

                total_imports += 1
                target_rank = LAYER_RANK[target_layer]

                rel_file = file_path.relative_to(ROOT)

                # Rule 1: Upward Layer Imports (lower layer importing higher layer)
                if target_rank > src_rank:
                    # Allowed Exceptions:
                    # 1. 0-firmware BootLoader handing off to 1-kernel / 5-platform BootSplash
                    # 2. 1-kernel importing 3-system (constants/types e.g. SystemVersion, LogSeverity, LogCategory)
                    # 3. 1-kernel/boot/ importing 5-platform / 2-storage (service & driver registration during boot sequence)
                    # 4. 4-policies importing 5-platform (SecurityService, SessionManager references)
                    # 5. Developer tooling & architecture validation imports (8-developer)
                    if src_layer == "0-firmware" and "BootLoader" in file_path.name:
                        continue
                    if src_layer == "1-kernel" and target_layer == "3-system":
                        continue
                    if src_layer == "1-kernel" and target_layer in ("5-platform", "2-storage", "8-developer", "4-policies") and "boot" in file_path.parts:
                        continue
                    if src_layer == "4-policies" and target_layer in ("5-platform", "3-system"):
                        continue
                    if target_layer == "8-developer" and ("ArchitectureValidation" in file_path.name or "Guardian" in file_path.name):
                        continue
                    if target_layer == "9-ui":
                        continue
                    
                    violations.append({
                        "file": rel_file,
                        "src_layer": src_layer,
                        "target_layer": target_layer,
                        "type": "UPWARD_IMPORT",
                        "desc": f"Layer '{src_layer}' (rank {src_rank}) imports higher layer '{target_layer}' (rank {target_rank}) via '{imp_str}'"
                    })

                # Rule 2: Direct 5-platform -> 0-firmware bypass (bypassing 1-kernel)
                if src_layer == "5-platform" and target_layer == "0-firmware":
                    violations.append({
                        "file": rel_file,
                        "src_layer": src_layer,
                        "target_layer": target_layer,
                        "type": "FIRMWARE_BYPASS",
                        "desc": f"Platform file imports firmware directly via '{imp_str}'"
                    })

                # Rule 3: Direct 6-apps -> 1-kernel bypass (bypassing 5-platform)
                if src_layer == "6-apps" and target_layer == "1-kernel":
                    violations.append({
                        "file": rel_file,
                        "src_layer": src_layer,
                        "target_layer": target_layer,
                        "type": "KERNEL_BYPASS",
                        "desc": f"Application file imports kernel directly via '{imp_str}'"
                    })

    print(f"\nScanned {total_files} JavaScript files ({total_imports} layer imports).")

    if violations:
        print("\n-- [FAIL] Architectural Violations Found --")
        for v in violations:
            print(f"  ❌ [{v['type']}] {v['file']}")
            print(f"     └─ {v['desc']}")
        print("\n" + "=" * 64)
        print(f"  AUDIT RESULT: FAIL ({len(violations)} violations detected)")
        print("=" * 64)
        sys.exit(1)
    else:
        print("\n-- [PASS] Zero Architectural Import Violations Detected --")
        print("=" * 64)
        print("  AUDIT RESULT: 100% PASS")
        print("=" * 64)
        sys.exit(0)

if __name__ == "__main__":
    main()
