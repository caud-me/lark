#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
skill_review.py - Developer Platform Skill: Review
Release 27.8.15 - Beginner Readability & SOLID Scorecard Reviewer

Non-destructively evaluates source code against Lark's Beginner Readability & SOLID conventions.
Produces a visual 5-star scorecard and educational rationale ("Why This Matters").
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent.parent

SKILL_METADATA = {
    "name": "Review",
    "command": "dev.py review <FilePathOrClass>",
    "category": "Code Quality & Readability Reviewer",
    "purpose": "Non-destructively reviews JavaScript code for readability, complexity, SOLID principles, and outputs a 5-star scorecard.",
    "inputs": "File path or class name",
    "outputs": "Visual 5-star scorecard (Readability, SOLID, Naming, Complexity, Architecture) with 'Why This Matters' rationale.",
    "read_only": True,
    "constitution": "Section 3 (SRP), Section 14 (Code Readability), & Section 20 (Developer Assistance Principle)"
}

NESTED_TERNARY_RE = re.compile(r"""\?\s*[^:\n]+\?\s*""")
COMPLEX_BOOL_RE = re.compile(r"""if\s*\((?:[^)]*&&[^)]*\|\||[^)]*\|\|[^)]*&&)""")
FUNC_DECL_RE = re.compile(r"""(?:async\s+)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{""")

def stars(rating):
    full = int(rating)
    empty = 5 - full
    return "★" * full + "☆" * empty

def execute(target_path_or_class):
    file_path = None
    candidate = (ROOT / target_path_or_class).resolve() if not Path(target_path_or_class).is_absolute() else Path(target_path_or_class).resolve()
    if candidate.exists():
        if candidate.is_dir():
            js_files = list(candidate.rglob("*.js"))
            if js_files:
                file_path = js_files[0].resolve()
        else:
            file_path = candidate
    else:
        # Search in src/
        for p in (ROOT / "src").rglob("*.js"):
            if target_path_or_class.lower() in p.name.lower():
                file_path = p.resolve()
                break

    if not file_path or not file_path.exists() or file_path.is_dir():
        print(f"\n[ERR] Target file '{target_path_or_class}' not found or is a directory with no JS files.")
        return False

    rel_file = str(file_path.relative_to(ROOT)).replace("\\", "/")
    content = file_path.read_text(encoding="utf-8")
    lines = content.splitlines()

    scores = {
        "Readability": 5.0,
        "SOLID": 5.0,
        "Naming": 5.0,
        "Complexity": 5.0,
        "Presentation": 5.0,
        "Architecture": 5.0
    }

    feedback = []

    # 1. Check module line count
    if len(lines) > 300:
        scores["SOLID"] -= 1.0
        scores["Complexity"] -= 1.0
        feedback.append({
            "dimension": "SOLID / Complexity",
            "issue": f"Module length ({len(lines)} lines) exceeds recommended 300 LOC limit.",
            "recommendation": "Decompose large class into smaller specialized Managers or Policy helpers.",
            "why": "Large files accumulate multiple responsibilities, violating Single Responsibility Principle (Section 3)."
        })

    # 2. Check for nested ternaries
    nested_ternaries = 0
    for idx, line in enumerate(lines, 1):
        if NESTED_TERNARY_RE.search(line):
            nested_ternaries += 1
            if nested_ternaries <= 3:
                feedback.append({
                    "dimension": "Readability",
                    "issue": f"Line {idx}: Nested ternary operator detected: `{line.strip()}`",
                    "recommendation": "Expand nested ternary into explicit if/else statements.",
                    "why": "Nested ternaries force high mental stack depth and hinder beginner readability (Section 14)."
                })

    if nested_ternaries > 0:
        scores["Readability"] -= min(2.0, nested_ternaries * 0.5)

    # 3. Check for complex boolean conditionals
    complex_bools = 0
    for idx, line in enumerate(lines, 1):
        if COMPLEX_BOOL_RE.search(line):
            complex_bools += 1
            if complex_bools <= 3:
                feedback.append({
                    "dimension": "Complexity",
                    "issue": f"Line {idx}: Dense boolean conditional combining && and ||: `{line.strip()}`",
                    "recommendation": "Extract multi-clause condition into self-documenting boolean helper variable.",
                    "why": "Extracting named boolean variables clarifies business rules without inline comments."
                })

    if complex_bools > 0:
        scores["Complexity"] -= min(1.5, complex_bools * 0.5)

    # 4. Check for cryptic variable declarations
    cryptic_vars = re.findall(r"""\b(?:let|const|var)\s+([a-z]{1,3})\b""", content)
    whitelisted = {"i", "j", "k", "e", "err", "x", "y", "w", "h", "fn", "id", "idx", "p"}
    flagged_cryptic = [v for v in set(cryptic_vars) if v not in whitelisted]

    if flagged_cryptic:
        scores["Naming"] -= min(2.0, len(flagged_cryptic) * 0.5)
        feedback.append({
            "dimension": "Naming",
            "issue": f"Cryptic or abbreviated variable names detected: {', '.join(flagged_cryptic[:5])}",
            "recommendation": "Replace abbreviated variables with self-documenting names (e.g. `cfg` -> `windowConfiguration`).",
            "why": "Explicit variable names communicate architectural intent and eliminate guessing."
        })

    # 5. Check Presentation Integrity (Section 25)
    inline_styles = re.findall(r'\.style\.(color|backgroundColor|border|fontSize)\s*=', content)
    if inline_styles:
        scores["Presentation"] -= min(2.0, len(inline_styles) * 0.5)
        feedback.append({
            "dimension": "Presentation",
            "issue": f"Inline appearance styling detected (.style.{', .style.'.join(set(inline_styles))})",
            "recommendation": "Use semantic Omni Framework CSS classes instead of inline JS appearance manipulation.",
            "why": "CSS owns visual appearance; JS owns geometry and interaction (Section 25.2)."
        })

    # Ensure ratings stay between 1 and 5
    for k in scores:
        scores[k] = max(1.0, min(5.0, scores[k]))

    print("=" * 64)
    print(f"  Beginner Readability & SOLID Review: {rel_file}")
    print("=" * 64)

    print("\n  [Quality Scorecard]")
    for k, v in scores.items():
        print(f"    {k:<14} {stars(v)}  ({v:.1f}/5.0)")

    if feedback:
        print(f"\n  [Architectural & Readability Feedback ({len(feedback)})]")
        for idx, item in enumerate(feedback, 1):
            print(f"\n  ({idx}) [{item['dimension']}] {item['issue']}")
            print(f"      Recommendation: {item['recommendation']}")
            print(f"      Why This Matters: {item['why']}")
    else:
        print("\n  ✔ Zero readability or complexity deductions detected. Excellent code quality!")

    print("\n" + "=" * 64)
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1:
        execute(sys.argv[1])
    else:
        print(f"Usage: python {sys.argv[0]} <FilePathOrClass>")
