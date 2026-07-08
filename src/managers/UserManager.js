import { EventBus } from '../kernel/SystemEventBus.js';

/**
 * UserManager
 *
 * Responsibility:
 * Manages the state of registered users.
 *
 * Does NOT:
 * - Handle authentication sessions
 */
export class UserManager {
    constructor(registry) {
        this.registry = registry;
        this.users = [];
    }

    _getFileService() {
        return this.registry.get('FileService');
    }

    loadUsers() {
        const fs = this._getFileService();
        if (fs && fs.exists('/system/users.json')) {
            try {
                const data = fs.readFile('/system/users.json');
                this.users = JSON.parse(data) || [];
            } catch (e) {
                console.error('[UserManager] Failed to load users', e);
                this.users = [];
            }
        }
    }

    _saveUsers() {
        const fs = this._getFileService();
        if (fs) {
            if (!fs.exists('/system')) {
                fs.createDirectory('/system');
            }
            fs.writeFile('/system/users.json', JSON.stringify(this.users));
        }
    }

    getUsers() {
        if (this.users.length === 0) {
            this.loadUsers();
        }
        return this.users;
    }

    createUser(username, displayName) {
        if (this.users.find(u => u.username === username)) {
            throw new Error(`User ${username} already exists.`);
        }

        const user = {
            id: `usr_${Date.now()}`,
            username,
            displayName,
            createdAt: new Date().toISOString(),
            homeDirectory: `/users/${username}`
        };

        this.users.push(user);
        this._saveUsers();

        // Provision home directory
        const fs = this._getFileService();
        if (fs) {
            if (!fs.exists('/users')) {
                fs.createDirectory('/users');
            }
            if (!fs.exists(user.homeDirectory)) {
                fs.createDirectory(user.homeDirectory, { ownerOverride: username });
            } else if (typeof fs.repairMetadata === 'function') {
                fs.repairMetadata(user.homeDirectory, { ownerOverride: username });
            }
        }

        EventBus.emit('user.created', { severity: 'Info', source: 'UserManager', message: `Created user ${username}` });
        return user;
    }

    getUser(username) {
        if (this.users.length === 0) {
            this.loadUsers();
        }
        return this.users.find(u => u.username === username) || null;
    }
}
