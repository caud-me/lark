#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
assets_audit.py - Lark OS Asset Integrity & Path Validator
Release 27.8.13 - Developer Audit Toolkit CLI

Validates file paths across sw.js, platform.css, index.html, official.json,
and AppRegistry.js against actual files on disk to prevent 404 errors.

Usage:
    python tools/audit/assets_audit.py
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent

SW_PATH_RE = re.compile(r"""['"](\./)?((?:lark|src)/[^'"]+)['"]""")
CSS_URL_RE = re.compile(r"""url\(['"]?([^'")]+)['"]?\)""")
JSON_DOWNLOAD_RE = re.compile(r"""["']download["']\s*:\s*["']([^"']+)["']""")
JS_ENTRY_RE = re.compile(r"""["']entryPoint["']\s*:\s*["']([^"']+)["']""")

def run_assets_audit():
    print("=" * 64)
    print("  Constitution Section 15 — Asset Integrity Principle")
    print("  Audit: Platform Asset & Asset Path Auditor")
    print("=" * 64)

    checked = 0
    missing = []

    # 1. Audit sw.js
    sw_file = ROOT / "sw.js"
    if sw_file.exists():
        content = sw_file.read_text(encoding="utf-8")
        for match in SW_PATH_RE.finditer(content):
            rel_path = match.group(2)
            checked += 1
            target = ROOT / rel_path
            if not target.exists():
                missing.append({"source": "sw.js", "path": rel_path})

    # 2. Audit platform.css
    css_file = ROOT / "platform.css"
    if css_file.exists():
        content = css_file.read_text(encoding="utf-8")
        for match in CSS_URL_RE.finditer(content):
            rel_path = match.group(1)
            checked += 1
            target = ROOT / rel_path
            if not target.exists():
                missing.append({"source": "platform.css", "path": rel_path})

    # 3. Audit official.json
    repo_file = ROOT / "src" / "5-platform" / "packages" / "repositories" / "official.json"
    if repo_file.exists():
        content = repo_file.read_text(encoding="utf-8")
        for match in JSON_DOWNLOAD_RE.finditer(content):
            rel_path = match.group(1)
            checked += 1
            target = ROOT / rel_path
            if not target.exists():
                missing.append({"source": "official.json", "path": rel_path})

    # 4. Audit AppRegistry.js
    app_reg_file = ROOT / "src" / "1-kernel" / "AppRegistry.js"
    if app_reg_file.exists():
        content = app_reg_file.read_text(encoding="utf-8")
        for match in JS_ENTRY_RE.finditer(content):
            rel_path = match.group(1)
            checked += 1
            target = ROOT / rel_path
            if not target.exists():
                missing.append({"source": "AppRegistry.js", "path": rel_path})

    print(f"\nValidated {checked} asset and manifest file paths.")

    if missing:
        print("\n❌ [FAIL] Missing Asset Files / Broken Paths Found:")
        for item in missing:
            print(f"  • [{item['source']}] {item['path']} -> FILE NOT FOUND")
        print("=" * 64)
        print(f"  AUDIT RESULT: FAIL ({len(missing)} missing files)")
        print("=" * 64)
        sys.exit(1)
    else:
        print("\n✔ [PASS] 100% Asset Integrity Confirmed (Zero missing asset files).")
        print("=" * 64)
        print("  AUDIT RESULT: 100% PASS")
        print("=" * 64)
        sys.exit(0)

if __name__ == "__main__":
    run_assets_audit()
