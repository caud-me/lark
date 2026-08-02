#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
manifest_audit.py - Lark OS Architecture Manifest Generator & Search Index
Release 27.8.13 - Developer Audit Toolkit CLI

Parses JavaScript files under src/ to build a structured architectural index
containing classes, exported methods, constructors, and dependencies.
Generates tools/audit/output/architecture_manifest.json.

Usage:
    python tools/audit/manifest_audit.py
"""

import os
import re
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
SRC = ROOT / "src"
OUTPUT_DIR = ROOT / "tools" / "audit" / "output"

CLASS_RE = re.compile(r"""(?:export\s+(?:default\s+)?)?class\s+([A-Za-z0-9_]+)""")
METHOD_RE = re.compile(r"""^\s*(?:async\s+)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{""", re.MULTILINE)
IMPORT_RE = re.compile(r"""(?:import|from)\s+['"](\.[\.\w/\-]+\.js)['"]""")

def extract_manifest():
    manifest = {}

    for root, _, files in os.walk(SRC):
        for f in files:
            if not f.endswith(".js"):
                continue

            file_path = Path(root) / f
            rel_file = str(file_path.relative_to(ROOT)).replace("\\", "/")
            parts = file_path.relative_to(SRC).parts
            layer = parts[0] if parts else "root"

            try:
                content = file_path.read_text(encoding="utf-8")
            except Exception:
                continue

            classes = CLASS_RE.findall(content)
            if not classes:
                continue

            methods = []
            for match in METHOD_RE.finditer(content):
                mname = match.group(1)
                mparams = match.group(2).strip()
                if mname not in ("if", "for", "while", "switch", "catch", "function"):
                    methods.append(f"{mname}({mparams})")

            imports = [match.group(1) for match in IMPORT_RE.finditer(content)]

            for cls in classes:
                manifest[cls] = {
                    "class": cls,
                    "layer": layer,
                    "file": rel_file,
                    "methods": methods[:25],
                    "imports": imports
                }

    return manifest

def run_manifest():
    print("=" * 64)
    print("  Constitution Section 10 — Architectural Discovery Principle")
    print("  Audit: Architectural Index & Discovery Manifest Generator")
    print("=" * 64)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUTPUT_DIR / "architecture_manifest.json"
    manifest = extract_manifest()
    
    out_file.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"[PASS] Architecture Manifest generated ({len(manifest)} classes indexed) -> {out_file.relative_to(ROOT)}")
    print("=" * 64)
    return manifest

def search_index(query):
    manifest = extract_manifest()
    query_lower = query.lower()
    matches = {k: v for k, v in manifest.items() if query_lower in k.lower()}

    if not matches:
        print(f"\nNo architecture index matches found for query: '{query}'")
        return

    print("=" * 64)
    print(f"  Lark OS Architectural Index Search: '{query}' ({len(matches)} match)")
    print("=" * 64)

    for name, item in matches.items():
        print(f"\n{item['class']}")
        print(f"  Layer:         {item['layer']}")
        print(f"  File:          {item['file']}")
        print(f"  Public Methods ({len(item['methods'])}):")
        for m in item['methods']:
            print(f"    • {m}")
        if item['imports']:
            print(f"  Imports ({len(item['imports'])}):")
            for imp in item['imports'][:6]:
                print(f"    - {imp}")
            if len(item['imports']) > 6:
                print(f"    - ... and {len(item['imports']) - 6} more")
    print("=" * 64)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "search":
        search_index(sys.argv[2] if len(sys.argv) > 2 else "")
    else:
        run_manifest()
