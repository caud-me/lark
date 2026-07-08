import { EventBus } from '../kernel/SystemEventBus.js';

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
    constructor(lrfs) {
        this.lrfs = lrfs;
        this.settings = {
            'desktop.wallpaper': '#2a3b4c' // Default dark blueish wallpaper
        };
        this.loadSettings();
    }

    loadSettings() {
        try {
            if (this.lrfs && this.lrfs.exists('/system/settings.json')) {
                const data = this.lrfs.readFile('/system/settings.json');
                if (data) {
                    const parsed = JSON.parse(data);
                    this.settings = { ...this.settings, ...parsed };
                }
            }
        } catch (e) {
            EventBus.emit('settingsManager:error', { severity: 'Error', source: 'SettingsManager', message: 'Failed to load settings.' });
        }
    }

    saveSettings() {
        if (!this.lrfs) return;
        try {
            if (!this.lrfs.exists('/system')) {
                this.lrfs.createDirectory('/system');
            }
            this.lrfs.writeFile('/system/settings.json', JSON.stringify(this.settings));
        } catch (e) {
            EventBus.emit('settingsManager:error', { severity: 'Error', source: 'SettingsManager', message: 'Failed to save settings.' });
        }
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
        this.saveSettings();
        EventBus.emit('settings:changed', { key, value });
    }

    /**
     * Resets a setting to default (by removing it and reloading or just deleting).
     * For now, just delete it.
     * @param {string} key
     */
    reset(key) {
        delete this.settings[key];
        this.saveSettings();
        EventBus.emit('settings:changed', { key, value: undefined });
    }
}
