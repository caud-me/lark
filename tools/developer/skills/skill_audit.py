#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
skill_audit.py - Developer Platform Skill: Audit Forwarder
Release 27.8.15 - Constitutional Law Enforcement Delegation

Delegates constitutional law enforcement audits directly to tools/audit/audit.py.
"""

import sys
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent.parent
AUDIT_CLI = ROOT / "tools" / "audit" / "audit.py"

SKILL_METADATA = {
    "name": "Audit",
    "command": "dev.py audit <subcommand>",
    "category": "Constitutional Law Enforcement",
    "purpose": "Delegates execution directly to python tools/audit/audit.py (architecture, dependencies, services, assets, fallbacks, orphans, all).",
    "inputs": "Audit subcommand (e.g. all, fallbacks, orphans, dependencies)",
    "outputs": "Constitutional Law enforcement PASS / FAIL audit results.",
    "read_only": True,
    "constitution": "Section 16 (Developer Audit Principle) & Section 19 (Governance & Enforcement Mapping)"
}

def execute(subcommand="all"):
    if not AUDIT_CLI.exists():
        print(f"[ERR] Audit CLI not found at '{AUDIT_CLI}'")
        return False

    cmd = [sys.executable, str(AUDIT_CLI), subcommand]
    try:
        res = subprocess.run(cmd)
        return res.returncode == 0
    except Exception as e:
        print(f"[ERR] Failed to execute audit command: {e}")
        return False

if __name__ == "__main__":
    sub_cmd = sys.argv[1] if len(sys.argv) > 1 else "all"
    execute(sub_cmd)
