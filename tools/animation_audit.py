#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
animation_audit.py - Lark OS Animation & Visual Effects Repository Audit Tool
Series 9 Phase 1 - Centralized Presentation Effects Framework

Scans the repository for hardcoded presentation effects:
- transition, animation, @keyframes, transform, cubic-bezier, ease
- backdrop-filter, blur(
- JavaScript animation declarations and logic

Generates a canonical Markdown audit report in docs/audits/animation_audit_report.md.
"""

import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_REPORT = ROOT / "docs" / "audits" / "animation_audit_report.md"

KEYWORDS = [
    r'transition',
    r'animation',
    r'@keyframes',
    r'transform',
    r'cubic-bezier',
    r'backdrop-filter',
    r'blur\(',
    r'opacity\s*:',
    r'scale\(',
    r'translate\(',
]

KEYWORD_REGEX = re.compile(r'|'.join(KEYWORDS), re.IGNORECASE)

def scan_file(file_path):
    rel_path = file_path.relative_to(ROOT).as_posix()
    findings = []

    try:
        content = file_path.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return findings

    lines = content.splitlines()
    for idx, line in enumerate(lines, 1):
        line_str = line.strip()
        if not line_str or line_str.startswith('//') or line_str.startswith('/*') or line_str.startswith('*'):
            continue

        match = KEYWORD_REGEX.search(line_str)
        if match:
            keyword = match.group(0)
            findings.append({
                'file': rel_path,
                'line': idx,
                'keyword': keyword,
                'code': line_str[:100]
            })

    return findings

def classify_finding(finding):
    file = finding['file']
    code = finding['code']
    keyword = finding['keyword'].lower()

    # Determine scope & suggested owner
    if 'WindowFrame' in file or 'WindowSurface' in file or 'WindowManager' in file:
        if any(term in code.lower() for term in ['maximiz', 'restor', 'snap']):
            return {
                'effect': 'Window Maximize / Restore / Snap Motion',
                'implementation': f'CSS/JS {keyword}',
                'owner': 'PresentationEffectsService',
                'priority': 'High',
                'scope': 'Migrate in Phase 1'
            }
        else:
            return {
                'effect': 'Window Chrome Effect',
                'implementation': f'CSS/JS {keyword}',
                'owner': 'PresentationEffectsService',
                'priority': 'Medium',
                'scope': 'Out of scope (Phase 1)'
            }
    elif 'platform.css' in file and 'backdrop-filter' in keyword:
        return {
            'effect': 'Glass Backdrop Blur',
            'implementation': 'Hardcoded CSS backdrop-filter',
            'owner': 'PresentationEffectsService / PresentationEffectsBridge',
            'priority': 'High',
            'scope': 'Migrate to Semantic CSS Var (Phase 1)'
        }
    elif 'Dialog' in file:
        return {
            'effect': 'Dialog Animation',
            'implementation': f'CSS {keyword}',
            'owner': 'PresentationEffectsService',
            'priority': 'Medium',
            'scope': 'Out of scope (Phase 1)'
        }
    elif 'Notification' in file:
        return {
            'effect': 'Notification Toast Motion',
            'implementation': f'CSS {keyword}',
            'owner': 'PresentationEffectsService',
            'priority': 'Medium',
            'scope': 'Out of scope (Phase 1)'
        }
    elif 'Taskbar' in file or 'Launcher' in file:
        return {
            'effect': 'Shell UI Transition',
            'implementation': f'CSS {keyword}',
            'owner': 'PresentationEffectsService',
            'priority': 'Low',
            'scope': 'Out of scope (Phase 1)'
        }
    else:
        return {
            'effect': 'Component Transition',
            'implementation': f'CSS/JS {keyword}',
            'owner': 'PresentationEffectsService',
            'priority': 'Low',
            'scope': 'Out of scope (Phase 1)'
        }

def run_audit():
    print("================================================================")
    print("  Lark OS Series 9 Phase 1 — Animation & Effects Audit Tool")
    print("================================================================")

    all_findings = []

    target_dirs = [ROOT / "lark", ROOT / "tools"]
    target_files = [ROOT / "platform.css", ROOT / "index.html"]

    for d in target_dirs:
        if d.exists():
            for root, _, files in os.walk(d):
                for f in files:
                    if f.endswith(('.js', '.css', '.html')):
                        fp = Path(root) / f
                        all_findings.extend(scan_file(fp))

    for fp in target_files:
        if fp.exists():
            all_findings.extend(scan_file(fp))

    print(f"Scanned repository: Found {len(all_findings)} presentation effect references.")

    # Deduplicate findings by (file, effect_type) for markdown report
    classified = []
    seen = set()

    for f in all_findings:
        meta = classify_finding(f)
        key = (f['file'], meta['effect'], meta['scope'])
        if key not in seen:
            seen.add(key)
            classified.append({
                'file': f['file'],
                'line': f['line'],
                'effect': meta['effect'],
                'implementation': meta['implementation'],
                'owner': meta['owner'],
                'priority': meta['priority'],
                'scope': meta['scope'],
                'sample': f['code']
            })

    OUTPUT_REPORT.parent.mkdir(parents=True, exist_ok=True)

    report_lines = [
        "# Lark OS 27 — Animation & Visual Effects Repository Audit Report",
        "",
        "**Release**: Series 9 Phase 1  ",
        "**Subsystem**: Centralized Presentation Effects Framework  ",
        "**Auditor**: `tools/animation_audit.py`  ",
        "",
        "## Executive Summary",
        "",
        f"This repository-wide audit cataloged **{len(all_findings)}** presentation effect occurrences across JS, CSS, and HTML files.",
        "In accordance with Series 9 Phase 1 scoping rules:",
        "- **Phase 1 Active Scope**: Window Maximize, Restore, Snap motion policies and Semantic Glass Backdrop Blur CSS variables.",
        "- **Phase 1 Out-of-Scope**: Dialogs, notifications, launcher, taskbar, widgets, boot/login environments, hover animations.",
        "",
        "---",
        "",
        "## Presentation Effects Audit Inventory",
        "",
        "| File | Line | Effect Description | Current Implementation | Suggested Owner | Priority | Phase 1 Status |",
        "| ---- | ---- | ------------------ | ---------------------- | --------------- | -------- | -------------- |"
    ]

    for item in sorted(classified, key=lambda x: (x['scope'], x['priority'], x['file'])):
        report_lines.append(
            f"| `{item['file']}` | L{item['line']} | {item['effect']} | `{item['implementation']}` | `{item['owner']}` | {item['priority']} | **{item['scope']}** |"
        )

    report_lines.extend([
        "",
        "---",
        "",
        "## Migration Directives for Series 9",
        "",
        "1. **`WindowManager.js`**: Must remain 100% headless (Terminal UI Test compliant). Emits kernel window events.",
        "2. **`DisplayGraphicsDriver.js`**: Probes hardware capability (`supportsBackdropFilter`, `supportsCssAnimations`, etc.).",
        "3. **`PresentationEffectsService.js`**: Evaluates policy & emits `presentation.intent.window.motion` and `presentation.policy.*` events.",
        "4. **`PresentationEffectsBridge.js`**: Synchronizes presentation policy to root CSS variables (`--lde-glass-backdrop-filter`, `--lde-window-transition-duration`).",
        "5. **`WindowSurface.js` / `WindowFrame.js`**: Consumes `presentation.intent.window.motion` to trigger scoped CSS window transitions.",
        ""
    ])

    report_text = "\n".join(report_lines)
    OUTPUT_REPORT.write_text(report_text, encoding='utf-8')
    print(f"[PASS] Report successfully generated -> {OUTPUT_REPORT.relative_to(ROOT)}")

if __name__ == "__main__":
    run_audit()
