#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
path_helper.py - Dynamic Source Directory Resolver
Provides path-agnostic resolution of the primary source root (src, lark, core, etc.)
"""

from pathlib import Path

def get_source_dir(root_path):
    # Canonical source folder is lark/
    for sub in root_path.iterdir():
        if sub.is_dir() and not sub.name.startswith('.'):
            if (sub / "0-firmware").exists():
                return sub
    return root_path / "lark"
