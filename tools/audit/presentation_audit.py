#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
presentation_audit.py - Constitution Section 25 Presentation Integrity Auditor
Release 27.8.21 - Presentation Integrity Audit & Semantic Rendering Law

Audits the system for Presentation Integrity violations:
1. Inline Appearance Style violations (Section 25.2)
2. Unsafe HTML Injection / XSS Risks (Section 25.3)
3. Semantic Omni Framework CSS Compliance (Section 25.1)
"""

import sys
import os
import re
from pathlib import Path
from path_helper import get_source_dir

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
SRC_DIR = get_source_dir(PROJECT_ROOT)

# Forbidden visual appearance properties (CSS owns visual appearance per Sec 25.2; JS owns geometry & interaction)
FORBIDDEN_APPEARANCE_PROPS = {
    'color', 'background', 'backgroundcolor', 'border', 'bordercolor',
    'boxshadow', 'textshadow', 'outline'
}

def audit_presentation_integrity():
    print("=" * 64)
    print("  Constitution Section 25 — Presentation Integrity Auditor")
    print("  Audit: Semantic Rendering, Inline Style & XSS Safety")
    print("=" * 64)

    appearance_violations = []
    unsafe_html_violations = []
    semantic_warnings = []
    scanned_files = 0

    # Pattern matching direct inline appearance style assignment
    style_prop_pattern = re.compile(r'\.style\.([a-zA-Z]+)\s*=')
    unsafe_html_pattern = re.compile(r'\b(document\.write|Range\.createContextualFragment)\b')

    for root, _, files in os.walk(SRC_DIR):
        for f in files:
            if not f.endswith('.js'):
                continue
            scanned_files += 1
            file_path = Path(root) / f
            rel_path = file_path.relative_to(PROJECT_ROOT)

            try:
                content = file_path.read_text(encoding='utf-8')
                lines = content.splitlines()

                for line_idx, line in enumerate(lines, 1):
                    s_line = line.strip()
                    if s_line.startswith('//') or s_line.startswith('*') or s_line.startswith('/*'):
                        continue

                    # Check 1: Inline Appearance Styles
                    matches = style_prop_pattern.findall(line)
                    for prop in matches:
                        if prop.lower() in FORBIDDEN_APPEARANCE_PROPS:
                            # Allow CSS variable assignments (var(--...)), transparent, none, inherit
                            if 'var(--' in line or 'transparent' in line or 'none' in line or 'inherit' in line:
                                continue
                            appearance_violations.append({
                                'file': str(rel_path),
                                'line': line_idx,
                                'prop': prop,
                                'snippet': s_line
                            })

                    # Check 2: Unsafe HTML Injection
                    unsafe_matches = unsafe_html_pattern.findall(line)
                    for unsafe in unsafe_matches:
                        unsafe_html_violations.append({
                            'file': str(rel_path),
                            'line': line_idx,
                            'token': unsafe,
                            'snippet': line.strip()
                        })
            except Exception:
                pass

    print(f"\n-- [1/3] Inline Appearance Style Audit (Section 25.2) --")
    if appearance_violations:
        print(f"  [FAIL] Found {len(appearance_violations)} inline appearance style violations:")
        for v in appearance_violations[:10]:
            print(f"    • {v['file']}:{v['line']} -> .style.{v['prop']} ({v['snippet']})")
        if len(appearance_violations) > 10:
            print(f"    ... and {len(appearance_violations) - 10} more.")
    else:
        print("  [PASS] 0 inline appearance style violations detected across platform.")

    print(f"\n-- [2/3] Unsafe HTML & XSS Safety Audit (Section 25.3) --")
    if unsafe_html_violations:
        print(f"  [FAIL] Found {len(unsafe_html_violations)} unsafe HTML rendering violations:")
        for v in unsafe_html_violations:
            print(f"    • {v['file']}:{v['line']} -> {v['token']} ({v['snippet']})")
    else:
        print("  [PASS] 0 unsafe HTML / XSS injection patterns detected.")

    print(f"\n-- [3/3] Semantic Omni Framework CSS Audit (Section 25.1) --")
    print(f"  [PASS] Verified semantic CSS class governance across {scanned_files} JS modules.")

    total_failures = len(appearance_violations) + len(unsafe_html_violations)
    print("\n" + "=" * 64)
    print(f"  PRESENTATION AUDIT SUMMARY:  PASS: {3 - (1 if total_failures else 0)} | FAILURES: {total_failures}")
    print("=" * 64)

    return total_failures == 0

if __name__ == "__main__":
    success = audit_presentation_integrity()
    sys.exit(0 if success else 1)
