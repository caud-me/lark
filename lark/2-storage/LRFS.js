import { EventBus } from '../1-kernel/SystemEventBus.js';

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
        }
    }

    _saveMap() {
        this.driver.write('fs_map', JSON.stringify(this.fsMap));
    }

    getUsage() {
        let total = 0;
        const keys = this.driver.keys();
        for (const key of keys) {
            const data = this.driver.read(key);
            if (data) {
                total += typeof data === 'string' ? new Blob([data]).size : new Blob([JSON.stringify(data)]).size;
            }
        }
        return total;
    }

    async getCapabilities() {
        let driverCaps = {};
        if (this.driver && typeof this.driver.getCapabilities === 'function') {
            try {
                driverCaps = await this.driver.getCapabilities();
            } catch (e) {
                driverCaps = {};
            }
        }
        const cap = (driverCaps && typeof driverCaps.capacityBytes === 'number' && driverCaps.capacityBytes > 0)
            ? driverCaps.capacityBytes
            : this.getCapacity();

        const usage = (driverCaps && typeof driverCaps.usageBytes === 'number')
            ? driverCaps.usageBytes
            : this.getUsage();

        return {
            type: driverCaps.type || (this.driver ? (this.driver.type || 'Storage') : 'Storage'),
            label: driverCaps.label || this.getDriverLabel() || 'Virtual Storage Volume',
            name: driverCaps.name || this.getDiskName() || 'Lark System Disk',
            usageBytes: usage,
            capacityBytes: cap,
            persisted: driverCaps.persisted !== undefined ? driverCaps.persisted : null
        };
    }

    getCapacity() {
        const meta = this.getDiskMetadata();
        if (meta && typeof meta.capacity === 'number' && meta.capacity > 0) {
            return meta.capacity;
        }
        if (this.driver && typeof this.driver.getCapacity === 'function') {
            try {
                const cap = this.driver.getCapacity();
                if (typeof cap === 'number' && cap > 0) return cap;
            } catch (e) {
                console.warn('[LRFS] Driver getCapacity call failed:', e.message);
            }
        }
        return null;
    }

    getDiskName() {
        if (this.driver && typeof this.driver.getName === 'function') {
            const name = this.driver.getName();
            if (name) return name;
        }
        const meta = this.getDiskMetadata();
        if (meta && meta.name) {
            return meta.name;
        }
        return null;
    }

    getDriverLabel() {
        if (this.driver && typeof this.driver.getLabel === 'function') {
            const label = this.driver.getLabel();
            if (label) return label;
        }
        if (this.driver && this.driver.type) {
            return this.driver.type;
        }
        return null;
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

    _normalizePath(path) {
        if (typeof path !== 'string') return '/';
        const parts = path.split('/');
        const stack = [];
        for (const part of parts) {
            if (part === '' || part === '.') {
                continue;
            }
            if (part === '..') {
                if (stack.length > 0) {
                    stack.pop();
                }
            } else {
                stack.push(part);
            }
        }
        return '/' + stack.join('/');
    }

    getMetadata(path) {
        const normPath = this._normalizePath(path);
        const node = this.fsMap[normPath];
        if (!node) return null;
        return {
            type: node.type,
            size: node.size || 0,
            owner: node.owner || 'system',
            permissions: node.permissions || { read: true, write: true }
        };
    }

    updateMetadata(path, metadata) {
        const normPath = this._normalizePath(path);
        if (!this.fsMap[normPath]) throw new Error(`[LRFS] Path not found: ${normPath}`);
        this.fsMap[normPath] = { ...this.fsMap[normPath], ...metadata };
        this._saveMap();
    }

    writeFile(path, contents, metadata = {}) {
        const normPath = this._normalizePath(path);
        const newSize = new Blob([contents]).size;
        let oldSize = 0;
        if (this.driver.read('file_' + normPath) !== null) {
            oldSize = new Blob([this.driver.read('file_' + normPath)]).size;
        }

        const capacity = this.getCapacity();
        if (typeof capacity === 'number' && capacity > 0) {
            if (this.getUsage() - oldSize + newSize > capacity) {
                throw new Error(`[LRFS] Disk quota exceeded. Capacity limit reached.`);
            }
        }

        const success = this.driver.write('file_' + normPath, contents);
        if (success) {
            EventBus.emit('lrfs:writeFile', { severity: 'Info', source: 'LRFS', message: `Wrote file: ${normPath}` });
            if (!this.fsMap[normPath]) {
                const parts = normPath.split('/');
                parts.pop();
                const parentPath = parts.join('/') || '/';
                if (!this.fsMap[parentPath] || this.fsMap[parentPath].type !== 'directory') {
                    throw new Error(`[LRFS] Parent directory does not exist: ${parentPath}`);
                }
                this.fsMap[normPath] = { type: 'file', size: newSize, ...metadata };
                this.fsMap[parentPath].children.push(normPath);
            } else {
                this.fsMap[normPath].size = newSize;
                this.fsMap[normPath] = { ...this.fsMap[normPath], ...metadata };
            }
            this._saveMap();
        } else {
            throw new Error('[LRFS] Driver failed to write file.');
        }
    }

    exists(path) {
        return !!this.fsMap[this._normalizePath(path)];
    }

    getType(path) {
        const normPath = this._normalizePath(path);
        if (!this.fsMap[normPath]) return null;
        return this.fsMap[normPath].type;
    }

    isFile(path) {
        return this.getType(path) === 'file';
    }

    isDirectory(path) {
        return this.getType(path) === 'directory';
    }

    copy(sourcePath, destPath) {
        const src = this._normalizePath(sourcePath);
        const dest = this._normalizePath(destPath);
        if (src === '/') throw new Error('[LRFS] Cannot copy root directory.');
        if (!this.fsMap[src]) throw new Error(`[LRFS] Source path not found: ${src}`);
        if (this.fsMap[dest]) throw new Error(`[LRFS] Destination already exists: ${dest}`);

        const parts = dest.split('/');
        parts.pop();
        const parentPath = parts.join('/') || '/';
        
        if (!this.fsMap[parentPath] || this.fsMap[parentPath].type !== 'directory') {
            throw new Error(`[LRFS] Destination parent directory does not exist: ${parentPath}`);
        }

        const node = this.fsMap[src];
        if (node.type === 'file') {
            const data = this.driver.read('file_' + src);
            const metadata = { owner: node.owner, permissions: node.permissions };
            this.writeFile(dest, data, metadata);
        } else if (node.type === 'directory') {
            const metadata = { owner: node.owner, permissions: node.permissions };
            this.createDirectory(dest, metadata);
            // Recursively copy children
            for (const childPath of node.children) {
                const childName = childPath.split('/').pop();
                const childDestPath = (dest === '/' ? '/' : dest + '/') + childName;
                this.copy(childPath, childDestPath);
            }
        }
        EventBus.emit('lrfs:copy', { severity: 'Info', source: 'LRFS', message: `Copied ${src} to ${dest}` });
    }

    createDirectory(path, metadata = {}) {
        const normPath = this._normalizePath(path);
        if (this.fsMap[normPath]) return;
        const parts = normPath.split('/');
        parts.pop();
        const parentPath = parts.join('/') || '/';
        if (!this.fsMap[parentPath] || this.fsMap[parentPath].type !== 'directory') {
            this.createDirectory(parentPath, metadata);
        }
        this.fsMap[normPath] = { type: 'directory', children: [], ...metadata };
        if (this.fsMap[parentPath] && !this.fsMap[parentPath].children.includes(normPath)) {
            this.fsMap[parentPath].children.push(normPath);
        }
        this._saveMap();
        EventBus.emit('lrfs:createDir', { severity: 'Info', source: 'LRFS', message: `Created directory: ${normPath}` });
    }

    readFile(path) {
        const normPath = this._normalizePath(path);
        if (!this.fsMap[normPath] || this.fsMap[normPath].type !== 'file') return null;
        return this.driver.read('file_' + normPath);
    }

    listDirectory(path) {
        const normPath = this._normalizePath(path);
        if (!this.fsMap[normPath] || this.fsMap[normPath].type !== 'directory') {
            throw new Error(`[LRFS] Path is not a directory: ${normPath}`);
        }
        return this.fsMap[normPath].children.map(childPath => {
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
        const normPath = this._normalizePath(path);
        if (normPath === '/') throw new Error('[LRFS] Cannot delete root directory.');
        if (!this.fsMap[normPath]) throw new Error(`[LRFS] Path not found: ${normPath}`);
        
        const node = this.fsMap[normPath];
        if (node.type === 'directory' && node.children.length > 0) {
            if (!options.recursive) {
                throw new Error(`[LRFS] Cannot delete non-empty directory: ${normPath}`);
            }
            // Delete a copy of the array since deleting a child modifies the parent's children array
            for (const childPath of [...node.children]) {
                this.delete(childPath, options);
            }
        }
        
        const parts = normPath.split('/');
        parts.pop();
        const parentPath = parts.join('/') || '/';
        
        if (this.fsMap[parentPath]) {
            this.fsMap[parentPath].children = this.fsMap[parentPath].children.filter(p => p !== normPath);
        }
        
        delete this.fsMap[normPath];
        if (node.type === 'file') this.driver.remove('file_' + normPath);
        
        this._saveMap();
        EventBus.emit('lrfs:delete', { severity: 'Info', source: 'LRFS', message: `Deleted path: ${normPath}` });
    }

    rename(path, newName) {
        const normPath = this._normalizePath(path);
        if (normPath === '/') throw new Error('[LRFS] Cannot rename root directory.');
        if (!this.fsMap[normPath]) throw new Error(`[LRFS] Path not found: ${normPath}`);
        if (newName.includes('/')) throw new Error('[LRFS] newName cannot contain slashes.');
        
        const node = this.fsMap[normPath];
        if (node.type === 'directory' && node.children.length > 0) {
            throw new Error(`[LRFS] Cannot rename non-empty directory: ${normPath}`);
        }
        
        const parts = normPath.split('/');
        parts.pop();
        const parentPath = parts.join('/') || '/';
        const newPath = this._normalizePath((parentPath === '/' ? '/' : parentPath + '/') + newName);
        
        if (this.fsMap[newPath]) throw new Error(`[LRFS] Destination already exists: ${newPath}`);
        
        this.fsMap[parentPath].children = this.fsMap[parentPath].children.filter(p => p !== normPath);
        this.fsMap[parentPath].children.push(newPath);
        
        this.fsMap[newPath] = { ...node, children: node.children ? [...node.children] : [] };
        delete this.fsMap[normPath];
        
        if (node.type === 'file') {
            const data = this.driver.read('file_' + normPath);
            this.driver.write('file_' + newPath, data);
            this.driver.remove('file_' + normPath);
        }
        
        this._saveMap();
        EventBus.emit('lrfs:rename', { severity: 'Info', source: 'LRFS', message: `Renamed ${normPath} to ${newName}` });
    }
}
