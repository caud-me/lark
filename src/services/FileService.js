import { EventBus } from '../kernel/SystemEventBus.js';

/**
 * FileService
 *
 * Responsibility:
 * Exposes a public filesystem API for file operations.
 *
 * Does NOT:
 * - Manage underlying storage drivers
 */
export class FileService {
    constructor(lrfs, registry) {
        this.lrfs = lrfs;
        this.registry = registry;
    }

    _getSessionUsername() {
        if (!this.registry) return 'system';
        const sessionService = this.registry.get('SessionService');
        const session = sessionService ? sessionService.getCurrentSession() : null;
        return session ? session.user.username : 'system';
    }

    _getMetadata(ownerOverride = null) {
        const currentUser = this._getSessionUsername();
        const owner = (ownerOverride && currentUser === 'system') ? ownerOverride : currentUser;
        return {
            owner,
            permissions: { read: true, write: true }
        };
    }

    _getParentPath(path) {
        if (path === '/') return null;
        const parts = path.split('/');
        parts.pop();
        return parts.join('/') || '/';
    }

    _checkWritePermission(path) {
        const username = this._getSessionUsername();
        if (username === 'system') return; // System has root access

        // Check target itself if it exists
        if (this.lrfs.exists(path)) {
            const meta = this.lrfs.getMetadata(path);
            if (meta && meta.owner !== username) {
                EventBus.emit('permission.denied', { severity: 'Warning', source: 'FileService', message: `Write denied to ${path} for user ${username}` });
                throw new Error(`Permission denied: You do not own ${path}`);
            }
        }

        // Check parent directory
        const parentPath = this._getParentPath(path);
        if (parentPath && this.lrfs.exists(parentPath)) {
            const parentMeta = this.lrfs.getMetadata(parentPath);
            if (parentMeta && parentMeta.owner !== username) {
                EventBus.emit('permission.denied', { severity: 'Warning', source: 'FileService', message: `Write denied to parent ${parentPath} for user ${username}` });
                throw new Error(`Permission denied: You do not have write access to ${parentPath}`);
            }
        }
    }

    /**
     * Reads a file.
     * @param {string} path 
     * @returns {string|null}
     */
    readFile(path) {
        // Read is currently open to all
        EventBus.emit('fileService:read', { severity: 'Info', source: 'FileService', message: `Read file: ${path}` });
        return this.lrfs.readFile(path);
    }

    /**
     * Gets total disk usage in bytes.
     * @returns {number}
     */
    getUsage() {
        return this.lrfs.getUsage();
    }

    /**
     * Gets total disk capacity in bytes.
     * @returns {number}
     */
    getCapacity() {
        return this.lrfs.getCapacity();
    }

    /**
     * Writes a file.
     * @param {string} path 
     * @param {string} content 
     */
    writeFile(path, content) {
        this._checkWritePermission(path);
        EventBus.emit('fileService:write', { severity: 'Info', source: 'FileService', message: `Wrote file: ${path}` });
        this.lrfs.writeFile(path, content, this._getMetadata());
    }

    /**
     * Checks if a path exists.
     * @param {string} path 
     * @returns {boolean}
     */
    exists(path) {
        return this.lrfs.exists(path);
    }

    /**
     * Gets the type of a path ('file', 'directory', or null).
     * @param {string} path 
     * @returns {string|null}
     */
    getType(path) {
        return this.lrfs.getType(path);
    }

    /**
     * Creates a directory.
     * @param {string} path 
     * @param {object} options 
     */
    createDirectory(path, options = {}) {
        this._checkWritePermission(path);
        EventBus.emit('fileService:createDir', { severity: 'Info', source: 'FileService', message: `Requested creation of directory: ${path}` });
        this.lrfs.createDirectory(path, this._getMetadata(options.ownerOverride));
    }

    /**
     * Creates a file (defaults to empty).
     * @param {string} path 
     * @param {string} content 
     */
    createFile(path, content = '') {
        this._checkWritePermission(path);
        EventBus.emit('fileService:createFile', { severity: 'Info', source: 'FileService', message: `Requested creation of file: ${path}` });
        this.lrfs.writeFile(path, content, this._getMetadata());
    }

    /**
     * Lists contents of a directory.
     * @param {string} path 
     * @returns {Array} List of children metadata
     */
    listDirectory(path) {
        return this.lrfs.listDirectory(path);
    }

    /**
     * Deletes a file or empty directory.
     * @param {string} path 
     */
    delete(path) {
        this._checkWritePermission(path);
        EventBus.emit('fileService:delete', { severity: 'Info', source: 'FileService', message: `Requested deletion of: ${path}` });
        this.lrfs.delete(path);
    }

    /**
     * Renames a file or empty directory.
     * @param {string} path 
     * @param {string} newName 
     */
    rename(path, newName) {
        this._checkWritePermission(path);
        
        // Also check permission for the destination path
        const parentPath = this._getParentPath(path);
        const newPath = (parentPath === '/' ? '/' : parentPath + '/') + newName;
        this._checkWritePermission(newPath);

        EventBus.emit('fileService:rename', { severity: 'Info', source: 'FileService', message: `Requested rename of ${path} to ${newName}` });
        this.lrfs.rename(path, newName);
    }

    /**
     * Repairs metadata for an existing path.
     * Narrowly scoped to the system session for provisioning/repair.
     * @param {string} path 
     * @param {object} options 
     */
    repairMetadata(path, options = {}) {
        const username = this._getSessionUsername();
        if (username !== 'system') {
            throw new Error('Permission denied: Only system can repair metadata');
        }
        if (options.ownerOverride && this.lrfs.exists(path)) {
            if (typeof this.lrfs.updateMetadata === 'function') {
                this.lrfs.updateMetadata(path, { owner: options.ownerOverride });
                EventBus.emit('fileService:repair', { severity: 'Info', source: 'FileService', message: `Repaired metadata ownership for: ${path}` });
            }
        }
    }
}
