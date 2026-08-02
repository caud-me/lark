#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
skill_identifier.py - Developer Platform Skill: Identifier
Release 27.8.15 - Variable Naming & Identifier Quality Inspector

Evaluates variable and property identifier quality against Lark OS self-documenting naming conventions.
Automatically whitelists loop counters and catch block variables.
"""

import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent.parent
SRC = ROOT / "src"

SKILL_METADATA = {
    "name": "Identifier",
    "command": "dev.py identifier [SearchPath]",
    "category": "Identifier Naming Quality",
    "purpose": "Inspects variable declarations for cryptic/abbreviated names and recommends domain-explicit alternatives.",
    "inputs": "Search path (optional, defaults to src/)",
    "outputs": "Identifier quality report with explicit recommendations and 'Why This Matters' rationale.",
    "read_only": True,
    "constitution": "Section 14 (Code Readability) & Section 20 (Developer Assistance Principle)"
}

WHITELISTED = {"i", "j", "k", "e", "err", "error", "x", "y", "w", "h", "fn", "id", "idx", "p", "f", "fs", "db", "vm", "os"}

RECOMMENDATIONS = {
    "cfg": "windowConfiguration or systemConfig",
    "svc": "notificationService or windowService",
    "mgr": "windowManager or processManager",
    "res": "storageCapabilities or operationResult",
    "req": "serviceRequest or capabilityRequest",
    "cb": "callbackHandler or unsubscribeClosure",
    "evt": "systemEvent or payloadEvent",
    "el": "panelContainer or surfaceElement",
    "opts": "initializationOptions",
    "tmp": "transientBuffer or temporaryHandle",
    "obj": "domainState or targetInstance"
}

DECL_RE = re.compile(r"""\b(?:let|const|var)\s+([a-zA-Z0-9_$]+)""")

def execute(target_path=None):
    search_dir = Path(target_path) if target_path else SRC
    if not search_dir.is_absolute():
        search_dir = ROOT / search_dir

    if not search_dir.exists():
        print(f"\n[ERR] Target search path '{search_dir}' does not exist.")
        return False

    violations = []
    total_files = 0

    for root, _, files in os.walk(search_dir):
        for f in files:
            if not f.endswith(".js"):
                continue

            file_path = Path(root) / f
            rel_file = str(file_path.relative_to(ROOT)).replace("\\", "/")
            total_files += 1

            try:
                content = file_path.read_text(encoding="utf-8")
                lines = content.splitlines()
            except Exception:
                continue

            for idx, line in enumerate(lines, 1):
                # Skip comments
                stripped = line.strip()
                if stripped.startswith("//") or stripped.startswith("*") or stripped.startswith("/*"):
                    continue

                for match in DECL_RE.finditer(line):
                    var_name = match.group(1)
                    var_lower = var_name.lower()

                    if len(var_name) <= 3 and var_lower not in WHITELISTED:
                        rec = RECOMMENDATIONS.get(var_lower, f"domain-explicit name (e.g. `{var_name}State`)")
                        violations.append({
                            "file": rel_file,
                            "line": idx,
                            "var": var_name,
                            "snippet": stripped,
                            "recommendation": rec,
                            "why": "Abbreviated variables increase cognitive load and force developers to read surrounding code to infer meaning."
                        })

    print("=" * 64)
    print(f"  Identifier Quality Inspector: {search_dir.relative_to(ROOT) if search_dir.is_relative_to(ROOT) else search_dir}")
    print("=" * 64)
    print(f"  Scanned {total_files} JavaScript source files.")

    if violations:
        print(f"\n  Discovered {len(violations)} cryptic identifier warnings:\n")
        for i, v in enumerate(violations[:15], 1):
            print(f"  [{i}] {v['file']}:L{v['line']} -> Variable `{v['var']}`")
            print(f"      Snippet:        {v['snippet']}")
            print(f"      Recommendation: Replace with {v['recommendation']}")
            print(f"      Why This Matters: {v['why']}\n")

        if len(violations) > 15:
            print(f"  ... and {len(violations) - 15} more warnings.")
    else:
        print("\n  ✔ Zero cryptic or ambiguous variable names detected. Excellent naming clarity!")

    print("\n" + "=" * 64)
    return True

if __name__ == "__main__":
    path_arg = sys.argv[1] if len(sys.argv) > 1 else None
    execute(path_arg)
