import { EventBus } from '../kernel/SystemEventBus.js';

/**
 * SettingsService
 *
 * Responsibility:
 * Exposes a public API for reading and writing system settings.
 *
 * Does NOT:
 * - Persist settings natively
 */
export class SettingsService {
    constructor(settingsManager) {
        this.settingsManager = settingsManager;
    }

    /**
     * Gets a setting value.
     * @param {string} key 
     * @returns {any}
     */
    getSetting(key) {
        return this.settingsManager.get(key);
    }

    /**
     * Sets a setting value.
     * @param {string} key 
     * @param {any} value 
     */
    setSetting(key, value) {
        EventBus.emit('settingsService:change', { severity: 'Info', source: 'SettingsService', message: `Setting changed: ${key}` });
        this.settingsManager.set(key, value);
    }

    /**
     * Gets all settings.
     * @returns {Object}
     */
    getAllSettings() {
        return this.settingsManager.getAll();
    }

    /**
     * Resets a setting to default.
     * @param {string} key 
     */
    resetSetting(key) {
        EventBus.emit('settingsService:reset', { severity: 'Info', source: 'SettingsService', message: `Setting reset: ${key}` });
        this.settingsManager.reset(key);
    }
}
