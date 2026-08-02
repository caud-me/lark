#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lde_migrate.py - Lark OS Repository Migration Tool
Release 27.8.7 - Realistic OS Layering Reorganization Prototype

Reorganizes src/ into:
    0-firmware / 1-kernel / 2-storage / 3-system / 4-policies /
    5-platform / 6-apps / 7-sdk / 8-developer / 9-ui

Usage:
    python tools/migration/lde_migrate.py --dry-run
    python tools/migration/lde_migrate.py --execute
"""

import os
import re
import sys
import shutil
import argparse
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

ROOT = Path(r"c:\Users\ar\Documents\GitHub\lark-desktop-environment - experimental")
SRC  = ROOT / "src"

# Matches relative ES import/export-from paths and dynamic import() calls
# Captures: group1=prefix, group2=open-quote, group3=path, group4=close-quote
IMPORT_RE = re.compile(
    r"""((?:from|import)\s*\(?\s*)(['"])(\.[\.\w/\-]+\.js)(['"])""",
    re.MULTILINE,
)

# Matches AppRegistry entryPoint runtime strings (absolute from repo root)
ENTRY_POINT_RE = re.compile(r"(entryPoint\s*:\s*['\"])src/([^'\"]+)(['\"])")

# Matches ./src/... path strings inside sw.js ASSETS_TO_CACHE
SW_PATH_RE = re.compile(r"(['\"])(\./src/)([^'\"]+)(['\"])")

# Matches src=... or href=... referencing ./src/ or src/ in HTML files
HTML_SRC_RE = re.compile(r'(src=["\']|href=["\'])(\./)?src/([^"\']+)(["\'])')

# ---------------------------------------------------------------------------
# Prefix mapping: old bare path (no leading src/) -> new bare path
# Order matters: more-specific entries first
# ---------------------------------------------------------------------------
PREFIX_MAP = [
    ("firmware/BootLoader.js",     "0-firmware/BootLoader.js"),
    ("1-kernel/BootLoader.js",    "0-firmware/BootLoader.js"),
    ("kernel/BootLoader.js",      "0-firmware/BootLoader.js"),
    ("firmware/",                  "0-firmware/"),
    ("services/ProcessService.js", "5-platform/process/ProcessService.js"),
    ("commands/",                  "5-platform/commands/"),
    ("apps/",                      "6-apps/"),
    ("platform/",                  "5-platform/"),
    ("kernel/",                    "1-kernel/"),
    ("storage/",                   "2-storage/"),
    ("system/",                    "3-system/"),
    ("policies/",                  "4-policies/"),
    ("sdk/",                       "7-sdk/"),
    ("developer/",                 "8-developer/"),
    ("ui/",                        "9-ui/"),
]

# ---------------------------------------------------------------------------
# Build File Move List
# ---------------------------------------------------------------------------

def collect_moves():
    """Returns list of (old_absolute_Path, new_absolute_Path) for every file."""
    moves = []

    def add_tree(src_folder, dest_folder):
        if not Path(src_folder).exists():
            return
        for f in Path(src_folder).rglob("*"):
            if f.is_file():
                rel = f.relative_to(src_folder)
                moves.append((f, Path(dest_folder) / rel))

    if (SRC / "firmware").exists():
        add_tree(SRC / "firmware",  SRC / "0-firmware")
    if (SRC / "1-kernel" / "BootLoader.js").exists():
        moves.append((SRC / "1-kernel" / "BootLoader.js", SRC / "0-firmware" / "BootLoader.js"))
    add_tree(SRC / "kernel",    SRC / "1-kernel")
    add_tree(SRC / "storage",   SRC / "2-storage")
    add_tree(SRC / "system",    SRC / "3-system")
    add_tree(SRC / "policies",  SRC / "4-policies")
    add_tree(SRC / "platform",  SRC / "5-platform")
    add_tree(SRC / "apps",      SRC / "6-apps")
    add_tree(SRC / "sdk",       SRC / "7-sdk")
    add_tree(SRC / "developer", SRC / "8-developer")
    add_tree(SRC / "ui",        SRC / "9-ui")

    # Orphan consolidations
    ps = SRC / "services" / "ProcessService.js"
    if ps.exists():
        moves.append((ps, SRC / "5-platform" / "process" / "ProcessService.js"))

    if (SRC / "commands").exists():
        for f in (SRC / "commands").iterdir():
            if f.is_file():
                moves.append((f, SRC / "5-platform" / "commands" / f.name))

    return moves


def build_path_map(moves):
    """Maps old resolved path string -> new resolved Path."""
    return {str(old.resolve()): new.resolve() for old, new in moves}


# ---------------------------------------------------------------------------
# JS Import Rewriting
# ---------------------------------------------------------------------------

def resolve_import(imp_str, from_old):
    """Resolve a relative import path to an absolute Path."""
    try:
        candidate = (from_old.parent / imp_str).resolve()
        if candidate.exists():
            return candidate
        js = Path(str(candidate) + ".js")
        if js.exists():
            return js
        return candidate  # return anyway so we can match moves
    except Exception:
        return None


def make_relative(from_new, to_new):
    """Compute relative path string from new file location to new target."""
    try:
        rel = os.path.relpath(str(to_new), str(from_new.parent))
        rel = rel.replace("\\", "/")
        if not rel.startswith("."):
            rel = "./" + rel
        return rel
    except ValueError:
        return None


def rewrite_js_imports(content, old_file, new_file, path_map):
    """Rewrite all relative ES import paths. Returns (new_content, changes_list)."""
    changes = []

    def replacer(m):
        prefix  = m.group(1)
        q_open  = m.group(2)
        imp     = m.group(3)
        q_close = m.group(4)

        resolved = resolve_import(imp, old_file)
        if resolved is None:
            return m.group(0)

        new_target = path_map.get(str(resolved))
        if new_target is None:
            return m.group(0)

        new_rel = make_relative(new_file, new_target)
        if new_rel is None:
            return m.group(0)

        changes.append(f"    {imp!r:55s}  ->  {new_rel!r}")
        return f"{prefix}{q_open}{new_rel}{q_close}"

    new_content = IMPORT_RE.sub(replacer, content)
    return new_content, changes


# ---------------------------------------------------------------------------
# Path Rewriting Helpers (entryPoints, sw.js, HTML)
# ---------------------------------------------------------------------------

def remap_bare_path(bare):
    """Apply PREFIX_MAP to a bare path (no leading 'src/'). Returns new bare or None."""
    for old_pfx, new_pfx in PREFIX_MAP:
        if bare == old_pfx or bare.startswith(old_pfx):
            return new_pfx + bare[len(old_pfx):]
    return None


def rewrite_entry_points(content):
    changes = []

    def replacer(m):
        prefix = m.group(1)
        bare   = m.group(2)   # path after 'src/'
        suffix = m.group(3)
        new_bare = remap_bare_path(bare)
        if new_bare and new_bare != bare:
            changes.append(f"    src/{bare}  ->  src/{new_bare}")
            return f"{prefix}src/{new_bare}{suffix}"
        return m.group(0)

    new_content = ENTRY_POINT_RE.sub(replacer, content)
    return new_content, changes


def rewrite_sw_paths(content):
    changes = []

    def replacer(m):
        q_open  = m.group(1)
        dot_src = m.group(2)   # './src/'
        bare    = m.group(3)   # rest after src/
        q_close = m.group(4)
        new_bare = remap_bare_path(bare)
        if new_bare and new_bare != bare:
            changes.append(f"    ./src/{bare}  ->  ./src/{new_bare}")
            return f"{q_open}{dot_src}{new_bare}{q_close}"
        return m.group(0)

    new_content = SW_PATH_RE.sub(replacer, content)
    return new_content, changes


def rewrite_html_paths(content):
    changes = []

    def replacer(m):
        attr    = m.group(1)       # src=" or href="
        dotslash = m.group(2) or "" # optional './'
        bare    = m.group(3)        # path after src/
        q_close = m.group(4)
        new_bare = remap_bare_path(bare)
        if new_bare and new_bare != bare:
            changes.append(f"    src/{bare}  ->  src/{new_bare}")
            return f"{attr}{dotslash}src/{new_bare}{q_close}"
        return m.group(0)

    new_content = HTML_SRC_RE.sub(replacer, content)
    return new_content, changes


# ---------------------------------------------------------------------------
# Main Runner
# ---------------------------------------------------------------------------

def run(dry_run):
    label = "DRY RUN" if dry_run else "EXECUTE"
    bar   = "-" * 64
    print(f"\n{bar}")
    print(f"  Lark OS Migration Tool - {label}")
    print(f"{bar}\n")

    moves    = collect_moves()
    path_map = build_path_map(moves)
    total    = len(moves)
    print(f"Plan: {total} files to relocate.\n")

    # -- Phase 1: Copy Files -----------------------------------------------
    print("-- Phase 1: File Moves -----------------------------------------------")
    ok = 0
    missing = []
    for old, new in moves:
        if not old.exists():
            missing.append(str(old.relative_to(ROOT)))
            continue
        rel_old = old.relative_to(ROOT)
        rel_new = new.relative_to(ROOT)
        print(f"  {rel_old}")
        print(f"    -> {rel_new}")
        if not dry_run:
            new.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(str(old), str(new))
        ok += 1

    if missing:
        print(f"\n  WARNING: {len(missing)} source files not found:")
        for p in missing:
            print(f"    MISSING: {p}")

    print(f"\n  {ok}/{total} files {'would be' if dry_run else 'were'} copied.\n")

    # -- Phase 2: Rewrite JS Imports ----------------------------------------
    print("-- Phase 2: ES Module Import Rewriting ---------------------------------------")
    js_changed = 0
    for old, new in moves:
        if old.suffix != ".js":
            continue
        read_from = old if dry_run else new
        if not read_from.exists():
            continue

        content = read_from.read_text(encoding="utf-8", errors="replace")
        new_content, import_changes = rewrite_js_imports(content, old, new, path_map)

        # Apply entryPoint string rewriting to all JS files
        new_content, ep_changes = rewrite_entry_points(new_content)

        all_changes = import_changes + ep_changes
        if all_changes:
            print(f"\n  {new.relative_to(ROOT)}")
            for c in all_changes:
                print(c)
            js_changed += 1
            if not dry_run:
                read_from.write_text(new_content, encoding="utf-8")

    print(f"\n  {js_changed} JS files {'would have' if dry_run else 'had'} paths rewritten.\n")

    # -- Phase 3: sw.js -----------------------------------------------------
    print("-- Phase 3: sw.js Cache List -------------------------------------------------")
    sw_path = ROOT / "sw.js"
    if sw_path.exists():
        content = sw_path.read_text(encoding="utf-8", errors="replace")
        new_content, sw_changes = rewrite_sw_paths(content)
        if sw_changes:
            print(f"  {len(sw_changes)} entries {'would be' if dry_run else 'were'} updated:")
            for c in sw_changes:
                print(c)
            if not dry_run:
                sw_path.write_text(new_content, encoding="utf-8")
        else:
            print("  No cache paths matched.")
    else:
        print("  sw.js not found.")
    print()

    # -- Phase 4: HTML files -----------------------------------------------
    print("-- Phase 4: HTML Path Updates ------------------------------------------------")
    for name in ["index.html", "indexer.html"]:
        p = ROOT / name
        if not p.exists():
            continue
        content = p.read_text(encoding="utf-8", errors="replace")
        new_content, html_changes = rewrite_html_paths(content)
        if html_changes:
            print(f"  {name}: {len(html_changes)} paths {'would be' if dry_run else 'were'} updated:")
            for c in html_changes:
                print(c)
            if not dry_run:
                p.write_text(new_content, encoding="utf-8")
        else:
            print(f"  {name}: no HTML src path changes needed.")
    print()

    # -- Phase 5: Remove Old Directories ------------------------------------
    if not dry_run:
        print("-- Phase 5: Remove Old Source Directories ------------------------------------")
        OLD_DIRS = [
            SRC / "firmware", SRC / "kernel",   SRC / "storage",  SRC / "system",
            SRC / "policies", SRC / "platform", SRC / "services",
            SRC / "commands", SRC / "apps",     SRC / "sdk",
            SRC / "developer",SRC / "ui",       SRC / "config",
        ]
        for d in OLD_DIRS:
            if d.exists():
                shutil.rmtree(str(d))
                print(f"  Removed: {d.relative_to(ROOT)}/")
        print()

    print(bar)
    if dry_run:
        print("  DRY RUN COMPLETE - no files were written or deleted.")
        print("  Re-run with --execute to apply changes.")
    else:
        print("  MIGRATION COMPLETE.")
    print(f"{bar}\n")


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Lark OS Repository Migration Tool — Series 27.8.6"
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true",
                       help="Preview all changes without writing anything")
    group.add_argument("--execute", action="store_true",
                       help="Apply all changes to the repository")
    args = parser.parse_args()
    run(dry_run=args.dry_run)
