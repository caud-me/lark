#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
graph_audit.py - Lark OS Dependency Graph Visualizer
Release 27.8.13 - Developer Audit Toolkit CLI

Generates Mermaid (dependency_graph.mmd) and Graphviz (dependency_graph.dot)
visualizations under tools/audit/output/ representing OS layer architecture.

Usage:
    python tools/audit/graph_audit.py
"""

import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
SRC = ROOT / "src"
OUTPUT_DIR = ROOT / "tools" / "audit" / "output"

IMPORT_RE = re.compile(r"""(?:import|from)\s+['"](\.[\.\w/\-]+\.js)['"]""")

LAYER_ORDER = [
    "0-firmware",
    "1-kernel",
    "2-storage",
    "3-system",
    "4-policies",
    "5-platform",
    "6-apps",
    "7-sdk",
    "8-developer",
    "9-ui"
]

def run_graph_audit():
    print("=" * 64)
    print("  Lark OS Architectural Dependency Graph Visualizer (Release 27.8.13)")
    print("=" * 64)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    mmd_file = OUTPUT_DIR / "dependency_graph.mmd"
    dot_file = OUTPUT_DIR / "dependency_graph.dot"

    layer_edges = set()

    for root, _, files in os.walk(SRC):
        for f in files:
            if not f.endswith(".js"):
                continue

            file_path = Path(root) / f
            try:
                rel = file_path.relative_to(SRC)
                src_layer = rel.parts[0]
            except Exception:
                continue

            if src_layer not in LAYER_ORDER:
                continue

            try:
                content = file_path.read_text(encoding="utf-8")
            except Exception:
                continue

            for match in IMPORT_RE.finditer(content):
                imp_str = match.group(1)
                try:
                    resolved = (file_path.parent / imp_str).resolve()
                    if resolved.is_relative_to(SRC):
                        target_layer = resolved.relative_to(SRC).parts[0]
                        if target_layer in LAYER_ORDER and target_layer != src_layer:
                            layer_edges.add((src_layer, target_layer))
                except Exception:
                    pass

    # Generate Mermaid MMD
    mmd_lines = ["graph TD", "    %% Lark OS Layer Architecture DAG"]
    for l in LAYER_ORDER:
        mmd_lines.append(f"    {l.replace('-', '_')}[\"{l}\"]")

    for src, tgt in sorted(layer_edges):
        s_node = src.replace("-", "_")
        t_node = tgt.replace("-", "_")
        mmd_lines.append(f"    {s_node} --> {t_node}")

    mmd_file.write_text("\n".join(mmd_lines) + "\n", encoding="utf-8")
    print(f"[PASS] Generated Mermaid graph -> {mmd_file.relative_to(ROOT)}")

    # Generate Graphviz DOT
    dot_lines = ["digraph LarkOS {", "    rankdir=TB;", "    node [shape=box, style=filled, color=white, fillcolor=\"#1e1e1e\", fontcolor=white, fontname=\"Consolas\"];"]
    for src, tgt in sorted(layer_edges):
        dot_lines.append(f'    "{src}" -> "{tgt}";')
    dot_lines.append("}")

    dot_file.write_text("\n".join(dot_lines) + "\n", encoding="utf-8")
    print(f"[PASS] Generated Graphviz DOT graph -> {dot_file.relative_to(ROOT)}")
    print("=" * 64)

if __name__ == "__main__":
    run_graph_audit()
