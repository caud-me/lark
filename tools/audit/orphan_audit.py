#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
orphan_audit.py - Lark OS Architectural Component Ownership & Orphan Auditor
Release 27.8.14 - Architectural Ownership & Cleanup Auditor

Detects architectural components that have lost ownership across Lark OS:
1. Orphaned Platform Environment Files (files in src/5-platform/environments/platform/ not registered in PlatformEnvironmentRegistry.js or imported anywhere)
2. Orphaned Application Files (apps in src/6-apps/ not referenced in AppRegistry.js, official.json, or imported anywhere)
3. Orphaned Policy Classes (*Policy.js in src/4-policies/ with zero import/usage across src/)
"""

import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC_DIR = os.path.join(PROJECT_ROOT, "src")

def get_all_src_files():
    src_files = []
    for root, _, files in os.walk(SRC_DIR):
        for f in files:
            if f.endswith(".js"):
                src_files.append(os.path.join(root, f))
    return src_files

def read_file_content(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception:
        return ""

def audit_orphaned_environments():
    violations = []
    env_dir = os.path.join(SRC_DIR, "5-platform", "environments", "platform")
    registry_file = os.path.join(env_dir, "PlatformEnvironmentRegistry.js")
    registry_content = read_file_content(registry_file)
    all_src = get_all_src_files()

    if not os.path.exists(env_dir):
        return violations

    for root, dirs, files in os.walk(env_dir):
        for f in files:
            if not f.endswith(".js") or f in ["PlatformEnvironmentRegistry.js", "BasePlatformEnvironment.js"]:
                continue
            
            file_path = os.path.join(root, f)
            rel_path = os.path.relpath(file_path, SRC_DIR).replace("\\", "/")
            basename = os.path.splitext(f)[0]

            is_in_registry = f in registry_content or basename in registry_content
            usage_count = 0
            for sf in all_src:
                if os.path.abspath(sf) == os.path.abspath(file_path):
                    continue
                content = read_file_content(sf)
                if f in content or basename in content:
                    usage_count += 1

            if not is_in_registry and usage_count == 0:
                violations.append({
                    "category": "ORPHANED_ENVIRONMENT_FILE",
                    "file": rel_path,
                    "reason": f"Platform environment/step file '{f}' is neither registered in PlatformEnvironmentRegistry.js nor imported anywhere in src/"
                })
    return violations

def audit_orphaned_apps():
    violations = []
    apps_dir = os.path.join(SRC_DIR, "6-apps")
    app_registry_file = os.path.join(SRC_DIR, "1-kernel", "AppRegistry.js")
    official_json = os.path.join(SRC_DIR, "5-platform", "packages", "repositories", "official.json")
    
    app_reg_content = read_file_content(app_registry_file)
    official_content = read_file_content(official_json)
    all_src = get_all_src_files()

    for root, _, files in os.walk(apps_dir):
        for f in files:
            if not f.endswith(".js"):
                continue
            file_path = os.path.join(root, f)
            rel_path = os.path.relpath(file_path, SRC_DIR).replace("\\", "/")
            basename = os.path.splitext(f)[0]

            is_in_registry = f in app_reg_content or basename in app_reg_content or f in official_content or basename in official_content
            usage_count = 0
            for sf in all_src:
                if os.path.abspath(sf) == os.path.abspath(file_path):
                    continue
                content = read_file_content(sf)
                if f in content or basename in content:
                    usage_count += 1

            if not is_in_registry and usage_count == 0:
                violations.append({
                    "category": "UNREGISTERED_APPLICATION",
                    "file": rel_path,
                    "reason": f"Application file '{f}' is neither registered in AppRegistry.js / official.json nor imported anywhere in src/"
                })
    return violations

def audit_temporary_feature_isolation():
    violations = []
    app_registry_file = os.path.join(SRC_DIR, "1-kernel", "AppRegistry.js")
    app_reg_content = read_file_content(app_registry_file)
    all_src = get_all_src_files()

    # Find apps with temporary: true in AppRegistry.js
    import re
    temp_app_matches = re.findall(r"""entryPoint:\s*['"]([^'"]+)['"][^}]*temporary:\s*true""", app_reg_content, re.DOTALL)
    if not temp_app_matches:
        # Check alternative format
        temp_app_matches = re.findall(r"""temporary:\s*true[^}]*entryPoint:\s*['"]([^'"]+)['"]""", app_reg_content, re.DOTALL)

    for entry_point in temp_app_matches:
        file_path = os.path.join(PROJECT_ROOT, entry_point)
        rel_path = entry_point.replace("\\", "/")
        basename = os.path.splitext(os.path.basename(entry_point))[0]

        # Verify zero inbound imports across src/ except AppRegistry.js
        for sf in all_src:
            if os.path.abspath(sf) == os.path.abspath(app_registry_file) or os.path.abspath(sf) == os.path.abspath(file_path):
                continue
            content = read_file_content(sf)
            if basename in content or os.path.basename(entry_point) in content:
                sf_rel = os.path.relpath(sf, SRC_DIR).replace("\\", "/")
                violations.append({
                    "category": "TEMPORARY_FEATURE_GRAVITY",
                    "file": rel_path,
                    "reason": f"Temporary feature '{basename}' accumulated architectural gravity! Imported by production file '{sf_rel}' (Violates Constitution Sec. 21.1)"
                })
    return violations

def audit_orphaned_policies():
    violations = []
    policies_dir = os.path.join(SRC_DIR, "4-policies")
    if not os.path.exists(policies_dir):
        return violations

    all_src = get_all_src_files()

    for root, _, files in os.walk(policies_dir):
        for f in files:
            if not f.endswith(".js"):
                continue
            file_path = os.path.join(root, f)
            rel_path = os.path.relpath(file_path, SRC_DIR).replace("\\", "/")
            policy_name = os.path.splitext(f)[0]

            usages = 0
            for sf in all_src:
                if os.path.abspath(sf) == os.path.abspath(file_path):
                    continue
                content = read_file_content(sf)
                if policy_name in content:
                    usages += 1

            if usages == 0:
                violations.append({
                    "category": "ORPHANED_POLICY",
                    "file": rel_path,
                    "reason": f"Policy '{policy_name}' has zero consumers or imports across src/"
                })
    return violations

def run_orphan_audit():
    print("=" * 64)
    print("  Constitution Section 18 — Architectural Ownership Law")
    print("  Audit: Architectural Component Ownership & Orphan Auditor")
    print("=" * 64)

    all_violations = []
    all_violations.extend(audit_orphaned_environments())
    all_violations.extend(audit_orphaned_apps())
    all_violations.extend(audit_orphaned_policies())
    all_violations.extend(audit_temporary_feature_isolation())

    if not all_violations:
        print("\n  [PASS] Zero orphaned architectural components detected across src/.")
        print("=" * 64)
        return True
    else:
        print(f"\nDiscovered {len(all_violations)} orphaned component violations:\n")
        for idx, v in enumerate(all_violations, 1):
            print(f"[{idx}] [{v['category']}] {v['file']}")
            print(f"    Reason:  {v['reason']}\n")

        print("=" * 64)
        print(f"  AUDIT SUMMARY:  TOTAL VIOLATIONS: {len(all_violations)}")
        print("=" * 64)
        return False

if __name__ == "__main__":
    run_orphan_audit()
