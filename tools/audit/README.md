# Lark OS Developer Audit Toolkit CLI (`tools/audit/`)

Release **27.8.13** introduces a unified developer quality-of-life CLI (`audit.py`) for architectural verification, asset integrity checks, public API snapshotting, dependency graph visualization, and architectural index searching.

---

## Developer Workflow

Whenever implementing new features, refactoring architecture, or preparing releases:

```text
Implement feature / change

        ↓

python tools/audit/audit.py all

        ↓

Fix any reported issues

        ↓

Perform manual architectural review

        ↓

Commit
```

---

## Unified CLI Subcommands (`audit.py`)

### 1. Execute Complete Audit Suite (`all`)
Runs high-level architecture checks, layer dependency scanning, ServiceRegistry verification, and asset path validation in a single pass:
```bash
python tools/audit/audit.py all
```

### 2. High-Level Architecture Audit (`architecture`)
Validates numbered layer directories (`0-firmware` to `9-ui`), kernel boot folders, documentation, and system files:
```bash
python tools/audit/audit.py architecture
```

### 3. Layer Dependency Scanner (`dependencies`)
Scans ES module imports for layer boundary violations (upward layer imports, direct firmware bypasses, or kernel bypasses):
```bash
python tools/audit/audit.py dependencies
```

### 4. ServiceRegistry Inspector (`services`)
Checks `ServiceRegistry.register()` calls across `1-kernel/boot/` to prevent duplicate service keys:
```bash
python tools/audit/audit.py services
```

### 5. Architectural Index Search (`search <query>`)
Instantly searches the codebase manifest to answer layer, file path, dependencies, and public methods for any class/service:
```bash
python tools/audit/audit.py search WindowService
```

### 6. Architecture Manifest Generator (`manifest`)
Generates a complete JSON index of all classes, methods, and imports under `tools/audit/output/architecture_manifest.json`:
```bash
python tools/audit/audit.py manifest
```

### 7. Asset Integrity & Path Validator (`assets`)
Scans file paths in `sw.js`, `platform.css`, `index.html`, `official.json`, and `AppRegistry.js` to catch 404s before runtime:
```bash
python tools/audit/audit.py assets
```

### 8. Public API Contract Snapshotter (`api`)
Snapshots public service method interfaces into `tools/audit/output/api_snapshot.json` and compares against baseline to catch accidental contract breaks:
```bash
python tools/audit/audit.py api
```

### 9. Dependency Graph Visualizer (`graph`)
Generates Mermaid (`dependency_graph.mmd`) and Graphviz (`dependency_graph.dot`) visualizations under `tools/audit/output/`:
```bash
python tools/audit/audit.py graph
```

---

## Generated Artifacts Output Directory (`tools/audit/output/`)

All generated artifacts live in `tools/audit/output/`:
- `architecture_manifest.json`
- `api_snapshot.json`
- `dependency_graph.mmd`
- `dependency_graph.dot`

*Note: Generated artifacts in `output/` are developer tools and are never committed as canonical system documentation.*
