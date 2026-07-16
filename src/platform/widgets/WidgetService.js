import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * WidgetService
 * 
 * Responsibility:
 * Exposes a safe public API for adding, removing, and querying widgets.
 * Emits system-wide semantic events when widget layouts or configurations change.
 */
export class WidgetService {
    constructor(widgetManager, extensionService, serviceRegistry) {
        this.widgetManager = widgetManager;
        this.extensionService = extensionService;
        this.serviceRegistry = serviceRegistry;
    }

    _getConfigPath(username) {
        return `/users/${username}/Settings/widgets.json`;
    }

    async restore(username) {
        const fileService = this.serviceRegistry.get('FileService');
        const securityService = this.serviceRegistry.get('SecurityService');
        if (!fileService || !securityService) return;

        const systemContext = securityService.getSystemContext();
        try {
            const path = this._getConfigPath(username);
            if (await fileService.exists(path, { context: systemContext })) {
                const data = await fileService.readFile(path, { context: systemContext });
                if (data) {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed.instances)) {
                        this.widgetManager.setWidgets(parsed.instances, parsed.nextInstanceId);
                    }
                }
            } else {
                this.widgetManager.setWidgets([], 1);
            }
        } catch (e) {
            console.error(`[WidgetService] Failed to load widget instances for ${username}:`, e);
            this.widgetManager.setWidgets([], 1);
        }
    }

    async save() {
        const fileService = this.serviceRegistry.get('FileService');
        const securityService = this.serviceRegistry.get('SecurityService');
        const sessionService = this.serviceRegistry.get('SessionService');
        if (!fileService || !securityService || !sessionService) return;

        const session = sessionService.getCurrentSession();
        if (!session || !session.user) return;
        const username = session.user.username;

        const systemContext = securityService.getSystemContext();
        try {
            const dirPath = `/users/${username}/Settings`;
            const path = this._getConfigPath(username);
            
            if (!await fileService.exists(dirPath, { context: systemContext })) {
                await fileService.createDirectory(dirPath, { context: systemContext, ownerOverride: username });
            }
            await fileService.writeFile(path, JSON.stringify(this.widgetManager.getWidgetState(), null, 2), { context: systemContext, ownerOverride: username });
        } catch (e) {
            console.error(`[WidgetService] Failed to save widget instances for ${username}:`, e);
        }
    }

    /**
     * Adds a new instance of a widget.
     * @param {string} widgetId 
     * @param {number} x 
     * @param {number} y 
     * @param {number} w 
     * @param {number} h 
     * @param {Object} config 
     */
    async addWidget(widgetId, x, y, w, h, config = {}) {
        const instance = this.widgetManager.addInstance(widgetId, x, y, w, h, config);
        await this.save();
        EventBus.emit('widget.changed', { severity: 'Info', source: 'WidgetService', message: `Added widget instance ${instance.instanceId}` });
        return instance;
    }

    /**
     * Removes a widget instance.
     * @param {string} instanceId 
     */
    async removeWidget(instanceId) {
        const removed = this.widgetManager.removeInstance(instanceId);
        if (removed) {
            await this.save();
            EventBus.emit('widget.changed', { severity: 'Info', source: 'WidgetService', message: `Removed widget instance ${instanceId}` });
        }
        return removed;
    }

    /**
     * Moves a widget instance.
     * @param {string} instanceId 
     * @param {number} x 
     * @param {number} y 
     */
    async moveWidget(instanceId, x, y) {
        const updated = this.widgetManager.updateInstance(instanceId, { x, y });
        if (updated) {
            await this.save();
            EventBus.emit('widget.changed', { severity: 'Info', source: 'WidgetService', message: `Moved widget instance ${instanceId}` });
        }
    }

    /**
     * Resizes a widget instance.
     * @param {string} instanceId 
     * @param {number} w 
     * @param {number} h 
     */
    async resizeWidget(instanceId, w, h) {
        const updated = this.widgetManager.updateInstance(instanceId, { width: w, height: h });
        if (updated) {
            await this.save();
            EventBus.emit('widget.changed', { severity: 'Info', source: 'WidgetService', message: `Resized widget instance ${instanceId}` });
        }
    }

    /**
     * Updates the configuration of a widget instance.
     * @param {string} instanceId 
     * @param {Object} configUpdates 
     */
    async updateWidgetConfig(instanceId, configUpdates) {
        const updated = this.widgetManager.updateInstance(instanceId, { config: configUpdates });
        if (updated) {
            await this.save();
            EventBus.emit('widget.changed', { severity: 'Info', source: 'WidgetService', message: `Updated config for widget instance ${instanceId}` });
        }
    }

    /**
     * Gets all active widget instances.
     * @returns {Array}
     */
    getWidgets() {
        return this.widgetManager.getInstances();
    }

    /**
     * Gets all available widget manifests from registered providers.
     * @returns {Array}
     */
    getAvailableWidgets() {
        const widgetRegistry = this.serviceRegistry.get('WidgetRegistry');
        const nativeWidgets = widgetRegistry ? widgetRegistry.getBuiltIns() : [];

        const extensionWidgets = this.extensionService.getExtensions('widget').map(ext => {
            // Map extension structure back to expected widget structure (if needed)
            // Currently Desktop just checks ext.id, ext.modulePath/ext.entryPoint
            return {
                id: ext.id,
                name: ext.name || ext.title || ext.id,
                description: ext.description || '',
                modulePath: ext.entryPoint,
                providerId: ext.appId
            };
        });

        return [...nativeWidgets.map(ext => ({
            id: ext.id,
            name: ext.name || ext.title || ext.id,
            description: ext.description || '',
            modulePath: ext.entryPoint,
            providerId: ext.providerId
        })), ...extensionWidgets];
    }
}
