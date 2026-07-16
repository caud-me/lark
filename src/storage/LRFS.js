import { EventBus } from '../kernel/SystemEventBus.js';

/**
 * LRFS (Lark Reliable File System)
 *
 * Responsibility:
 * Implements a hierarchical filesystem on top of a block storage driver.
 *
 * Does NOT:
 * - Interact directly with the browser APIs
 */
export class LRFS {
    constructor(driver) {
        this.driver = driver;
        this.MAX_CAPACITY = 5 * 1024 * 1024; // 5 MB
        this.fsMap = {}; // In-memory map of file metadata
    }

    async mount() {
        EventBus.emit('lrfs:mount', { severity: 'Info', source: 'LRFS', message: 'Mounting file system...' });
        const mapData = this.driver.read('fs_map');
        if (mapData) {
            this.fsMap = JSON.parse(mapData);
        } else {
            this.fsMap = {
                '/': { type: 'directory', children: [] }
            };
            this._saveMap();
        }
    }

    _saveMap() {
        this.driver.write('fs_map', JSON.stringify(this.fsMap));
    }

    getUsage() {
        let total = 0;
        const keys = this.driver.keys();
        for (const key of keys) {
            if (key !== 'fs_map') {
                const data = this.driver.read(key);
                if (data) total += new Blob([data]).size;
            }
        }
        return total;
    }

    getCapacity() {
        return this.MAX_CAPACITY;
    }

    getDiskMetadata() {
        if (typeof this.driver.getMetadata === 'function') {
            return this.driver.getMetadata();
        }
        return {};
    }

    setDiskMetadata(metadata) {
        if (typeof this.driver.setMetadata === 'function') {
            this.driver.setMetadata(metadata);
        }
    }

    getDiskVersion() {
        if (typeof this.driver.getVersion === 'function') {
            return this.driver.getVersion();
        }
        return 0;
    }

    getMetadata(path) {
        const node = this.fsMap[path];
        if (!node) return null;
        return {
            type: node.type,
            size: node.size || 0,
            owner: node.owner || 'system',
            permissions: node.permissions || { read: true, write: true }
        };
    }

    updateMetadata(path, metadata) {
        if (!this.fsMap[path]) throw new Error(`[LRFS] Path not found: ${path}`);
        this.fsMap[path] = { ...this.fsMap[path], ...metadata };
        this._saveMap();
    }

    writeFile(path, contents, metadata = {}) {
        const newSize = new Blob([contents]).size;
        let oldSize = 0;
        if (this.driver.read('file_' + path) !== null) {
            oldSize = new Blob([this.driver.read('file_' + path)]).size;
        }

        if (this.getUsage() - oldSize + newSize > this.MAX_CAPACITY) {
            throw new Error('[LRFS] Disk quota exceeded. 5MB capacity reached.');
        }

        const success = this.driver.write('file_' + path, contents);
        if (success) {
            EventBus.emit('lrfs:writeFile', { severity: 'Info', source: 'LRFS', message: `Wrote file: ${path}` });
            if (!this.fsMap[path]) {
                const parts = path.split('/');
                parts.pop();
                const parentPath = parts.join('/') || '/';
                if (!this.fsMap[parentPath] || this.fsMap[parentPath].type !== 'directory') {
                    throw new Error(`[LRFS] Parent directory does not exist: ${parentPath}`);
                }
                this.fsMap[path] = { type: 'file', size: newSize, ...metadata };
                this.fsMap[parentPath].children.push(path);
            } else {
                this.fsMap[path].size = newSize;
                this.fsMap[path] = { ...this.fsMap[path], ...metadata };
            }
            this._saveMap();
        } else {
            throw new Error('[LRFS] Driver failed to write file.');
        }
    }

    exists(path) {
        return !!this.fsMap[path];
    }

    getType(path) {
        if (!this.fsMap[path]) return null;
        return this.fsMap[path].type;
    }

    isFile(path) {
        return this.getType(path) === 'file';
    }

    isDirectory(path) {
        return this.getType(path) === 'directory';
    }

