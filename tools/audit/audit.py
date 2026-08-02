#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
audit.py - Lark OS Developer Audit Toolkit Unified CLI
Release 27.8.13 - Developer Quality-of-Life Toolkit

Entry point for architectural validation, layer dependency checks, ServiceRegistry
auditing, asset integrity verification, API snapshotting, and architectural search.

Usage:
    python tools/audit/audit.py all
    python tools/audit/audit.py architecture
    python tools/audit/audit.py dependencies
    python tools/audit/audit.py services
    python tools/audit/audit.py manifest
    python tools/audit/audit.py assets
    python tools/audit/audit.py api
    python tools/audit/audit.py graph
    python tools/audit/audit.py search WindowService
"""

import sys
import argparse
from pathlib import Path

# Ensure tools/audit is in Python path for sub-module imports
AUDIT_DIR = Path(__file__).resolve().parent
if str(AUDIT_DIR) not in sys.path:
    sys.path.insert(0, str(AUDIT_DIR))

import architecture_audit
import dependency_audit
import service_registry_audit
import manifest_audit
import assets_audit
import api_audit
import graph_audit
import fallback_audit
import orphan_audit
import presentation_audit
import coverage_audit

def main():
    parser = argparse.ArgumentParser(
        description="Lark OS Developer Audit Toolkit CLI (Release 27.8.21)",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    subparsers = parser.add_subparsers(dest="command", help="Audit subcommands")

    subparsers.add_parser("all", help="Execute complete suite (Enforces all Constitutional Laws)")
    subparsers.add_parser("architecture", help="[Constitution Sec. 2] Layer Ownership Law & Entry Points")
    subparsers.add_parser("dependencies", help="[Constitution Sec. 2] Downward Dependency & No Circular Dependency Law")
    subparsers.add_parser("services", help="[Constitution Sec. 4] Service Registration Law & Duplicate Key Auditor")
    subparsers.add_parser("manifest", help="[Constitution Sec. 10] Architectural Discovery Principle Index Generator")
    subparsers.add_parser("assets", help="[Constitution Sec. 15] Asset Integrity Principle & Path Auditor")
    subparsers.add_parser("api", help="[Constitution Sec. 4] Public API Stability Principle Snapshot Auditor")
    subparsers.add_parser("graph", help="[Constitution Sec. 2] Generate Mermaid & DOT Dependency DAG Graphs")
    subparsers.add_parser("fallbacks", help="[Constitution Sec. 17] Deterministic Execution Law & Fallback Auditor")
    subparsers.add_parser("orphans", help="[Constitution Sec. 18] Architectural Ownership Law & Orphan Auditor")
    subparsers.add_parser("presentation", help="[Constitution Sec. 25] Presentation Integrity & Semantic Rendering Auditor")
    subparsers.add_parser("coverage", help="[Constitution Sec. 20] Observable Audit Coverage Report & Matrix")

    search_parser = subparsers.add_parser("search", help="Search the architectural index for a class or service")
    search_parser.add_argument("query", type=str, help="Class, service, or manager name to inspect")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    cmd = args.command.lower()

    if cmd == "architecture":
        architecture_audit.main()
    elif cmd == "dependencies":
        dependency_audit.main()
    elif cmd == "services":
        service_registry_audit.main()
    elif cmd == "manifest":
        manifest_audit.run_manifest()
    elif cmd == "assets":
        assets_audit.run_assets_audit()
    elif cmd == "api":
        api_audit.run_api_audit()
    elif cmd == "graph":
        graph_audit.run_graph_audit()
    elif cmd == "fallbacks":
        fallback_audit.run_fallback_audit()
    elif cmd == "orphans":
        orphan_audit.run_orphan_audit()
    elif cmd == "presentation":
        presentation_audit.audit_presentation_integrity()
    elif cmd == "coverage":
        coverage_audit.run_coverage_audit()
    elif cmd == "search":
        manifest_audit.search_index(args.query)
    elif cmd == "all":
        print("\n=== RUNNING COMPLETE DEVELOPER AUDIT SUITE ===")
        architecture_audit.main()
        dependency_audit.main()
        service_registry_audit.main()
        assets_audit.run_assets_audit()
        manifest_audit.run_manifest()
        api_audit.run_api_audit()
        graph_audit.run_graph_audit()
        fallback_audit.run_fallback_audit()
        orphan_audit.run_orphan_audit()
        presentation_audit.audit_presentation_integrity()
        coverage_audit.run_coverage_audit()
        print("\n✔ COMPLETE AUDIT SUITE FINISHED.")

if __name__ == "__main__":
    main()
