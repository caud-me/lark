import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * UserManager
 *
 * Responsibility:
 * Maintains the in-memory state of registered user accounts.
 *
 * Does NOT:
 * - Read or write files (that is UserService via FileService)
 * - Handle authentication sessions (that is SessionManager)
 *
 * File I/O has been moved to UserService so that this Manager
 * does not depend upward on the Service layer (Constitution Rule 1).
 */
export class UserManager {
    constructor() {
        this.users = [];
    }

    /**
     * Replaces the in-memory user list with a pre-loaded array.
     * Called once by UserService after reading from disk during boot.
     * @param {Array} usersArray
     */
    loadUsersFromData(usersArray) {
        this.users = (usersArray || []).map(u => ({
            id: u.id || `usr_${Date.now()}`,
            username: u.username,
            displayName: u.displayName || u.username,
            passwordHash: u.passwordHash !== undefined ? u.passwordHash : (u.password || ''),
            passwordHint: u.passwordHint || '',
            profileInitialized: u.profileInitialized !== undefined ? u.profileInitialized : false,
            passwordInitialized: u.passwordInitialized !== undefined ? u.passwordInitialized : false,
            role: u.role || 'USER',
            createdAt: u.createdAt || new Date().toISOString(),
            homeDirectory: u.homeDirectory || `/users/${u.username}`
        }));
    }

    /**
     * Returns the raw users array for persistence.
     * Called by UserService when it needs to write users back to disk.
     * @returns {Array}
     */
    getUsersData() {
        return this.users;
    }

    deleteUser(username) {
        if (username === 'system') return false; // Hard block deleting system
        
        // Block deleting the last administrator
        const user = this.getUser(username);
        if (user && user.role === 'ADMINISTRATOR') {
            const adminCount = this.users.filter(u => u.role === 'ADMINISTRATOR').length;
            if (adminCount <= 1) {
                return false;
            }
        }
        
        const initialLength = this.users.length;
        this.users = this.users.filter(u => u.username !== username);
        return this.users.length !== initialLength;
    }

    renameUser(oldUsername, newUsername) {
        if (oldUsername === 'system') return false;
        
        const oldUser = this.getUser(oldUsername);
        const newUser = this.getUser(newUsername);
        
        if (oldUser && !newUser) {
            oldUser.username = newUsername;
            oldUser.homeDirectory = `/users/${newUsername}`;
            return true;
        }
        return false;
    }

    getUsers() {
        return this.users;
    }

    /**
     * Creates a new user record in memory.
     * Does NOT provision the home directory — that is done by UserService
     * after calling this method, using FileService.
     * @param {string} username
     * @param {string} displayName
     * @returns {Object} The new user record
     */
    createUser(username, displayName, passwordHash, role = 'USER', options = {}) {
        if (this.users.find(u => u.username === username)) {
            throw new Error(`User ${username} already exists.`);
        }

        const user = {
            id: `usr_${Date.now()}`,
            username,
            displayName,
            passwordHash,
            passwordHint: options.passwordHint || '',
            profileInitialized: options.profileInitialized !== undefined ? options.profileInitialized : false,
            passwordInitialized: options.passwordInitialized !== undefined ? options.passwordInitialized : false,
            role,
            createdAt: new Date().toISOString(),
            homeDirectory: `/users/${username}`
        };

        this.users.push(user);
        return user;
    }

    getUser(username) {
        return this.users.find(u => u.username === username) || null;
    }
}
