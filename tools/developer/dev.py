#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
dev.py - Lark OS Developer Platform Unified CLI
Release 27.8.15 - Developer Platform & Self-Describing Skills

Single canonical CLI entrypoint for Developer Platform Skills and Constitutional Law Enforcement:
  python tools/developer/dev.py explain <Symbol>
  python tools/developer/dev.py before <Symbol>
  python tools/developer/dev.py inspect <Symbol> [--verbose]
  python tools/developer/dev.py review <FilePathOrClass>
  python tools/developer/dev.py identifier [SearchPath]
  python tools/developer/dev.py metrics
  python tools/developer/dev.py audit <subcommand>
  python tools/developer/dev.py skills
"""

import sys
import argparse
from pathlib import Path

# Add skills directory to path
SKILLS_DIR = Path(__file__).resolve().parent / "skills"
if str(SKILLS_DIR) not in sys.path:
    sys.path.insert(0, str(SKILLS_DIR))

import skill_explain
import skill_before
import skill_inspect
import skill_review
import skill_identifier
import skill_metrics
import skill_trace
import skill_audit

ALL_SKILLS = [
    skill_explain,
    skill_before,
    skill_inspect,
    skill_review,
    skill_identifier,
    skill_metrics,
    skill_trace,
    skill_audit
]

def list_skills():
    print("=" * 64)
    print("  Lark OS Developer Platform — Available Skills Index (Release 27.8.15)")
    print("=" * 64)
    for mod in ALL_SKILLS:
        meta = mod.SKILL_METADATA
        print(f"\nSkill:         {meta['name']}")
        print(f"  Command:     {meta['command']}")
        print(f"  Category:    {meta['category']}")
        print(f"  Purpose:     {meta['purpose']}")
        print(f"  Inputs:      {meta['inputs']}")
        print(f"  Outputs:     {meta['outputs']}")
        print(f"  Read-Only:   {'Yes' if meta['read_only'] else 'No'}")
        print(f"  Constitution:{meta['constitution']}")
    print("\n" + "=" * 64)

def main():
    parser = argparse.ArgumentParser(
        description="Lark OS Developer Platform Unified CLI (Release 27.8.15)",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    subparsers = parser.add_subparsers(dest="command", help="Developer Platform commands")

    # dev.py explain
    exp_parser = subparsers.add_parser("explain", help="Skill: Explain symbol responsibility, owner, dependencies & laws")
    exp_parser.add_argument("symbol", type=str, help="Symbol name (e.g. WindowService, FileService)")

    # dev.py before
    bef_parser = subparsers.add_parser("before", help="Skill: Pre-flight checklist before modifying a symbol")
    bef_parser.add_argument("symbol", type=str, help="Symbol name (e.g. WindowService, FileService)")

    # dev.py inspect
    ins_parser = subparsers.add_parser("inspect", help="Skill: 360° symbol profiling & Architecture Confidence score")
    ins_parser.add_argument("symbol", type=str, help="Symbol name (e.g. WindowService, FileService)")
    ins_parser.add_argument("--verbose", "-v", action="store_true", help="Include inbound consumers, registry, LOC")

    # dev.py review
    rev_parser = subparsers.add_parser("review", help="Skill: 5-star Beginner Readability & SOLID scorecard reviewer")
    rev_parser.add_argument("target", type=str, help="File path or class name to review")

    # dev.py identifier
    ide_parser = subparsers.add_parser("identifier", help="Skill: Variable naming quality & cryptic identifier inspector")
    ide_parser.add_argument("path", type=str, nargs="?", default="src", help="Search path (defaults to src/)")

    # dev.py metrics
    subparsers.add_parser("metrics", help="Skill: Codebase LOC telemetry, layer density & historical growth timeline")

    # dev.py trace
    trc_parser = subparsers.add_parser("trace", help="Skill: Architectural execution flow tracing & static call graph visualization")
    trc_parser.add_argument("symbol", type=str, help="Symbol or method name (e.g. WindowService.snapWindow, Notepad.run)")
    trc_parser.add_argument("--depth", type=int, default=5, help="Maximum trace depth (default: 5)")

    # dev.py skills
    subparsers.add_parser("skills", help="Self-documenting skills index & metadata registry")

    # dev.py audit
    aud_parser = subparsers.add_parser("audit", help="Delegated Constitutional Law Enforcement (all, fallbacks, orphans, etc.)")
    aud_parser.add_argument("subcommand", type=str, nargs="?", default="all", help="Audit subcommand (default: all)")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    cmd = args.command.lower()

    if cmd == "explain":
        skill_explain.execute(args.symbol)
    elif cmd == "before":
        skill_before.execute(args.symbol)
    elif cmd == "inspect":
        skill_inspect.execute(args.symbol, verbose=args.verbose)
    elif cmd == "review":
        skill_review.execute(args.target)
    elif cmd == "identifier":
        skill_identifier.execute(args.path)
    elif cmd == "metrics":
        skill_metrics.execute()
    elif cmd == "trace":
        skill_trace.execute(args.symbol, max_depth=args.depth)
    elif cmd == "skills":
        list_skills()
    elif cmd == "audit":
        skill_audit.execute(args.subcommand)

if __name__ == "__main__":
    main()
