import { EventBus } from '../../kernel/SystemEventBus.js';

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

    _resolveContext(options = {}) {
        if (options.context) return options.context;

        const securityService = this.registry.get('SecurityService');
        if (!securityService) return { identity: 'system', role: 'SYSTEM' }; // Fallback during early boot

        if (options.pid) {
            return securityService.getContext(options.pid);
        }

        return securityService.getSessionContext();
    }

    _getSessionUsername(options = {}) {
        const context = this._resolveContext(options);
        return context ? context.identity : 'system';
    }

    _getMetadata(ownerOverride = null, options = {}) {
        const currentUser = this._getSessionUsername(options);
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

    _checkAccess(path, operation, options = {}) {
        const context = this._resolveContext(options);
        
        const securityPolicy = this.registry.get('SecurityPolicy');
        if (securityPolicy) {
            let metadata = null;
            let parentMetadata = null;
            
            if (this.lrfs.exists(path)) {
                metadata = this.lrfs.getMetadata(path);
            }
            
            const parentPath = this._getParentPath(path);
            if (parentPath && this.lrfs.exists(parentPath)) {
                parentMetadata = this.lrfs.getMetadata(parentPath);
            }

            const result = securityPolicy.canAccessPath(context, path, operation, metadata, parentMetadata);
            
            if (result === 'DENY') {
                EventBus.emit('permission.denied', { severity: 'Warning', source: 'FileService', message: `${operation} denied to ${path} by SecurityPolicy` });
                throw new Error(`Permission denied: Cannot ${operation} ${path}`);
            } else if (result === 'REQUIRES_ELEVATION') {
                EventBus.emit('permission.denied', { severity: 'Warning', source: 'FileService', message: `${operation} to ${path} requires elevation` });
                throw new Error(`Permission denied: Administrator privileges required to ${operation} ${path}`);
            }
        }
    }

    /**
     * Safely checks if a path can be accessed without emitting events or throwing errors.
     * @param {string} path 
     * @param {string} operation ('read'|'write')
     * @param {object} options 
     * @returns {boolean}
     */
    canAccess(path, operation, options = {}) {
        const context = this._resolveContext(options);
        const securityPolicy = this.registry.get('SecurityPolicy');
        if (!securityPolicy) return true;

        let metadata = null;
        let parentMetadata = null;
        
        if (this.lrfs.exists(path)) {
            metadata = this.lrfs.getMetadata(path);
        }
        
        const parentPath = this._getParentPath(path);
        if (parentPath && this.lrfs.exists(parentPath)) {
            parentMetadata = this.lrfs.getMetadata(parentPath);
        }

        const result = securityPolicy.canAccessPath(context, path, operation, metadata, parentMetadata);
        return result === 'ALLOW';
    }

    /**
     * Reads a file.
     * @param {string} path 
     * @returns {string|null}
     */
    readFile(path, options = {}) {
        this._checkAccess(path, 'read', options);
        EventBus.emit('fileService:read', { severity: 'Info', source: 'FileService', message: `Read file: ${path}` });
        return this.lrfs.readFile(path);
    }

    /**
     * Opens a file using the associated application.
     * @param {string} path 
     */
    async open(path, options = {}) {
        this._checkAccess(path, 'read', options);
        if (!this.exists(path)) {
            throw new Error(`Cannot open ${path}: File does not exist.`);
        }

        const associationService = this.registry.get('AssociationService');
        const processService = this.registry.get('ProcessService');

        if (!associationService || !processService) {
            throw new Error(`System services unavailable for opening files.`);
        }

        if (this.isDirectory(path)) {
            EventBus.emit('file.opened', { severity: 'Info', source: 'FileService', message: `Opening directory ${path}`, data: { path } });
            const intentService = this.registry.get('ApplicationIntentService');
            if (intentService) {
                return await intentService.launchWithIntent('sys.filemanager', { action: 'open-file', path }, { args: [path] });
            }
            return await processService.startProcess('sys.filemanager', { args: [path] });
        }

        const appId = associationService.resolveApplication(path);
        
        if (!appId) {
            EventBus.emit('fileService:error', { severity: 'Warning', source: 'FileService', message: `No application associated with ${path}` });
            throw new Error(`No application associated with this file type.`);
        }

        EventBus.emit('file.opened', { severity: 'Info', source: 'FileService', message: `Opening ${path}`, data: { path } });
        
        // ApplicationIntentService handles the actual launching and handoff.
        const intentService = this.registry.get('ApplicationIntentService');
        if (intentService) {
            return await intentService.launchWithIntent(appId, { action: 'open-file', path }, { args: [path] });
        }
        return await processService.startProcess(appId, { args: [path] });
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
    writeFile(path, content, options = {}) {
        this._checkAccess(path, 'write', options);
        EventBus.emit('fileService:write', { severity: 'Info', source: 'FileService', message: `Wrote file: ${path}` });
        this.lrfs.writeFile(path, content, this._getMetadata(null, options));
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
     * Checks if a path is a file.
     * @param {string} path 
     * @returns {boolean}
     */
    isFile(path) {
        return this.lrfs.isFile(path);
    }

    /**
     * Checks if a path is a directory.
     * @param {string} path 
     * @returns {boolean}
     */
    isDirectory(path) {
        return this.lrfs.isDirectory(path);
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
        this._checkAccess(path, 'write', options);
        EventBus.emit('fileService:createDir', { severity: 'Info', source: 'FileService', message: `Requested creation of directory: ${path}` });
        this.lrfs.createDirectory(path, this._getMetadata(options.ownerOverride, options));
    }

    /**
     * Creates a file (defaults to empty).
     * @param {string} path 
     * @param {string} content 
     */
    createFile(path, content = '', options = {}) {
        this._checkAccess(path, 'write', options);
        EventBus.emit('fileService:createFile', { severity: 'Info', source: 'FileService', message: `Requested creation of file: ${path}` });
        this.lrfs.writeFile(path, content, this._getMetadata(null, options));
    }

    /**
     * Lists contents of a directory.
     * @param {string} path 
     * @returns {Array} List of children metadata
     */
    listDirectory(path, options = {}) {
        this._checkAccess(path, 'read', options);
        return this.lrfs.listDirectory(path);
    }

    /**
     * Deletes a file or empty directory.
     * @param {string} path 
     */
    delete(path, options = {}) {
        this._checkAccess(path, 'write', options);
        EventBus.emit('fileService:delete', { severity: 'Info', source: 'FileService', message: `Requested deletion of: ${path}` });
        this.lrfs.delete(path, options);
    }

    /**
     * Renames a file or empty directory within its current parent.
     * @param {string} path 
     * @param {string} newName 
     */
    rename(path, newName, options = {}) {
        this._checkAccess(path, 'write', options);
        
        // Also check permission for the destination path
        const parentPath = this._getParentPath(path);
        const newPath = (parentPath === '/' ? '/' : parentPath + '/') + newName;
        this._checkAccess(newPath, 'write', options);

        EventBus.emit('fileService:rename', { severity: 'Info', source: 'FileService', message: `Requested rename of ${path} to ${newName}` });
        this.lrfs.rename(path, newName);
    }

    /**
     * Copies a file or directory to a destination.
     * @param {string} sourcePath 
     * @param {string} destPath 
     */
    copy(sourcePath, destPath, options = {}) {
        this._checkAccess(sourcePath, 'read', options);
        this._checkAccess(destPath, 'write', options);
        EventBus.emit('fileService:copy', { severity: 'Info', source: 'FileService', message: `Requested copy of ${sourcePath} to ${destPath}` });
        this.lrfs.copy(sourcePath, destPath);
    }

    /**
     * Moves a file or directory. This acts as a rename across directories.
     * Under the hood, we copy and delete if cross-directory, or use rename if same directory.
     * @param {string} sourcePath 
     * @param {string} destPath 
     */
    move(sourcePath, destPath, options = {}) {
        this._checkAccess(sourcePath, 'write', options);
        this._checkAccess(destPath, 'write', options);
        
        EventBus.emit('fileService:move', { severity: 'Info', source: 'FileService', message: `Requested move of ${sourcePath} to ${destPath}` });
        
        const sourceParent = this._getParentPath(sourcePath);
        const destParent = this._getParentPath(destPath);
        const isDirectory = this.isDirectory(sourcePath);
        
        if (sourceParent === destParent && !isDirectory) {
            // Same directory and not a directory, just rename
            const newName = destPath.split('/').pop();
            this.lrfs.rename(sourcePath, newName);
        } else {
            // Different directory or a directory, copy then delete recursively
            this.lrfs.copy(sourcePath, destPath);
            this.lrfs.delete(sourcePath, { recursive: true });
        }
    }

    /**
     * Duplicates a file in its current directory with a " Copy" suffix.
     * @param {string} path 
     */
    duplicate(path, options = {}) {
        if (!this.exists(path)) throw new Error(`Cannot duplicate: ${path} does not exist.`);
        this._checkAccess(path, 'read', options);
        this._checkAccess(path, 'write', options);
        
        const parentPath = this._getParentPath(path);
        const name = path.split('/').pop();
        
        let newName = name;
        if (this.isFile(path)) {
            const extMatch = name.match(/\.[^/.]+$/);
            if (extMatch) {
                const base = name.slice(0, -extMatch[0].length);
                newName = `${base} Copy${extMatch[0]}`;
            } else {
                newName = `${name} Copy`;
            }
        } else {
            newName = `${name} Copy`;
        }
        
        let destPath = (parentPath === '/' ? '/' : parentPath + '/') + newName;
        let counter = 2;
        while (this.exists(destPath)) {
            if (this.isFile(path)) {
                const extMatch = name.match(/\.[^/.]+$/);
                if (extMatch) {
                    const base = name.slice(0, -extMatch[0].length);
                    destPath = (parentPath === '/' ? '/' : parentPath + '/') + `${base} Copy ${counter}${extMatch[0]}`;
                } else {
                    destPath = (parentPath === '/' ? '/' : parentPath + '/') + `${name} Copy ${counter}`;
                }
            } else {
                destPath = (parentPath === '/' ? '/' : parentPath + '/') + `${name} Copy ${counter}`;
            }
            counter++;
        }
        
        this.copy(path, destPath);
    }

    /**
     * Repairs metadata for an existing path.
     * Narrowly scoped to the system session for provisioning/repair.
     * @param {string} path 
     * @param {object} options 
     */
    repairMetadata(path, options = {}) {
        const username = this._getSessionUsername(options);
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
