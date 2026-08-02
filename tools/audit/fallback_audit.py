#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fallback_audit.py - Lark OS Developer Audit Toolkit: Implicit Fallback & Non-Deterministic Pattern Auditor
Release 27.8.14 - Architectural Determinism & Contract Compliance

Scans JS source files under src/ for implicit fallback anti-patterns:
  - Implicit object/array/primitive fallbacks (e.g. || {}, ?? [], || 'default')
  - Inline fallback instantiation (e.g. || new WindowManager())
  - Empty silent catch blocks (swallowed contract failures)
  - ServiceRegistry / Dependency lookup fallbacks (e.g. registry.get(...) || {})
"""

import sys
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
SRC = ROOT / "src"

# Patterns to audit
FALLBACK_PATTERNS = [
    (
        "IMPLICIT_OBJECT_FALLBACK",
        re.compile(r"""(?:\bget\w*|\bget|\bfind|\bregistry|\bService)\([^)]*\)\s*(?:\|\||\?\?)\s*\{\}"""),
        "Implicit empty object fallback on missing dependency or query result"
    ),
    (
        "IMPLICIT_ARRAY_FALLBACK",
        re.compile(r"""(?:\bget\w*|\bfind|\blist|\bsearch)\([^)]*\)\s*(?:\|\||\?\?)\s*\[\]"""),
        "Implicit empty array fallback on missing dependency or collection"
    ),
    (
        "INLINE_NEW_FALLBACK",
        re.compile(r"""(?:\|\||\?\?)\s*new\s+([A-Za-z0-9_]+)\("""),
        "Inline auto-instantiation fallback on missing service/manager"
    ),
    (
        "SILENT_CATCH_BLOCK",
        re.compile(r"""catch\s*\([^)]*\)\s*\{\s*\}"""),
        "Silent empty catch block swallowing exception without error handling or panic"
    ),
    (
        "SERVICE_REGISTRY_FALLBACK",
        re.compile(r"""(?:registry|\bServiceRegistry)\.get\([^)]+\)\s*(?:\|\||\?\?)"""),
        "Implicit fallback on missing ServiceRegistry entry"
    )
]

def scan_file(file_path):
    issues = []
    try:
        content = file_path.read_text(encoding="utf-8")
        lines = content.splitlines()
        for idx, line in enumerate(lines, 1):
            # Skip pure comments
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("*") or stripped.startswith("/*"):
                continue

            for category, pattern, description in FALLBACK_PATTERNS:
                match = pattern.search(line)
                if match:
                    issues.append({
                        "file": file_path.relative_to(ROOT).as_posix(),
                        "line": idx,
                        "category": category,
                        "snippet": line.strip(),
                        "description": description
                    })
    except Exception as e:
        print(f"Error scanning {file_path}: {e}")
    return issues

def run_fallback_audit():
    print("=" * 64)
    print("  Constitution Section 17 — Deterministic Execution Law")
    print("  Audit: Implicit Fallback & Determinism Auditor")
    print("=" * 64)

    js_files = list(SRC.rglob("*.js"))
    all_issues = []

    for file_path in sorted(js_files):
        issues = scan_file(file_path)
        all_issues.extend(issues)

    if not all_issues:
        print("\n✔ [PASS] Zero implicit fallback violations detected across src/.")
        print("=" * 64)
        return True

    print(f"\nDiscovered {len(all_issues)} implicit fallback violations:\n")
    for i, issue in enumerate(all_issues, 1):
        print(f"[{i}] [{issue['category']}] {issue['file']}:L{issue['line']}")
        print(f"    Snippet: {issue['snippet']}")
        print(f"    Reason:  {issue['description']}\n")

    print("=" * 64)
    print(f"  AUDIT SUMMARY:  TOTAL VIOLATIONS: {len(all_issues)}")
    print("=" * 64)
    return False

if __name__ == "__main__":
    run_fallback_audit()
