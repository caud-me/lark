import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * UserService
 *
 * Responsibility:
 * Exposes a public API for managing user accounts.
 * Owns all user persistence (reading/writing users.json via FileService).
 * Owns home directory provisioning (via FileService).
 *
 * Does NOT:
 * - Handle authentication mechanisms (that is SessionService)
 * - Maintain raw user state in memory (that is UserManager)
 *
 * This service owns the file I/O that UserManager previously handled
 * incorrectly. Moving it here keeps UserManager as a pure in-memory store
 * and prevents Manager→Service layer violations (Constitution Rule 1).
 */
export class UserService {
    constructor(userManager, registry) {
        this.userManager = userManager;
        this.registry = registry;
    }

    /**
     * Loads user accounts from disk into UserManager's in-memory store.
     * Should be called once during boot after FileService is available.
     */
    loadUsersFromDisk() {
        const fileService = this.registry.get('FileService');
        if (!fileService) {
            EventBus.emit('userService:warn', { severity: 'Warning', source: 'UserService', message: 'FileService not available. Users not loaded from disk.' });
            return;
        }

        const securityService = this.registry.get('SecurityService');
        const systemContext = securityService ? securityService.getSystemContext() : { identity: 'system', role: 'SYSTEM' };

        if (!fileService.exists('/system/users.json', { context: systemContext })) {
            // No users file yet — first boot or fresh install. That is fine.
            return;
        }

        try {
            const rawData = fileService.readFile('/system/users.json', { context: systemContext });
            const parsedUsers = JSON.parse(rawData) || [];
            this.userManager.loadUsersFromData(parsedUsers);
        } catch (e) {
            EventBus.emit('userService:error', { severity: 'Error', source: 'UserService', message: `Failed to load users from disk: ${e.message}` });
        }
    }

    /**
     * Saves the current in-memory user list back to disk.
     * Called after creating a new user account.
     */
    saveUsersToDisk() {
        const fileService = this.registry.get('FileService');
        if (!fileService) {
            EventBus.emit('userService:warn', { severity: 'Warning', source: 'UserService', message: 'FileService not available. Users not saved to disk.' });
            return;
        }

        const securityService = this.registry.get('SecurityService');
        const systemContext = securityService ? securityService.getSystemContext() : { identity: 'system', role: 'SYSTEM' };

        try {
            if (!fileService.exists('/system', { context: systemContext })) {
                fileService.createDirectory('/system', { context: systemContext });
            }
            fileService.writeFile('/system/users.json', JSON.stringify(this.userManager.getUsersData()), { context: systemContext });
        } catch (e) {
            EventBus.emit('userService:error', { severity: 'Error', source: 'UserService', message: `Failed to save users to disk: ${e.message}` });
        }
    }

