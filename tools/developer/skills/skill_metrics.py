#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
skill_metrics.py - Developer Platform Skill: Metrics
Release 27.8.15 - Architecture Density & Historical Growth Telemetry

Emits codebase telemetry, architecture density per layer, constitution coverage mapping,
and historical growth milestones.
"""

import os
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent.parent
SRC = ROOT / "src"
MANIFEST_PATH = ROOT / "tools" / "audit" / "output" / "architecture_manifest.json"

SKILL_METADATA = {
    "name": "Metrics",
    "command": "dev.py metrics",
    "category": "Codebase Telemetry & Growth",
    "purpose": "Calculates codebase lines of code, layer density, constitution coverage, and historical release growth.",
    "inputs": "None",
    "outputs": "Architecture Density, Constitution Coverage Map, and Historical Timeline Report.",
    "read_only": True,
    "constitution": "Section 16 (Developer Audit Principle) & Section 20 (Developer Assistance Principle)"
}

CONSTITUTION_LAYER_MAP = {
    "0-firmware": ["Section 2 (Layer Ownership)", "Section 17 (Deterministic Execution)"],
    "1-kernel": ["Section 2 (Layer Stack)", "Section 4 (Single Responsibility)", "Section 17 (Deterministic Execution)"],
    "2-storage": ["Section 8 (Storage Abstraction / LRFS)", "Section 17 (Deterministic Execution)"],
    "3-system": ["Section 1 (Domain-First)", "Section 5 (System Events)", "OS Error Taxonomy"],
    "4-policies": ["Section 7 (Security Policy)", "Section 18 (Architectural Ownership)"],
    "5-platform": ["Section 4 (Service Boundaries)", "Section 6 (Process Authority)", "Section 10 (Feature Model)"],
    "6-apps": ["Section 9 (Process Lifecycle)", "Section 11 (Extension Framework)", "Section 18 (Ownership)"],
    "7-sdk": ["Section 11 (Extension Framework)", "Section 14 (Code Readability)"],
    "8-developer": ["Section 16 (Developer Audit Principle)", "Section 19 (Enforcement Mapping)"],
    "9-ui": ["Section 12 (Omni vs Shell Independence)", "Section 13 (Theme Variable Standard)"]
}

HISTORICAL_MILESTONES = [
    {"release": "27.8.12", "files": 236, "services": 60, "auditors": 4, "feature": "High-Level Architecture Audit"},
    {"release": "27.8.13", "files": 242, "services": 64, "auditors": 6, "feature": "Developer Audit Toolkit CLI"},
    {"release": "27.8.14", "files": 249, "services": 66, "auditors": 8, "feature": "Deterministic Execution & Orphan Auditor"},
    {"release": "27.8.15", "files": 255, "services": 66, "auditors": 8, "feature": "Developer Platform & Skills Subsystem"},
    {"release": "27.8.16", "files": 257, "services": 66, "auditors": 8, "feature": "Architectural Baseline Freeze (Series 8 Milestone)"},
    {"release": "27.8.19", "files": 258, "services": 66, "auditors": 8, "feature": "Architectural Flow Tracing Skill (dev.py trace)"},
    {"release": "27.8.20", "files": 258, "services": 66, "auditors": 8, "feature": "Hardware Capability Gating & Driver Integrity Audit"},
    {"release": "27.9.1", "files": 261, "services": 68, "auditors": 9, "feature": "Presentation Effects Subsystem & Driver Capability Gating"}
]

def load_manifest():
    if MANIFEST_PATH.exists():
        try:
            return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}

def execute():
    manifest = load_manifest()

    layer_files = {}
    layer_loc = {}
    layer_imports = {}
    layer_methods = {}

    total_files = 0
    total_raw_loc = 0
    total_actual_loc = 0
    total_comments = 0
    total_blanks = 0

    for root, _, files in os.walk(SRC):
        for f in files:
            if not f.endswith(".js"):
                continue

            file_path = Path(root) / f
            parts = file_path.relative_to(SRC).parts
            layer = parts[0] if parts else "root"

            total_files += 1
            layer_files[layer] = layer_files.get(layer, 0) + 1

            try:
                lines = file_path.read_text(encoding="utf-8").splitlines()
                total_raw_loc += len(lines)
                in_block = False
                layer_actual = 0

                for line in lines:
                    s = line.strip()
                    if not s:
                        total_blanks += 1
                        continue
                    if in_block:
                        total_comments += 1
                        if '*/' in s:
                            in_block = False
                        continue
                    if s.startswith('/*'):
                        total_comments += 1
                        if '*/' not in s:
                            in_block = True
                        continue
                    if s.startswith('//'):
                        total_comments += 1
                        continue
                    total_actual_loc += 1
                    layer_actual += 1

                layer_loc[layer] = layer_loc.get(layer, 0) + layer_actual
            except Exception:
                pass

    for cls_name, item in manifest.items():
        layer = item.get("layer", "other")
        layer_imports[layer] = layer_imports.get(layer, 0) + len(item.get("imports", []))
        layer_methods[layer] = layer_methods.get(layer, 0) + len(item.get("methods", []))

    print("=" * 64)
    print("  Lark OS Developer Platform Codebase Telemetry (Series 9)")
    print("=" * 64)

    print(f"\n  [System High-Level Scale]")
    print(f"    Total JavaScript Modules:  {total_files} files")
    print(f"    Raw File Lines (src/):    {total_raw_loc:,} lines")
    print(f"    Comment & JSDoc Lines:    {total_comments:,} lines")
    print(f"    Blank / Formatting Lines:  {total_blanks:,} lines")
    print(f"    LOC (actual executable):   {total_actual_loc:,} lines (src/)")
    print(f"    Indexed Classes / Services:{len(manifest)} components")

    print(f"\n  [Architecture Density by Layer]")
    print(f"    {'Layer':<14} {'Files':<7} {'LOC':<8} {'Avg Imports':<13} {'Avg Methods'}")
    print(f"    {'-'*56}")
    for layer in sorted(layer_files.keys()):
        fc = layer_files[layer]
        loc = layer_loc.get(layer, 0)
        avg_imp = layer_imports.get(layer, 0) / max(1, fc)
        avg_mth = layer_methods.get(layer, 0) / max(1, fc)
        print(f"    {layer:<14} {fc:<7} {loc:<8} {avg_imp:<13.1f} {avg_mth:.1f}")

    print(f"\n  [Constitution Governance Coverage Mapping]")
    for layer, laws in CONSTITUTION_LAYER_MAP.items():
        print(f"    • {layer:<12} -> {', '.join(laws)}")

    print(f"\n  [Historical Platform Growth Timeline]")
    print(f"    {'Release':<10} {'Files':<8} {'Services':<10} {'Auditors':<10} {'Key Architecture Feature'}")
    print(f"    {'-'*64}")
    for m in HISTORICAL_MILESTONES:
        print(f"    {m['release']:<10} {m['files']:<8} {m['services']:<10} {m['auditors']:<10} {m['feature']}")

    print("\n" + "=" * 64)
    return True

if __name__ == "__main__":
    execute()
