import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * UserSettingsService
 *
 * Responsibility:
 * Exposes a public API for reading and writing user-specific settings.
 * Persists settings to /users/{username}/Settings/settings.json.
 */
export class UserSettingsService {
    constructor(userSettingsManager, registry) {
        this.userSettingsManager = userSettingsManager;
        this.registry = registry;
    }

    /**
     * Helper to get the current username from the session.
     * @returns {string|null}
     */
    _getCurrentUsername() {
        const sessionService = this.registry.get('SessionService');
        if (!sessionService) return null;
        
        const session = sessionService.getCurrentSession();
        return session && session.user ? session.user.username : null;
    }

    /**
     * Loads settings from disk into memory for a specific user.
     * @param {string} username 
     */
    async restore(username) {
        const fileService = this.registry.get('FileService');
        if (!fileService) return;

        const path = `/users/${username}/Settings/settings.json`;
        let data = {};

        try {
            if (await fileService.exists(path, { context: { role: 'SYSTEM' } })) {
                // Run as SYSTEM context to bypass isolation if another trusted service needs to read it
                const raw = await fileService.readFile(path, { context: { role: 'SYSTEM' } });
                data = JSON.parse(raw);
            }
        } catch (e) {
            EventBus.emit('user.settings.error', { severity: 'Error', source: 'UserSettingsService', message: `Failed to load settings for ${username}: ${e.message}` });
        }

        this.userSettingsManager.loadSettings(username, data);
        EventBus.emit('user.settings.changed', { severity: 'Info', source: 'UserSettingsService', message: `Settings loaded for ${username}`, username });
    }

    /**
     * Persists a user's settings from memory to disk.
     * @param {string} username 
     */
    async saveSettingsForUser(username) {
        const fileService = this.registry.get('FileService');
        if (!fileService) return;

        const dirPath = `/users/${username}/Settings`;
        const path = `${dirPath}/settings.json`;
        const data = this.userSettingsManager.getAll(username);

        try {
            if (!await fileService.exists(dirPath, { context: { role: 'SYSTEM' } })) {
                await fileService.createDirectory(dirPath, { context: { role: 'SYSTEM' }, ownerOverride: username });
            }
            await fileService.writeFile(path, JSON.stringify(data, null, 2), { context: { role: 'SYSTEM' }, ownerOverride: username });
        } catch (e) {
            EventBus.emit('user.settings.error', { severity: 'Error', source: 'UserSettingsService', message: `Failed to save settings for ${username}: ${e.message}` });
        }
    }

    /**
     * Gets a setting value for the current user.
     * @param {string} key 
     * @returns {any}
     */
    getSetting(key) {
        const username = this._getCurrentUsername();
        if (!username) return null;
        
        return this.userSettingsManager.get(username, key);
    }

    /**
     * Sets a setting value for the current user.
     * @param {string} key 
     * @param {any} value 
     */
    async setSetting(key, value) {
        const username = this._getCurrentUsername();
        if (!username) return;

        this.userSettingsManager.set(username, key, value);
        await this.saveSettingsForUser(username);

        // Emit general change
        EventBus.emit('user.settings.changed', {
            severity: 'Info',
            source: 'UserSettingsService',
            message: `Setting changed: ${key}`,
            username,
            key,
            value
        });
        
        // Emit semantic change specifically for the key
        EventBus.emit(`user.settings.${key}.changed`, {
            severity: 'Info',
            source: 'UserSettingsService',
            message: `Setting ${key} changed.`,
            username,
            value
        });
    }

    /**
     * Gets all settings for the current user.
     * @returns {Object}
     */
    getAllSettings() {
        const username = this._getCurrentUsername();
        if (!username) return {};

        return this.userSettingsManager.getAll(username);
    }
}