    /**
     * Creates a new user account, provisions their home directory, and persists to disk.
     * @param {string} username
     * @param {string} displayName
     * @returns {Object} The new user record
     */
    createUser(username, displayName, password, options = {}) {
        const securityPolicy = this.registry.get('SecurityPolicy');
        const securityService = this.registry.get('SecurityService');
        const context = options.context || (securityService ? securityService.getSessionContext() : null);

        // If this is the very first user, they become ADMINISTRATOR (OOBE bypasses policy)
        const isFirstUser = this.userManager.getUsers().length === 0;
        
        if (!isFirstUser && securityPolicy) {
            if (securityPolicy.canManageUsers(context) !== 'ALLOW') {
                throw new Error("Permission denied: Cannot create users.");
            }
        }
        
        // Step 1: Validate Uniqueness
        if (this.userManager.getUsers().find(u => u.username === username)) {
            throw new Error(`User ${username} already exists.`);
        }

        const role = isFirstUser ? 'ADMINISTRATOR' : 'USER';
        const homeDirectory = `/users/${username}`;
        const fileService = this.registry.get('FileService');
        const systemContext = securityService ? securityService.getSystemContext() : null;

        try {
            // Step 2: Provision Files
            if (fileService) {
                if (!fileService.exists('/users')) {
                    fileService.createDirectory('/users', { context: systemContext });
                }
                if (!fileService.exists(homeDirectory)) {
                    fileService.createDirectory(homeDirectory, { ownerOverride: username, context: systemContext });
                    
                    const standardDirs = ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Settings', 'Library'];
                    for (const dir of standardDirs) {
                        fileService.createDirectory(`${homeDirectory}/${dir}`, { ownerOverride: username, context: systemContext });
                    }
                    
                    // Provision default profile.json
                    const initialProfile = {
                        displayName: displayName || username,
                        avatar: null
                    };
                    fileService.writeFile(`${homeDirectory}/profile.json`, JSON.stringify(initialProfile), { ownerOverride: username, context: systemContext });
                } else if (typeof fileService.repairMetadata === 'function') {
                    fileService.repairMetadata(homeDirectory, { ownerOverride: username, context: systemContext });
                }
            }

            // Step 3: Register User in Memory
            const passwordInitialized = !!password;
            const user = this.userManager.createUser(username, displayName, password, role, {
                profileInitialized: options.profileInitialized || false,
                passwordInitialized: options.passwordInitialized !== undefined ? options.passwordInitialized : passwordInitialized,
                passwordHint: options.passwordHint || ''
            });

            // Step 4: Persist to Disk
            this.saveUsersToDisk();

            // Step 5: Emit Event
            EventBus.emit('user.created', { severity: 'Info', source: 'UserService', message: `Created user ${username}`, user });

            return user;
        } catch (e) {
            // Rollback
            if (fileService && fileService.exists(homeDirectory)) {
                try {
                    fileService.delete(homeDirectory, { recursive: true, context: systemContext });
                } catch (rollbackError) {
                    console.error('Failed to rollback home directory:', rollbackError);
                }
            }
            throw e;
        }
    }

    /**
     * Updates profile and credentials for a given user account.
     */
    updateUser(username, updates = {}, options = {}) {
        const securityPolicy = this.registry.get('SecurityPolicy');
        const securityService = this.registry.get('SecurityService');
        const context = options.context || (securityService ? securityService.getSessionContext() : null);

        if (securityPolicy) {
            if (securityPolicy.canModifyAccount(context, username) !== 'ALLOW') {
                throw new Error("Permission denied: Cannot modify account details.");
            }
        }

        const user = this.userManager.getUser(username);
        if (!user) {
            throw new Error(`User ${username} not found.`);
        }

        if (updates.displayName !== undefined) user.displayName = updates.displayName;
        if (updates.passwordHash !== undefined) {
            user.passwordHash = updates.passwordHash;
            if (updates.passwordInitialized !== undefined) {
                user.passwordInitialized = updates.passwordInitialized;
            } else {
                user.passwordInitialized = !!updates.passwordHash;
            }
        }
        if (updates.passwordHint !== undefined) user.passwordHint = updates.passwordHint;
        if (updates.profileInitialized !== undefined) user.profileInitialized = updates.profileInitialized;

        this.saveUsersToDisk();
        EventBus.emit('user.profile.changed', { username, updates });
        return user;
    }

