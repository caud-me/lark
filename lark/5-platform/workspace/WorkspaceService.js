import { EventBus } from '../../1-kernel/SystemEventBus.js';

/**
 * WorkspaceService
 * 
 * Responsibility:
 * Exposes a public API for Shell components to interact with the WorkspaceManager.
 * 
 * Does NOT:
 * - Render anything.
 * - Enforce window assignments (WindowManager handles that).
 */
export class WorkspaceService {
    constructor(workspaceManager) {
        this.workspaceManager = workspaceManager;
    }

    createWorkspace(name = null) {
        return this.workspaceManager.createWorkspace(name);
    }

    switchTo(id) {
        return this.workspaceManager.switchTo(id);
    }

    removeWorkspace(id) {
        return this.workspaceManager.removeWorkspace(id);
    }

    getActiveWorkspaceId() {
        return this.workspaceManager.getActiveWorkspaceId();
    }

    getWorkspaces() {
        return this.workspaceManager.getWorkspaces();
    }

    serializeState() {
        return {
            activeWorkspaceId: this.workspaceManager.activeWorkspaceId,
            workspaces: this.workspaceManager.getWorkspaces(),
            nextWorkspaceIndex: this.workspaceManager.nextWorkspaceIndex
        };
    }

    moveWindowToWorkspace(windowId, targetWorkspaceId) {
        return this.workspaceManager.moveWindowToWorkspace(windowId, targetWorkspaceId);
    }

    restoreState(state) {
        return this.workspaceManager.restoreState(state);
    }

    reset() {
        return this.workspaceManager.reset();
    }

    _bindEvent(eventName, callback) {
        const handler = (payload) => callback(payload.data || payload);
        EventBus.on(eventName, handler);
        return () => EventBus.off(eventName, handler);
    }

    onCreated(callback) { return this._bindEvent('workspace.created', callback); }
    onDeleted(callback) { return this._bindEvent('workspace.deleted', callback); }
    onSwitched(callback) { return this._bindEvent('workspace.switched', callback); }
    onStateChanged(callback) { return this._bindEvent('workspace.stateChanged', callback); }
}
