/**
 * UserSettingsManager
 *
 * Responsibility:
 * Maintains the in-memory state of per-user settings.
 *
 * Does NOT:
 * - Perform file I/O
 * - Emit domain events (handled by Service)
 */
export class UserSettingsManager {
    constructor() {
        this.userSettings = new Map(); // username -> settings object
        this.defaults = {
            'desktop.wallpaper': '#101010'
        };
    }

    /**
     * Initializes or replaces the settings in memory for a user.
     * @param {string} username 
     * @param {Object} data 
     */
    loadSettings(username, data) {
        const merged = { ...this.defaults, ...data };
        this.userSettings.set(username, merged);
    }

    /**
     * Gets a setting value for a user.
     * @param {string} username 
     * @param {string} key 
     * @returns {any}
     */
    get(username, key) {
        const settings = this.userSettings.get(username) || this.defaults;
        return settings[key];
    }

    /**
     * Gets all settings for a user.
     * @param {string} username 
     * @returns {Object}
     */
    getAll(username) {
        const settings = this.userSettings.get(username) || this.defaults;
        return { ...settings };
    }

    /**
     * Sets a setting value in memory for a user.
     * @param {string} username 
     * @param {string} key 
     * @param {any} value 
     */
    set(username, key, value) {
        if (!this.userSettings.has(username)) {
            this.userSettings.set(username, { ...this.defaults });
        }
        const settings = this.userSettings.get(username);
        settings[key] = value;
    }

    /**
     * Resets a setting to default in memory.
     * @param {string} username 
     * @param {string} key
     */
    reset(username, key) {
        if (!this.userSettings.has(username)) return;
        const settings = this.userSettings.get(username);
        delete settings[key];
        
        if (this.defaults[key] !== undefined) {
            settings[key] = this.defaults[key];
        }
    }
}