    /**
     * Renames a user account transactionally, updating disk database and renaming home folders safely.
     */
    async renameUser(oldUsername, newUsername, options = {}) {
        const securityPolicy = this.registry.get('SecurityPolicy');
        const securityService = this.registry.get('SecurityService');
        const context = options.context || (securityService ? securityService.getSessionContext() : null);

        // Security check
        if (securityPolicy) {
            if (securityPolicy.canModifyAccount(context, oldUsername) !== 'ALLOW') {
                throw new Error("Permission denied: Cannot rename user.");
            }
        }

        // Validate uniqueness
        if (this.userManager.getUser(newUsername)) {
            throw new Error(`Username ${newUsername} is already taken.`);
        }

        const fileService = this.registry.get('FileService');
        const systemContext = securityService ? securityService.getSystemContext() : { identity: 'system', role: 'SYSTEM' };

        const oldHome = `/users/${oldUsername}`;
        const newHome = `/users/${newUsername}`;

        let directoryCopied = false;

        try {
            // 1. Copy directory
            if (fileService && fileService.exists(oldHome, { context: systemContext })) {
                fileService.copy(oldHome, newHome, { context: systemContext });
                directoryCopied = true;
                
                // 2. Verify copy
                if (!fileService.exists(newHome, { context: systemContext })) {
                    throw new Error(`Directory copy verification failed for ${newHome}`);
                }
            }

            // 3. Update database (UserManager)
            const success = this.userManager.renameUser(oldUsername, newUsername);
            if (!success) {
                throw new Error(`Failed to rename user ${oldUsername} in memory.`);
            }

            // 4. Update profile (profile.json)
            const profilePath = `${newHome}/profile.json`;
            if (fileService && fileService.exists(profilePath, { context: systemContext })) {
                try {
                    const raw = fileService.readFile(profilePath, { context: systemContext });
                    const profileData = JSON.parse(raw);
                    if (profileData.displayName === oldUsername) {
                        profileData.displayName = newUsername;
                    }
                    fileService.writeFile(profilePath, JSON.stringify(profileData), { context: systemContext });
                } catch (pe) {
                    console.error('[UserService] Failed to update profile.json on rename:', pe);
                }
            }

            // Persist user database changes
            this.saveUsersToDisk();

            // 5. Delete old directory
            if (directoryCopied && fileService && fileService.exists(oldHome, { context: systemContext })) {
                fileService.delete(oldHome, { recursive: true, context: systemContext });
            }

            // 6. Emit Event
            EventBus.emit('user.renamed', { 
                severity: 'Info', 
                source: 'UserService', 
                message: `User ${oldUsername} renamed to ${newUsername}`,
                oldUsername,
                newUsername
            });

            return true;
        } catch (e) {
            // Rollback if new directory was created
            if (directoryCopied && fileService && fileService.exists(newHome, { context: systemContext })) {
                try {
                    fileService.delete(newHome, { recursive: true, context: systemContext });
                } catch (rollbackError) {
                    console.error('[UserService] Critical: Failed to clean up new directory during user rename rollback:', rollbackError);
                }
            }
            throw e;
        }
    }

    deleteUser(username, options = {}) {
        const securityPolicy = this.registry.get('SecurityPolicy');
        const securityService = this.registry.get('SecurityService');
        const context = options.context || (securityService ? securityService.getSessionContext() : null);

        if (securityPolicy) {
            if (securityPolicy.canDeleteUser(context, username) !== 'ALLOW') {
                throw new Error(`Permission denied: Cannot delete user ${username}.`);
            }
        }

        const success = this.userManager.deleteUser(username);
        if (success) {
            // Also delete their profile from disk (FileService will handle policy naturally)
            const fileService = this.registry.get('FileService');
            if (fileService) {
                const profilePath = `/users/${username}/profile.json`;
                if (fileService.exists(profilePath)) {
                    fileService.delete(profilePath, { context: { identity: 'system', role: 'SYSTEM' } });
                }
            }
            this.saveUsersToDisk();
            EventBus.emit('user.deleted', { severity: 'Info', source: 'UserService', message: `User ${username} deleted.` });
        } else {
            throw new Error(`Could not delete user ${username}. They may be the last administrator or system user.`);
        }
        return success;
    }

    resetPassword(username, newPassword, options = {}) {
        const securityPolicy = this.registry.get('SecurityPolicy');
        const securityService = this.registry.get('SecurityService');
        const context = options.context || (securityService ? securityService.getSessionContext() : null);

        if (securityPolicy) {
            if (securityPolicy.canModifyAccount(context, username) !== 'ALLOW') {
                throw new Error(`Permission denied: Cannot reset password for ${username}.`);
            }
        }

        const user = this.userManager.getUser(username);
        if (!user) {
            throw new Error(`User ${username} not found.`);
        }
        user.passwordHash = newPassword;
        user.passwordInitialized = true;
        this.saveUsersToDisk();

        EventBus.emit('user.password.changed', { severity: 'Info', source: 'UserService', message: `Password reset completed for ${username}.`, username });
        return true;
    }

    getUser(username) {
        return this.userManager.getUser(username);
    }

    getUsers() {
        return this.userManager.getUsers();
    }
}