    copy(sourcePath, destPath) {
        if (sourcePath === '/') throw new Error('[LRFS] Cannot copy root directory.');
        if (!this.fsMap[sourcePath]) throw new Error(`[LRFS] Source path not found: ${sourcePath}`);
        if (this.fsMap[destPath]) throw new Error(`[LRFS] Destination already exists: ${destPath}`);

        const parts = destPath.split('/');
        parts.pop();
        const parentPath = parts.join('/') || '/';
        
        if (!this.fsMap[parentPath] || this.fsMap[parentPath].type !== 'directory') {
            throw new Error(`[LRFS] Destination parent directory does not exist: ${parentPath}`);
        }

        const node = this.fsMap[sourcePath];
        if (node.type === 'file') {
            const data = this.driver.read('file_' + sourcePath);
            const metadata = { owner: node.owner, permissions: node.permissions };
            this.writeFile(destPath, data, metadata);
        } else if (node.type === 'directory') {
            const metadata = { owner: node.owner, permissions: node.permissions };
            this.createDirectory(destPath, metadata);
            // Recursively copy children
            for (const childPath of node.children) {
                const childName = childPath.split('/').pop();
                const childDestPath = (destPath === '/' ? '/' : destPath + '/') + childName;
                this.copy(childPath, childDestPath);
            }
        }
        EventBus.emit('lrfs:copy', { severity: 'Info', source: 'LRFS', message: `Copied ${sourcePath} to ${destPath}` });
    }

    createDirectory(path, metadata = {}) {
        if (this.fsMap[path]) throw new Error(`[LRFS] Path already exists: ${path}`);
        const parts = path.split('/');
        parts.pop();
        const parentPath = parts.join('/') || '/';
        if (!this.fsMap[parentPath] || this.fsMap[parentPath].type !== 'directory') {
            throw new Error(`[LRFS] Parent directory does not exist: ${parentPath}`);
        }
        this.fsMap[path] = { type: 'directory', children: [], ...metadata };
        this.fsMap[parentPath].children.push(path);
        this._saveMap();
        EventBus.emit('lrfs:createDir', { severity: 'Info', source: 'LRFS', message: `Created directory: ${path}` });
    }

    readFile(path) {
        if (!this.fsMap[path] || this.fsMap[path].type !== 'file') return null;
        return this.driver.read('file_' + path);
    }

    listDirectory(path) {
        if (!this.fsMap[path] || this.fsMap[path].type !== 'directory') {
            throw new Error(`[LRFS] Path is not a directory: ${path}`);
        }
        return this.fsMap[path].children.map(childPath => {
            const parts = childPath.split('/');
            const name = parts.pop();
            return {
                name,
                path: childPath,
                type: this.fsMap[childPath].type,
                size: this.fsMap[childPath].size || 0
            };
        });
    }

    delete(path, options = {}) {
        if (path === '/') throw new Error('[LRFS] Cannot delete root directory.');
        if (!this.fsMap[path]) throw new Error(`[LRFS] Path not found: ${path}`);
        
        const node = this.fsMap[path];
        if (node.type === 'directory' && node.children.length > 0) {
            if (!options.recursive) {
                throw new Error(`[LRFS] Cannot delete non-empty directory: ${path}`);
            }
            // Delete a copy of the array since deleting a child modifies the parent's children array
            for (const childPath of [...node.children]) {
                this.delete(childPath, options);
            }
        }
        
        const parts = path.split('/');
        parts.pop();
        const parentPath = parts.join('/') || '/';
        
        if (this.fsMap[parentPath]) {
            this.fsMap[parentPath].children = this.fsMap[parentPath].children.filter(p => p !== path);
        }
        
        delete this.fsMap[path];
        if (node.type === 'file') this.driver.remove('file_' + path);
        
        this._saveMap();
        EventBus.emit('lrfs:delete', { severity: 'Info', source: 'LRFS', message: `Deleted path: ${path}` });
    }

    rename(path, newName) {
        if (path === '/') throw new Error('[LRFS] Cannot rename root directory.');
        if (!this.fsMap[path]) throw new Error(`[LRFS] Path not found: ${path}`);
        if (newName.includes('/')) throw new Error('[LRFS] newName cannot contain slashes.');
        
        const node = this.fsMap[path];
        if (node.type === 'directory' && node.children.length > 0) {
            throw new Error(`[LRFS] Cannot rename non-empty directory: ${path}`);
        }
        
        const parts = path.split('/');
        parts.pop();
        const parentPath = parts.join('/') || '/';
        const newPath = (parentPath === '/' ? '/' : parentPath + '/') + newName;
        
        if (this.fsMap[newPath]) throw new Error(`[LRFS] Destination already exists: ${newPath}`);
        
        this.fsMap[parentPath].children = this.fsMap[parentPath].children.filter(p => p !== path);
        this.fsMap[parentPath].children.push(newPath);
        
        this.fsMap[newPath] = { ...node, children: node.children ? [...node.children] : [] };
        delete this.fsMap[path];
        
        if (node.type === 'file') {
            const data = this.driver.read('file_' + path);
            this.driver.write('file_' + newPath, data);
            this.driver.remove('file_' + path);
        }
        
        this._saveMap();
        EventBus.emit('lrfs:rename', { severity: 'Info', source: 'LRFS', message: `Renamed ${path} to ${newName}` });
    }
}
