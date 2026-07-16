import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * SettingsManager
 *
 * Responsibility:
 * Maintains system configuration settings state.
 *
 * Does NOT:
 * - Apply settings to system components
 */
export class SettingsManager {
    constructor() {
        this.settings = {
            'desktop.wallpaper': '#101010' // default
        };
    }

    setSettings(settings) {
        this.settings = { ...this.settings, ...settings };
    }

    getAllSettings() {
        return this.settings;
    }

    /**
     * Gets a setting value.
     * @param {string} key 
     * @returns {any}
     */
    get(key) {
        return this.settings[key];
    }

    /**
     * Gets all settings.
     * @returns {Object}
     */
    getAll() {
        return { ...this.settings };
    }

    /**
     * Sets a setting value.
     * @param {string} key 
     * @param {any} value 
     */
    set(key, value) {
        this.settings[key] = value;
    }

    /**
     * Resets a setting to default (by removing it).
     * @param {string} key
     */
    reset(key) {
        delete this.settings[key];
    }
}
