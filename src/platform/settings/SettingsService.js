import { EventBus } from '../../kernel/SystemEventBus.js';

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
    constructor(settingsManager, serviceRegistry) {
        this.settingsManager = settingsManager;
        this.serviceRegistry = serviceRegistry;
        this.configPath = '/system/settings.json';
    }

    async initialize() {
        const fileService = this.serviceRegistry.get('FileService');
        const securityService = this.serviceRegistry.get('SecurityService');
        if (!fileService || !securityService) return;

        const systemContext = securityService.getSystemContext();
        try {
            if (await fileService.exists(this.configPath, { context: systemContext })) {
                const data = await fileService.readFile(this.configPath, { context: systemContext });
                if (data) {
                    this.settingsManager.setSettings(JSON.parse(data));
                }
            }
        } catch (e) {
            console.error('[SettingsService] Failed to load settings:', e);
        }
    }

    async save() {
        const fileService = this.serviceRegistry.get('FileService');
        const securityService = this.serviceRegistry.get('SecurityService');
        if (!fileService || !securityService) return;

        const systemContext = securityService.getSystemContext();
        try {
            if (!await fileService.exists('/system', { context: systemContext })) {
                await fileService.createDirectory('/system', { context: systemContext });
            }
            await fileService.writeFile(this.configPath, JSON.stringify(this.settingsManager.getAllSettings(), null, 4), { context: systemContext });
        } catch (e) {
            console.error('[SettingsService] Failed to save settings:', e);
        }
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
    async setSetting(key, value) {
        EventBus.emit('system.settings.changed', { severity: 'Info', source: 'SettingsService', message: `Setting changed: ${key}`, data: { key, value } });
        this.settingsManager.set(key, value);
        await this.save();
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
    async resetSetting(key) {
        EventBus.emit('system.settings.reset', { severity: 'Info', source: 'SettingsService', message: `Setting reset: ${key}`, data: { key } });
        this.settingsManager.reset(key);
        await this.save();
    }
}
