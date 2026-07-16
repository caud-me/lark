import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * PermissionService
 *
 * Responsibility:
 * The single public API for checking, requesting, and querying permissions.
 * Combines the immutable requested permissions from ApplicationDatabase with
 * the mutable state from PermissionManager.
 */
export class PermissionService {
    constructor(permissionManager, appService, serviceRegistry) {
        this.manager = permissionManager;
        this.appService = appService;
        this.serviceRegistry = serviceRegistry;
        this.configPath = '/system/permissions.json';
    }

    async initialize() {
        const fileService = this.serviceRegistry.get('FileService');
        const securityService = this.serviceRegistry.get('SecurityService');
        if (!fileService || !securityService) return;

        const systemContext = securityService.getSystemContext();
        try {
            if (await fileService.exists(this.configPath, { context: systemContext })) {
                const data = await fileService.readFile(this.configPath, { context: systemContext });
                this.manager.setState(JSON.parse(data));
            } else {
                this.manager.setState({});
            }
        } catch (error) {
            console.error('[PermissionService] Failed to load permission state:', error);
            this.manager.setState({});
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
            await fileService.writeFile(this.configPath, JSON.stringify(this.manager.getState(), null, 2), { context: systemContext });
        } catch (error) {
            console.error('[PermissionService] Failed to save permission state:', error);
        }
    }

    hasPermission(appId, permission) {
        const app = this.appService.getApplication(appId);
        if (!app) return false;

        // Check if the app even requested this permission
        const requested = app.permissions || [];
        if (!requested.includes(permission)) {
            return false;
        }

        // Check mutable state
        const state = this.manager.getPermissionState(appId, permission);
        
        // For Phase 4, we implicitly trust 'unprompted' requested permissions.
        // In the future, this will return false until explicitly 'granted'.
        return state === 'granted' || state === 'unprompted';
    }

    async requestPermission(appId, permission) {
        const app = this.appService.getApplication(appId);
        if (!app || !(app.permissions || []).includes(permission)) {
            throw new Error(`Permission ${permission} not declared by application ${appId}`);
        }

        const currentState = this.manager.getPermissionState(appId, permission);
        
        EventBus.emit('permission.requested', { 
            severity: 'Info', 
            source: 'PermissionService', 
            message: `App ${appId} requested permission ${permission}` 
        });

        // Phase 4: Auto-grant implicitly. Future: trigger prompt UI
        if (currentState !== 'granted') {
            this.manager.setPermissionState(appId, permission, 'granted');
            await this.save();
            EventBus.emit('permission.granted', { 
                severity: 'Info', 
                source: 'PermissionService', 
                message: `Permission ${permission} granted to ${appId}` 
            });
            return true;
        }

        return true;
    }

    async revokePermission(appId, permission) {
        this.manager.setPermissionState(appId, permission, 'revoked');
        await this.save();
        EventBus.emit('permission.revoked', { 
            severity: 'Info', 
            source: 'PermissionService', 
            message: `Permission ${permission} revoked for ${appId}` 
        });
    }

    getPermissions(appId) {
        const app = this.appService.getApplication(appId);
        if (!app) return [];

        return (app.permissions || []).map(perm => ({
            permission: perm,
            state: this.manager.getPermissionState(appId, perm)
        }));
    }
}
