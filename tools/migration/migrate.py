#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LDE Repository Migration Tool v2.0
====================================
Deterministic, transactional, rollback-safe, idempotent repository reorganization.

All moves originate exclusively from migration_map.json.
No architectural knowledge is embedded in this script.

Transaction flow:
  START
    backup
    copy files to new locations  (originals preserved)
    rewrite imports in new locations
    verify
    if passed  -> COMMIT  (delete originals, clean empty dirs)
    if failed  -> ROLLBACK (remove new files, restore backups)
  END

Usage:
  python migrate.py --dry-run    Preview all changes. Nothing is written.
  python migrate.py --execute    Perform the migration.
  python migrate.py --verify     Verify the current repository state.
"""

import argparse
import json
import os
import re
import shutil
import sys
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

# Force UTF-8 output on Windows (avoids UnicodeEncodeError in cp1252 terminals).
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


# ── Constants ──────────────────────────────────────────────────────────────────

TOOL_VERSION = "2.0"

# The script lives at tools/migration/migrate.py — two directories above the repo root.
TOOL_DIR  = Path(__file__).parent.resolve()
REPO_ROOT = TOOL_DIR.parent.parent.resolve()
MAP_FILE  = TOOL_DIR / "migration_map.json"

SKIP_DIRS    = {".git", "node_modules", "migration_backup", ".gemini", "__pycache__", "tools"}
JS_EXTENSIONS = {".js", ".mjs"}

# Files excluded from the unknown-syntax scanner.
# These files use relative-looking strings in non-import contexts (e.g. string arrays).
# They will NOT have their content rewritten — add them to migration_map.json if moves are needed.
SKIP_UNKNOWN_SCAN = {"sw.js"}

# Import patterns. Each captures three groups:
#   1 = prefix  (everything before the path string)
#   2 = the path string itself  (what we rewrite)
#   3 = suffix  (closing quote/bracket)
# Only relative paths (./ or ../) are in scope.
_REL = r"(\.\.?/[^'\")\s]+)"

IMPORT_PATTERNS: List[re.Pattern] = [
    # Static — all forms: default, named, namespace, side-effect
    re.compile(r"""(import\s+(?:[^'"]*?\s+from\s+)?['"])""" + _REL + r"""(['"])"""),
    # Dynamic:  await import('./x')  /  import('./x')
    re.compile(r"""((?:await\s+)?import\s*\(\s*['"])""" + _REL + r"""(['"]\s*\))"""),
    # Asset URL:  new URL('./x', import.meta.url)
    re.compile(r"""(new\s+URL\s*\(\s*['"])""" + _REL + r"""(['"]\s*,)"""),
    # Data fetch:  fetch('./x.json')
    re.compile(r"""(fetch\s*\(\s*['"])""" + _REL + r"""(['"]\s*[\),])"""),
]

# Catch-all: any quoted relative string — used to detect unhandled import syntax.
_CATCH_ALL_RELATIVE = re.compile(r"""['"](\./|\.\./)[^'"\s)]+['"]""")


# ── Data Classes ───────────────────────────────────────────────────────────────

@dataclass
class ImportCoverage:
    scanned: int = 0
    updated: int = 0
    skipped: int = 0
    unknown: List[str] = field(default_factory=list)

    @property
    def unknown_count(self) -> int:
        return len(self.unknown)

    def to_dict(self) -> dict:
        return {
            "scanned":       self.scanned,
            "updated":       self.updated,
            "skipped":       self.skipped,
            "unknown_count": self.unknown_count,
            "unknown":       self.unknown,
        }


@dataclass
class VerificationCheck:
    name:     str
    passed:   bool = True
    checked:  int  = 0
    failures: List[str] = field(default_factory=list)

    def fail(self, msg: str) -> None:
        self.failures.append(msg)
        self.passed = False

    def to_dict(self) -> dict:
        return {
            "name":     self.name,
            "passed":   self.passed,
            "checked":  self.checked,
            "failures": self.failures,
        }


@dataclass
class VerificationResult:
    checks: List[VerificationCheck] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return all(c.passed for c in self.checks)

    @property
    def failure_count(self) -> int:
        return sum(len(c.failures) for c in self.checks)

    def to_dict(self) -> dict:
        return {
            "passed":        self.passed,
            "failure_count": self.failure_count,
            "checks":        [c.to_dict() for c in self.checks],
        }


# ── Terminal Utilities ─────────────────────────────────────────────────────────

def _is_tty() -> bool:
    return hasattr(sys.stdout, "isatty") and sys.stdout.isatty()


def show_progress(label: str, current: int, total: int, width: int = 32) -> None:
    """Render an in-place progress bar (TTY only)."""
    if not _is_tty() or total == 0:
        return
    filled = min(width, int(width * current / total))
    bar    = "\u2588" * filled + "\u2591" * (width - filled)
    pct    = int(100 * current / total)
    print(f"\r  {label:<20} [{bar}] {pct:3d}%  {current}/{total}", end="", flush=True)


def end_progress(label: str = "", total: int = 0) -> None:
    """Finalize the progress bar line."""
    if _is_tty():
        if label:
            width = 32
            bar = "\u2588" * width
            print(f"\r  {label:<20} [{bar}] 100%  {total}/{total}", flush=True)
        else:
            print(flush=True)


def hr(char: str = "-", width: int = 58) -> str:
    return char * width


def section(title: str) -> None:
    print(f"\n-- {title} {'-' * max(0, 54 - len(title))}")


def ok(msg: str) -> None:  print(f"  \u2705 {msg}")
def warn(msg: str) -> None: print(f"  \u26a0\ufe0f  {msg}")
def err(msg: str) -> None:  print(f"  \u274c {msg}")
def info(msg: str) -> None: print(f"  {msg}")


# ── Path Utilities ─────────────────────────────────────────────────────────────

def to_posix(p: Path) -> str:
    return p.as_posix()


def rel(p: Path, root: Path) -> str:
    return to_posix(p.relative_to(root))


def relative_import(from_dir: Path, target: Path) -> str:
    """
    Compute a correct relative import string from from_dir to target.
    Always POSIX-style, always starts with './' or '../'.
    """
    r = os.path.relpath(target, from_dir).replace("\\", "/")
    if not r.startswith("."):
        r = "./" + r
    return r


def resolve_import(import_str: str, from_file: Path) -> Optional[Path]:
    """
    Resolve a relative import string to an absolute path.
    Returns None for non-relative strings (bare specifiers, absolute URLs).
    """
    if not (import_str.startswith("./") or import_str.startswith("../")):
        return None
    try:
        return (from_file.parent / import_str).resolve()
    except Exception:
        return None


# ── Repository Scanner ─────────────────────────────────────────────────────────

def find_all_js_files(root: Path) -> List[Path]:
    """Recursively collect all JS/MJS files, skipping SKIP_DIRS."""
    files: List[Path] = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            p = Path(dirpath) / fn
            if p.suffix in JS_EXTENSIONS:
                files.append(p)
    return files


# ── Migration Map ──────────────────────────────────────────────────────────────

def load_forward_map(map_file: Path, repo_root: Path) -> Dict[Path, Path]:
    """
    Load migration_map.json -> {old_abs_path: new_abs_path}.
    Keys starting with '_comment_' are documentation markers — ignored.
    """
    with open(map_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    forward: Dict[Path, Path] = {}
    for old_rel, new_rel in data.get("moves", {}).items():
        if old_rel.startswith("_comment_"):
            continue
        old_abs = (repo_root / old_rel).resolve()
        new_abs = (repo_root / new_rel).resolve()
        forward[old_abs] = new_abs

    return forward


# ── State Detection ────────────────────────────────────────────────────────────

def detect_migration_state(
    forward_map: Dict[Path, Path]
) -> Tuple[str, List[Tuple[Path, Path]]]:
    """
    Returns (state, details) where state is one of:
      'pending'   — all sources exist, no destinations exist yet
      'completed' — all sources gone, all destinations present
      'collision' — destinations exist while sources still exist (would overwrite)
      'partial'   — mixed state (some sources gone, some destinations missing)
    """
    collisions = [
        (old, new) for old, new in forward_map.items()
        if old.exists() and new.exists()
    ]
    if collisions:
        return "collision", collisions

    sources_present = sum(1 for old in forward_map if old.exists())
    dests_present   = sum(1 for new in forward_map.values() if new.exists())
    total           = len(forward_map)

    if sources_present == 0 and dests_present == total:
        return "completed", []
    if sources_present == total and dests_present == 0:
        return "pending", []
    return "partial", []


# ── Import Rewriter ────────────────────────────────────────────────────────────

def rewrite_content(
    content:      str,
    file_original: Path,
    file_final:    Path,
    forward_map:   Dict[Path, Path],
    coverage:      ImportCoverage,
) -> str:
    """
    Rewrite all relative imports in `content`.

    - file_original: where the import strings were authored relative to
                     (original location, even if the file has been copied)
    - file_final:    the file's final destination
                     (used to compute the new relative import string)
    - coverage:      updated in-place (scanned / updated / skipped / unknown)

    Returns the rewritten content string.
    """
    # Track character spans covered by a known import pattern.
    # Anything with a relative path NOT in these spans is flagged as unknown syntax.
    handled_spans: Set[Tuple[int, int]] = set()

    def make_replacer(pattern: re.Pattern):
        def replacer(m: re.Match) -> str:
            prefix   = m.group(1)
            path_str = m.group(2)
            suffix   = m.group(3)

            # Mark this span as handled.
            handled_spans.add((m.start(2), m.end(2)))
            coverage.scanned += 1

            # Resolve relative to original location.
            target_original = resolve_import(path_str, file_original)
            if target_original is None:
                coverage.skipped += 1
                return m.group(0)  # non-relative — leave unchanged

            # Find where the target ends up.
            target_final = forward_map.get(target_original, target_original)

            # If neither file nor target moved, nothing to do.
            if target_final == target_original and file_final == file_original:
                coverage.skipped += 1
                return m.group(0)

            # Compute the new import from the file's final location.
            new_import = relative_import(file_final.parent, target_final)

            if new_import == path_str:
                coverage.skipped += 1
                return m.group(0)

            coverage.updated += 1
            return prefix + new_import + suffix

        return replacer

    new_content = content
    for pattern in IMPORT_PATTERNS:
        new_content = pattern.sub(make_replacer(pattern), new_content)

    # Scan for relative path strings not captured by any pattern.
    # Skip files that intentionally use relative-looking strings in non-import contexts.
    if file_original.name not in SKIP_UNKNOWN_SCAN:
        for m in _CATCH_ALL_RELATIVE.finditer(content):
            span = (m.start() + 1, m.end() - 1)  # inside the quotes
            if span not in handled_spans:
                line_num = content[: m.start()].count("\n") + 1
                line     = content.split("\n")[line_num - 1].strip()
                entry    = f"{to_posix(file_original)}:{line_num}: {line}"
                coverage.unknown.append(entry)

    return new_content


# ── Rewrite Planner ────────────────────────────────────────────────────────────

def build_rewrite_plan(
    files_to_scan: List[Path],
    forward_map:   Dict[Path, Path],
    reverse_map:   Dict[Path, Path],
    coverage:      ImportCoverage,
    label:         str = "Analyzing",
) -> Dict[Path, Tuple[str, int]]:
    """
    Returns {file_path: (new_content, change_count)} for every file that needs
    import rewrites.

    files_to_scan should contain:
      - In dry-run:  all original JS files
      - Post-copy:   new locations of moved files + original locations of unmoved files
    """
    plan: Dict[Path, Tuple[str, int]] = {}
    total = len(files_to_scan)

    for i, file_path in enumerate(files_to_scan):
        show_progress(label, i + 1, total)

        # Determine where this file's content was originally authored.
        if file_path in reverse_map:
            # Copied to new location — content authored at old location.
            file_original = reverse_map[file_path]
        elif file_path not in forward_map:
            # Did not move.
            file_original = file_path
        else:
            # Old location of a moved file — skip (process the new copy instead).
            continue

        file_final = forward_map.get(file_original, file_original)

        try:
            content = file_path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue

        updates_before = coverage.updated
        new_content    = rewrite_content(content, file_original, file_final, forward_map, coverage)
        change_count   = coverage.updated - updates_before

        if new_content != content:
            plan[file_path] = (new_content, change_count)

    end_progress(label, total)
    return plan


# ── Backup Manager ─────────────────────────────────────────────────────────────

class BackupManager:
    """
    Creates a timestamped backup directory before any file mutations.

    Layout:
      migration_backup/
        YYYY-MM-DD_HHMMSS/
          manifest.json           maps original → backup → destination
          files/
            src/services/...      original file contents
    """

    def __init__(self, repo_root: Path) -> None:
        self.repo_root  = repo_root
        timestamp       = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        self.backup_dir = repo_root / "migration_backup" / timestamp
        self.files_dir  = self.backup_dir / "files"
        self._entries:  List[dict] = []

    def prepare(self) -> None:
        self.files_dir.mkdir(parents=True, exist_ok=True)
        info(f"Backup directory: migration_backup/{self.backup_dir.name}/")

    def backup(
        self,
        abs_path:    Path,
        destination: Optional[Path] = None,
        role:        str = "moved",
    ) -> Path:
        """
        Copy abs_path into the backup directory.
        Returns the backup path.
        role: 'moved' | 'rewritten'
        """
        rel_path    = abs_path.relative_to(self.repo_root)
        backup_path = self.files_dir / rel_path
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(abs_path, backup_path)

        entry: dict = {
            "role":          role,
            "original_path": to_posix(rel_path),
            "backup_path":   to_posix(backup_path.relative_to(self.backup_dir)),
        }
        if destination:
            entry["destination_path"] = to_posix(destination.relative_to(self.repo_root))

        self._entries.append(entry)
        return backup_path

    def write_manifest(self) -> None:
        manifest = {
            "timestamp":        datetime.now().isoformat(),
            "tool_version":     TOOL_VERSION,
            "total_files":      len(self._entries),
            "restore_command":  "python migrate.py --restore  (not yet implemented — copy files/ back manually)",
            "entries":          self._entries,
        }
        manifest_path = self.backup_dir / "manifest.json"
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)
        info(f"Backup manifest written ({len(self._entries)} entries).")

    def restore(self) -> int:
        """
        Restore all backed-up files to their original locations.
        Returns the count of restored files.
        """
        restored = 0
        for entry in self._entries:
            backup_abs   = self.backup_dir / entry["backup_path"]
            original_abs = self.repo_root  / entry["original_path"]
            if backup_abs.exists():
                original_abs.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(backup_abs, original_abs)
                restored += 1
        return restored


# ── Transaction ────────────────────────────────────────────────────────────────

class Transaction:
    """
    Wraps the migration in explicit transaction semantics.

    States:  idle → started → committed
                           ↘ rolled_back

    Usage:
      tx = Transaction(backup_manager)
      tx.start()
      tx.record_new_file(path)   # call for each copied file
      ...
      if ok:
          deleted, dirs = tx.commit(forward_map, parent_dirs)
      else:
          tx.rollback()
    """

    def __init__(self, backup: BackupManager) -> None:
        self.backup        = backup
        self.state         = "idle"
        self._new_files:   List[Path] = []    # files created by the copy phase

    def start(self) -> None:
        if self.state != "idle":
            raise RuntimeError(f"Cannot start transaction from state: {self.state!r}")
        self.state = "started"

    def record_new_file(self, path: Path) -> None:
        """Register a file created during the copy phase (needed for rollback)."""
        self._new_files.append(path)

    def commit(
        self,
        forward_map: Dict[Path, Path],
    ) -> Tuple[List[Path], List[Path]]:
        """
        COMMIT: delete all original files, clean up now-empty directories.
        Only call after verification has fully passed.

        Returns (deleted_files, removed_dirs).
        """
        if self.state != "started":
            raise RuntimeError(f"Cannot commit from state: {self.state!r}")

        deleted: List[Path]     = []
        parent_dirs: Set[Path]  = set()

        for old_path in forward_map:
            if old_path.exists():
                parent_dirs.add(old_path.parent)
                old_path.unlink()
                deleted.append(old_path)

        # Remove now-empty directories, bottom-up.
        removed_dirs: List[Path] = []
        for d in sorted(parent_dirs, key=lambda x: len(x.parts), reverse=True):
            try:
                if d.exists() and not any(d.iterdir()):
                    d.rmdir()
                    removed_dirs.append(d)
            except OSError:
                pass

        self.state = "committed"
        return deleted, removed_dirs

    def rollback(self) -> None:
        """
        ROLLBACK: remove all files created by the copy phase,
        restore all modified unmoved files from backup.
        """
        if self.state not in ("started",):
            raise RuntimeError(f"Cannot rollback from state: {self.state!r}")

        # 1. Remove every file we copied to a new location.
        removed = 0
        new_parent_dirs: Set[Path] = set()
        for new_path in self._new_files:
            if new_path.exists():
                new_parent_dirs.add(new_path.parent)
                new_path.unlink()
                removed += 1

        # 2. Restore modified unmoved files from backup.
        restored = self.backup.restore()

        # 3. Remove now-empty directories created during copy.
        for d in sorted(new_parent_dirs, key=lambda x: len(x.parts), reverse=True):
            try:
                if d.exists() and not any(d.iterdir()):
                    d.rmdir()
            except OSError:
                pass

        self.state = "rolled_back"
        print(f"  Rollback complete: {removed} new file(s) removed, {restored} original(s) restored.")


# ── Verification Engine ────────────────────────────────────────────────────────

def verify_repository(
    forward_map:    Dict[Path, Path],
    reverse_map:    Dict[Path, Path],
    all_js_files:   List[Path],
    repo_root:      Path,
    post_migration: bool = True,
) -> VerificationResult:
    """
    Run all verification checks. Never stops on the first failure —
    every check runs to completion and all failures are collected.

    post_migration=True:  expects new locations to exist and old locations gone.
    post_migration=False: running on original layout (dry-run / pre-flight).
    """
    result = VerificationResult()

    # The set of files to scan depends on whether migration has run.
    if post_migration:
        files_to_check = (
            [new for new in forward_map.values() if new.exists() and new.suffix in JS_EXTENSIONS]
            + [f for f in all_js_files if f not in forward_map and f.suffix in JS_EXTENSIONS]
        )
    else:
        files_to_check = [f for f in all_js_files if f.suffix in JS_EXTENSIONS]

    # ── Check 1: All destination files exist ───────────────────────────────
    check = VerificationCheck("All destinations present")
    for old, new in forward_map.items():
        check.checked += 1
        if not new.exists():
            check.fail(f"MISSING: {rel(new, repo_root)}")
    result.checks.append(check)

    # ── Check 2: No duplicate destinations ────────────────────────────────
    check = VerificationCheck("No duplicate destinations")
    seen_dests: Dict[Path, Path] = {}
    for old, new in forward_map.items():
        check.checked += 1
        if new in seen_dests:
            check.fail(
                f"COLLISION: both {rel(old, repo_root)} and "
                f"{rel(seen_dests[new], repo_root)} map to {rel(new, repo_root)}"
            )
        else:
            seen_dests[new] = old
    result.checks.append(check)

    # ── Check 3: All sources have replacements ────────────────────────────
    check = VerificationCheck("All sources have destinations")
    for old, new in forward_map.items():
        check.checked += 1
        if not old.exists() and not new.exists():
            check.fail(f"ORPHANED: neither old nor new exists for {rel(old, repo_root)}")
    result.checks.append(check)

    # ── Check 4: No stale imports pointing to old paths ──────────────────
    check = VerificationCheck("No stale imports")
    total = len(files_to_check)
    for i, file_path in enumerate(files_to_check):
        show_progress("Checking imports", i + 1, total)
        check.checked += 1

        # When verifying post-migration, resolve from new location (file_original = old).
        file_original = reverse_map.get(file_path, file_path)

        try:
            content = file_path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue

        for pattern in IMPORT_PATTERNS:
            for m in pattern.finditer(content):
                path_str = m.group(2)
                target   = resolve_import(path_str, file_original)
                if target and target in forward_map:
                    # Calculate where the target ended up
                    target_final_location = forward_map[target]
                    
                    # Calculate what the relative path SHOULD be from this file's current location
                    expected_relative_path = relative_import(file_path.parent, target_final_location)
                    
                    # Only fail if the current string doesn't match the expected correct path
                    if path_str != expected_relative_path:
                        line_num = content[: m.start()].count("\n") + 1
                        check.fail(
                            f"{rel(file_path, repo_root)}:{line_num}: "
                            f"still imports old path '{path_str}'"
                        )
    end_progress("Checking imports", total)
    result.checks.append(check)

    # ── Check 5: All resolved imports exist on disk ───────────────────────
    check = VerificationCheck("All import targets exist")
    for i, file_path in enumerate(files_to_check):
        show_progress("Checking targets", i + 1, total)
        check.checked += 1

        file_original = reverse_map.get(file_path, file_path)

        try:
            content = file_path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue

        for pattern in IMPORT_PATTERNS:
            for m in pattern.finditer(content):
                path_str = m.group(2)
                target   = resolve_import(path_str, file_path)  # resolve from current location
                if target is not None and not target.exists():
                    line_num = content[: m.start()].count("\n") + 1
                    check.fail(
                        f"{rel(file_path, repo_root)}:{line_num}: "
                        f"unresolved import '{path_str}' -> does not exist"
                    )
    end_progress("Checking targets", total)
    result.checks.append(check)

    return result


# ── Migration Runner ───────────────────────────────────────────────────────────

class MigrationRunner:
    """
    Orchestrates the full migration pipeline.
    Instantiate with dry_run=True to preview without writing anything.
    """

    def __init__(self, repo_root: Path, dry_run: bool) -> None:
        self.repo_root    = repo_root
        self.dry_run      = dry_run

        self.forward_map: Dict[Path, Path] = {}
        self.reverse_map: Dict[Path, Path] = {}
        self.all_js_files: List[Path]      = []

        # Collected results (populated during run).
        self.coverage      = ImportCoverage()
        self.moved_files:  List[Tuple[Path, Path]] = []
        self.rewritten:    List[Tuple[Path, int]]  = []
        self.deleted:      List[Path]              = []
        self.removed_dirs: List[Path]              = []
        self.warnings:     List[str]               = []
        self.errors:       List[str]               = []
        self.verification: Optional[VerificationResult] = None

        self.backup:      Optional[BackupManager] = None
        self.transaction: Optional[Transaction]   = None

    # ── Orchestration ──────────────────────────────────────────────────────

    def run(self) -> None:
        start = time.monotonic()

        mode = "DRY RUN" if self.dry_run else "EXECUTE"
        print(f"\n{'=' * 60}")
        print(f"  LDE Migration Tool v{TOOL_VERSION}  [{mode}]")
        print(f"  Repository: {self.repo_root}")
        print(f"  Map file:   {MAP_FILE.name}")
        print(f"  Started:    {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'=' * 60}")

        # Pre-flight (always runs regardless of mode).
        ok_to_proceed = (
            self._phase_load_map()
            and self._phase_scan()
            and self._phase_idempotency()
            and self._phase_collision_check()
        )

        if not ok_to_proceed:
            self._print_summary(time.monotonic() - start, 0, {})
            self._write_report(time.monotonic() - start, {})
            return

        # Plan import rewrites (reads files, writes nothing).
        section("Planning import rewrites")
        plan = build_rewrite_plan(
            files_to_scan=self.all_js_files,
            forward_map=self.forward_map,
            reverse_map=self.reverse_map,
            coverage=self.coverage,
            label="Analyzing",
        )
        info(f"{len(self.forward_map)} files to move")
        info(f"{len(plan)} files need import rewrites ({self.coverage.updated} changes)")

        if self.dry_run:
            self._print_dry_run_preview(plan)
            print("\n\n[Dry run complete - nothing was modified.]\n")
            self._print_summary(time.monotonic() - start, 0, plan)
            self._write_report(time.monotonic() - start, plan)
            return

        # Execute.
        self.backup      = BackupManager(self.repo_root)
        self.transaction = Transaction(self.backup)

        self._phase_backup(plan)
        self.transaction.start()

        try:
            self._phase_copy()
            self._phase_rewrite()
            self._phase_verify()

            if self.verification and self.verification.passed:
                self._phase_commit()
            else:
                warn("Verification failed — initiating rollback.")
                self.transaction.rollback()
                self.errors.append("Rollback triggered: verification did not pass.")

        except Exception as exc:
            err(f"Unexpected error: {exc}")
            self.errors.append(f"Unexpected error: {exc}")
            if self.transaction and self.transaction.state == "started":
                warn("Initiating emergency rollback.")
                self.transaction.rollback()
            raise

        duration = time.monotonic() - start
        self._print_summary(duration, len(self.deleted), {})
        self._write_report(duration, {})
        self._write_manifest(duration)

    def run_verify_only(self) -> None:
        start = time.monotonic()
        print(f"\n{'=' * 60}")
        print(f"  LDE Migration Tool v{TOOL_VERSION}  [VERIFY]")
        print(f"  Repository: {self.repo_root}")
        print(f"{'=' * 60}")

        self._phase_load_map()
        self._phase_scan()
        self._phase_verify()

        duration = time.monotonic() - start
        self._print_summary(duration, 0, {})
        self._write_report(duration, {})

    # ── Phase: Load Map ────────────────────────────────────────────────────

    def _phase_load_map(self) -> bool:
        section("Loading migration map")

        self.forward_map = load_forward_map(MAP_FILE, self.repo_root)
        self.reverse_map = {new: old for old, new in self.forward_map.items()}

        info(f"{len(self.forward_map)} file moves defined in {MAP_FILE.name}")

        # Warn about source files not found on disk.
        missing = [old for old in self.forward_map if not old.exists()]
        if missing:
            for m in missing:
                msg = f"Source not found: {rel(m, self.repo_root)}"
                self.warnings.append(msg)
                warn(msg)

        # Check for destination collisions (two sources mapping to same dest).
        seen: Dict[Path, Path] = {}
        for old, new in self.forward_map.items():
            if new in seen:
                msg = (
                    f"Destination collision: both {rel(old, self.repo_root)} "
                    f"and {rel(seen[new], self.repo_root)} map to {rel(new, self.repo_root)}"
                )
                self.errors.append(msg)
                err(msg)
            else:
                seen[new] = old

        if self.errors:
            err("Fatal errors in migration map — cannot proceed.")
            return False

        ok(f"Map loaded ({len(self.forward_map) - len(missing)} files available)")
        return True

    # ── Phase: Scan ────────────────────────────────────────────────────────

    def _phase_scan(self) -> bool:
        section("Scanning repository")
        self.all_js_files = find_all_js_files(self.repo_root)
        ok(f"{len(self.all_js_files)} JavaScript files found")
        return True

    # ── Phase: Idempotency Check ───────────────────────────────────────────

    def _phase_idempotency(self) -> bool:
        section("Idempotency check")

        state, details = detect_migration_state(self.forward_map)

        if state == "completed":
            ok("Migration has already been applied to this repository.")
            info("Run  --verify  to confirm the migrated state is correct.")
            info("Run  --dry-run  to preview what the map contains.")
            return False  # graceful exit — not an error

        if state == "pending":
            ok("Repository is in pre-migration state — ready to proceed.")
            return True

        if state == "partial":
            msg = "Repository is in a partial state — some sources are missing."
            self.warnings.append(msg)
            warn(msg)
            info("Continuing — missing sources will be skipped during copy.")
            return True

        # Should not reach here (collision is caught separately).
        return True

    # ── Phase: Collision Detection ─────────────────────────────────────────

    def _phase_collision_check(self) -> bool:
        section("Collision detection")

        if not self.dry_run:
            collisions = [
                (old, new) for old, new in self.forward_map.items()
                if old.exists() and new.exists()
            ]
            if collisions:
                for old, new in collisions:
                    msg = (
                        f"COLLISION: {rel(new, self.repo_root)} already exists "
                        f"(source {rel(old, self.repo_root)} also present)"
                    )
                    self.errors.append(msg)
                    err(msg)
                err(f"{len(collisions)} collision(s) detected — aborting before any changes.")
                return False

        ok("No destination collisions detected.")
        return True

    # ── Phase: Backup ──────────────────────────────────────────────────────

    def _phase_backup(self, plan: Dict) -> None:
        section("Creating backup")
        self.backup.prepare()

        backed_up = 0

        # Back up source files (files that will be moved).
        for old_path, new_path in self.forward_map.items():
            if old_path.exists():
                self.backup.backup(old_path, destination=new_path, role="moved")
                backed_up += 1

        # Back up unmoved files whose imports will be rewritten.
        for file_path in plan:
            if file_path not in self.forward_map:
                self.backup.backup(file_path, role="rewritten")
                backed_up += 1

        self.backup.write_manifest()
        ok(f"{backed_up} files backed up")

    # ── Phase: Copy Files ──────────────────────────────────────────────────

    def _phase_copy(self) -> None:
        section("Copying files to new locations")

        available = [(old, new) for old, new in self.forward_map.items() if old.exists()]
        total     = len(available)
        copied    = 0

        for i, (old_path, new_path) in enumerate(available):
            show_progress("Copying", i + 1, total)
            new_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(old_path, new_path)
            self.moved_files.append((old_path, new_path))
            self.transaction.record_new_file(new_path)
            copied += 1

        end_progress("Copying", total)
        ok(f"{copied} files copied (originals still in place)")

    # ── Phase: Rewrite Imports ─────────────────────────────────────────────

    def _phase_rewrite(self) -> None:
        section("Rewriting imports")

        # Files to scan: new locations of moved files + unmoved JS files.
        new_js    = [new for new in self.forward_map.values()
                     if new.exists() and new.suffix in JS_EXTENSIONS]
        unmoved   = [f for f in self.all_js_files
                     if f not in self.forward_map and f.suffix in JS_EXTENSIONS]
        to_scan   = new_js + unmoved

        coverage  = ImportCoverage()  # fresh counter for execution phase
        plan      = build_rewrite_plan(
            files_to_scan=to_scan,
            forward_map=self.forward_map,
            reverse_map=self.reverse_map,
            coverage=coverage,
            label="Rewriting",
        )

        applied = 0
        for file_path, (new_content, change_count) in plan.items():
            try:
                file_path.write_text(new_content, encoding="utf-8")
                self.rewritten.append((file_path, change_count))
                applied += 1
            except OSError as exc:
                msg = f"Write failed for {rel(file_path, self.repo_root)}: {exc}"
                self.errors.append(msg)
                err(msg)

        # Merge coverage into the runner's overall coverage.
        self.coverage.scanned += coverage.scanned
        self.coverage.updated += coverage.updated
        self.coverage.skipped += coverage.skipped
        self.coverage.unknown  = list(set(self.coverage.unknown + coverage.unknown))

        ok(f"{applied} files rewritten")

        if coverage.unknown:
            w = f"{len(coverage.unknown)} unhandled relative path(s) found (see report)"
            self.warnings.append(w)
            warn(w)

    # ── Phase: Verify ──────────────────────────────────────────────────────

    def _phase_verify(self) -> None:
        section("Verification")

        self.verification = verify_repository(
            forward_map=self.forward_map,
            reverse_map=self.reverse_map,
            all_js_files=self.all_js_files,
            repo_root=self.repo_root,
            post_migration=not self.dry_run,
        )

        for check in self.verification.checks:
            if check.passed:
                ok(f"{check.name} ({check.checked} checked)")
            else:
                err(f"{check.name} — {len(check.failures)} failure(s)")
                for failure in check.failures[:5]:
                    info(f"  {failure}")
                if len(check.failures) > 5:
                    info(f"  ... and {len(check.failures) - 5} more (see report)")

        if self.verification.passed:
            ok("All checks passed.")
        else:
            err(f"Verification failed — {self.verification.failure_count} failure(s).")

    # ── Phase: Commit ──────────────────────────────────────────────────────

    def _phase_commit(self) -> None:
        section("Committing (deleting originals)")

        self.deleted, self.removed_dirs = self.transaction.commit(self.forward_map)

        ok(f"{len(self.deleted)} original files deleted")
        ok(f"{len(self.removed_dirs)} empty directories removed")

    # ── Dry-Run Preview ────────────────────────────────────────────────────

    def _print_dry_run_preview(self, plan: Dict) -> None:
        section("Dry run preview")

        print(f"\nMOVE ({len(self.forward_map)} files):")
        for old, new in sorted(self.forward_map.items()):
            print(f"  {rel(old, self.repo_root)}")
            print(f"    -> {rel(new, self.repo_root)}")

        print(f"\nREWRITE ({len(plan)} files, {self.coverage.updated} imports):")
        for file_path, (_, count) in sorted(plan.items()):
            print(f"  {rel(file_path, self.repo_root)}  ({count} import{'s' if count != 1 else ''})")

        if self.coverage.unknown:
            print(f"\nUNKNOWN SYNTAX ({len(self.coverage.unknown)} occurrence(s)):")
            for u in self.coverage.unknown[:10]:
                print(f"  {u}")
            if len(self.coverage.unknown) > 10:
                print(f"  ... and {len(self.coverage.unknown) - 10} more")

        if self.warnings:
            print(f"\nWARNINGS ({len(self.warnings)}):")
            for w in self.warnings:
                print(f"  {w}")

    # ── Summary ────────────────────────────────────────────────────────────

    def _print_summary(
        self, duration: float, deleted_count: int, plan: Dict
    ) -> None:
        total_rewrites  = self.coverage.updated
        files_rewritten = len(self.rewritten) if self.rewritten else len(plan)
        dirs_removed    = len(self.removed_dirs)

        verification_label = (
            "PASSED" if (self.verification and self.verification.passed)
            else "FAILED" if self.verification
            else "not run"
        )

        print(f"\n{'=' * 58}")
        print("  Migration Summary")
        print(f"{'=' * 58}")
        print(f"  Mode                 {('Dry Run' if self.dry_run else 'Execute')}")
        print(f"  {'─' * 50}")
        print(f"  Files moved          {len(self.moved_files) or len(self.forward_map)}")
        print(f"  Imports rewritten    {total_rewrites}")
        print(f"  Files rewritten      {files_rewritten}")
        print(f"  Directories removed  {dirs_removed}")
        print(f"  {'─' * 50}")
        print("  Import Coverage")
        print(f"    Scanned            {self.coverage.scanned}")
        print(f"    Updated            {self.coverage.updated}")
        print(f"    Skipped            {self.coverage.skipped}")
        print(f"    Unknown syntax     {self.coverage.unknown_count}")
        print(f"  {'─' * 50}")
        print(f"  Verification         {verification_label}")
        print(f"  Warnings             {len(self.warnings)}")
        print(f"  Errors               {len(self.errors)}")
        print(f"  {'─' * 50}")
        print(f"  Duration             {duration:.2f}s")
        print(f"{'=' * 58}\n")

    # ── Report Writers ─────────────────────────────────────────────────────

    def _write_report(self, duration: float, plan: Dict) -> None:
        """Write migration_summary.md — human-readable."""
        timestamp      = datetime.now().strftime("%Y%m%d_%H%M%S")
        mode_label     = "dry_run" if self.dry_run else "executed"
        report_path    = TOOL_DIR / f"migration_summary_{mode_label}_{timestamp}.md"

        total_rewrites  = self.coverage.updated
        files_rewritten = len(self.rewritten) if self.rewritten else len(plan)
        v_label         = (
            "PASSED" if (self.verification and self.verification.passed)
            else "FAILED" if self.verification
            else "not run"
        )

        lines = [
            "# LDE Migration Summary",
            "",
            f"**Mode:** {'Dry Run' if self.dry_run else 'Executed'}  ",
            f"**Date:** {datetime.now().isoformat()}  ",
            f"**Tool:** v{TOOL_VERSION}  ",
            f"**Python:** {sys.version.split()[0]}  ",
            f"**Repository:** `{self.repo_root}`  ",
            "",
            "---",
            "",
            "## Results",
            "",
            "| Metric | Value |",
            "|---|---|",
            f"| Files moved | {len(self.moved_files) or len(self.forward_map)} |",
            f"| Imports rewritten | {total_rewrites} |",
            f"| Files rewritten | {files_rewritten} |",
            f"| Directories removed | {len(self.removed_dirs)} |",
            f"| Verification | **{v_label}** |",
            f"| Warnings | {len(self.warnings)} |",
            f"| Errors | {len(self.errors)} |",
            f"| Duration | {duration:.2f}s |",
            "",
            "## Import Coverage",
            "",
            "| | Count |",
            "|---|---|",
            f"| Scanned | {self.coverage.scanned} |",
            f"| Updated | {self.coverage.updated} |",
            f"| Skipped | {self.coverage.skipped} |",
            f"| Unknown syntax | {self.coverage.unknown_count} |",
            "",
        ]

        if self.coverage.unknown:
            lines += ["## Unknown Import Syntax", ""]
            for u in self.coverage.unknown:
                lines.append(f"- `{u}`")
            lines.append("")

        if self.verification:
            lines += ["## Verification Checks", ""]
            for check in self.verification.checks:
                status = "PASS" if check.passed else "FAIL"
                lines.append(f"### {check.name} — {status}")
                lines.append(f"Checked: {check.checked}")
                if check.failures:
                    for f in check.failures[:20]:
                        lines.append(f"- `{f}`")
                    if len(check.failures) > 20:
                        lines.append(f"- ... and {len(check.failures) - 20} more")
                lines.append("")

        if self.warnings:
            lines += ["## Warnings", ""]
            for w in self.warnings:
                lines.append(f"- {w}")
            lines.append("")

        if self.errors:
            lines += ["## Errors", ""]
            for e in self.errors:
                lines.append(f"- {e}")
            lines.append("")

        if self.moved_files:
            lines += ["## Files Moved", ""]
            for old, new in self.moved_files:
                lines.append(f"- `{rel(old, self.repo_root)}` -> `{rel(new, self.repo_root)}`")
            lines.append("")

        if self.rewritten:
            lines += ["## Files Rewritten", ""]
            for f, count in self.rewritten:
                lines.append(f"- `{rel(f, self.repo_root)}` ({count} import{'s' if count != 1 else ''})")
            lines.append("")

        if self.deleted:
            lines += ["## Files Deleted", ""]
            for d in self.deleted:
                lines.append(f"- `{rel(d, self.repo_root)}`")
            lines.append("")

        report_path.write_text("\n".join(lines), encoding="utf-8")
        info(f"Summary written: {report_path.name}")

    def _write_manifest(self, duration: float) -> None:
        """Write migration_report.json — machine-readable audit trail."""
        timestamp   = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = TOOL_DIR / f"migration_report_{timestamp}.json"

        manifest = {
            "tool_version":     TOOL_VERSION,
            "python_version":   sys.version.split()[0],
            "timestamp":        datetime.now().isoformat(),
            "repository_root":  to_posix(self.repo_root),
            "map_file":         to_posix(MAP_FILE),
            "mode":             "dry_run" if self.dry_run else "execute",
            "duration_seconds": round(duration, 3),
            "moved_files": [
                {"from": rel(old, self.repo_root), "to": rel(new, self.repo_root)}
                for old, new in self.moved_files
            ],
            "rewritten_files": [
                {"file": rel(f, self.repo_root), "changes": count}
                for f, count in self.rewritten
            ],
            "deleted_files": [rel(d, self.repo_root) for d in self.deleted],
            "removed_dirs":  [rel(d, self.repo_root) for d in self.removed_dirs],
            "warnings":      self.warnings,
            "errors":        self.errors,
            "import_coverage": self.coverage.to_dict(),
            "verification": self.verification.to_dict() if self.verification else {},
            "idempotency_state": "completed" if not self.errors else "partial",
        }

        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

        info(f"Manifest written: {report_path.name}")


# ── Entry Point ────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description=f"LDE Repository Migration Tool v{TOOL_VERSION}",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python migrate.py --dry-run       Preview all moves and rewrites.
  python migrate.py --execute       Perform the migration.
  python migrate.py --verify        Verify the current repository state.
        """,
    )

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true",
                       help="Preview all changes without modifying anything.")
    group.add_argument("--execute", action="store_true",
                       help="Perform the migration.")
    group.add_argument("--verify",  action="store_true",
                       help="Run verification on the current repository state.")
    parser.add_argument("--repo-root", type=Path, default=None,
                        help="Override repository root (default: auto-detected).")

    args      = parser.parse_args()
    repo_root = args.repo_root.resolve() if args.repo_root else REPO_ROOT

    if not repo_root.exists():
        print(f"Repository root not found: {repo_root}", file=sys.stderr)
        sys.exit(1)

    if args.verify:
        runner = MigrationRunner(repo_root, dry_run=True)
        runner.run_verify_only()
    else:
        runner = MigrationRunner(repo_root, dry_run=args.dry_run)
        runner.run()


if __name__ == "__main__":
    main()
