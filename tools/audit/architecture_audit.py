#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
architecture_audit.py - Lark OS High-Level Architecture Audit Tool
Release 27.8.12 - Developer Tooling & Runtime Visibility

Validates numbered layer structure, required documentation, boot folders,
and core system entry points using pure Python standard library.

Usage:
    python tools/audit/architecture_audit.py
"""

import sys
from pathlib import Path

from path_helper import get_source_dir

ROOT = Path(__file__).resolve().parent.parent.parent
SRC = get_source_dir(ROOT)

REQUIRED_LAYERS = [
    "0-firmware",
    "1-kernel",
    "2-storage",
    "3-system",
    "4-policies",
    "5-platform",
    "6-apps",
    "7-sdk",
    "8-developer",
    "9-ui",
]

REQUIRED_BOOT_FOLDERS = [
    SRC / "1-kernel" / "boot",
    SRC / "1-kernel" / "boot" / "services",
    SRC / "1-kernel" / "api",
    SRC / "1-kernel" / "drivers",
    SRC / "1-kernel" / "handles",
]

REQUIRED_DOCS = [
    ROOT / "docs" / "constitution.md",
    ROOT / "docs" / "the_book.md",
    ROOT / "docs" / "NAVIGATION.md",
]

REQUIRED_FILES = [
    SRC / "1-kernel" / "kernel.js",
    SRC / "1-kernel" / "KernelBootstrapContext.js",
    SRC / "1-kernel" / "KernelResourceManager.js",
    SRC / "1-kernel" / "DriverManager.js",
    SRC / "1-kernel" / "PanicHandler.js",
    SRC / "3-system" / "SystemVersion.js",
    ROOT / "index.html",
    ROOT / "sw.js",
    ROOT / "platform.css",
]

def main():
    print("=" * 64)
    print("  Constitution Section 2 — Layer Ownership Law")
    print("  Audit: High-Level Architecture & Layer Hierarchy Auditor")
    print("=" * 64)
    
    passes = 0
    warnings = 0
    failures = 0

    # 1. Verify Numbered Layer Directories
    print("\n-- [1/4] Numbered Layer Hierarchy --")
    for layer in REQUIRED_LAYERS:
        layer_path = SRC / layer
        if layer_path.exists() and layer_path.is_dir():
            print(f"  [PASS] Layer '{layer}' exists.")
            passes += 1
        else:
            print(f"  [FAIL] Missing required layer directory: '{layer}'")
            failures += 1

    # 2. Verify Boot Subsystem Folders
    print("\n-- [2/4] Kernel Boot Subsystem Structure --")
    for folder in REQUIRED_BOOT_FOLDERS:
        rel_path = folder.relative_to(ROOT)
        if folder.exists() and folder.is_dir():
            print(f"  [PASS] Subsystem folder '{rel_path}' exists.")
            passes += 1
        else:
            print(f"  [FAIL] Missing required subsystem folder: '{rel_path}'")
            failures += 1

    # 3. Verify Required Canonical Documentation
    print("\n-- [3/4] Canonical Architecture Documentation --")
    for doc in REQUIRED_DOCS:
        rel_path = doc.relative_to(ROOT)
        if doc.exists() and doc.is_file():
            print(f"  [PASS] Documentation file '{rel_path}' exists.")
            passes += 1
        else:
            print(f"  [FAIL] Missing canonical documentation: '{rel_path}'")
            failures += 1

    # 4. Verify Core OS Entry Points & System Files
    print("\n-- [4/4] Core Entry Points & Infrastructure Files --")
    for filepath in REQUIRED_FILES:
        rel_path = filepath.relative_to(ROOT)
        if filepath.exists() and filepath.is_file():
            print(f"  [PASS] System file '{rel_path}' exists.")
            passes += 1
        else:
            print(f"  [FAIL] Missing core system file: '{rel_path}'")
            failures += 1

    # Audit Summary Report
    print("\n" + "=" * 64)
    print(f"  AUDIT SUMMARY:  PASS: {passes} | WARNINGS: {warnings} | FAILURES: {failures}")
    print("=" * 64)

    if failures > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
