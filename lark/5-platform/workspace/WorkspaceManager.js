import { EventBus } from '../../1-kernel/SystemEventBus.js';

/**
 * WorkspaceManager
 * 
 * Responsibility:
 * Owns virtual workspace metadata, active workspace tracking, and deletion logic.
 * Emits events when workspaces are created, switched, or removed.
 */
export class WorkspaceManager {
    constructor() {
        this.workspaces = [];
        this.activeWorkspaceId = null;
        this.nextWorkspaceIndex = 1;

        // Initialize with a default primary workspace
        this.createWorkspace('Workspace 1');
    }

    createWorkspace(name = null) {
        const id = `workspace-${this.nextWorkspaceIndex++}`;
        const workspaceName = name || `Workspace ${this.workspaces.length + 1}`;
        
        const newWorkspace = {
            id: id,
            name: workspaceName,
            createdAt: Date.now()
        };

        this.workspaces.push(newWorkspace);
        
        if (!this.activeWorkspaceId) {
            this.activeWorkspaceId = id;
            window.LDE_ACTIVE_WORKSPACE_ID = id;
        }

        EventBus.emit('workspace.created', { workspace: newWorkspace });
        EventBus.emit('workspace.stateChanged');
        return newWorkspace;
    }

    switchTo(id) {
        const exists = this.workspaces.find(ws => ws.id === id);
        if (!exists) return false;

        const previousId = this.activeWorkspaceId;
        if (previousId === id) return true;

        this.activeWorkspaceId = id;
        window.LDE_ACTIVE_WORKSPACE_ID = id;
        EventBus.emit('workspace.switched', { previous: previousId, current: id });
        EventBus.emit('workspace.stateChanged');
        return true;
    }

    removeWorkspace(id) {
        // Prevent deleting the very last workspace
        if (this.workspaces.length <= 1) return false;

        const targetIndex = this.workspaces.findIndex(ws => ws.id === id);
        if (targetIndex === -1) return false;

        // Determine fallback workspace for orphaned windows
        let fallbackIndex = targetIndex - 1;
        if (fallbackIndex < 0) fallbackIndex = 1; // If deleting the first one, use the next one
        
        const fallbackWorkspace = this.workspaces[fallbackIndex];

        this.workspaces.splice(targetIndex, 1);

        EventBus.emit('workspace.deleted', { 
            deletedId: id, 
            fallbackId: fallbackWorkspace.id 
        });

        if (this.activeWorkspaceId === id) {
            this.switchTo(fallbackWorkspace.id);
        }

        EventBus.emit('workspace.stateChanged');
        return true;
    }

    getActiveWorkspaceId() {
        return this.activeWorkspaceId;
    }

    getWorkspaces() {
        // Return shallow copies to prevent accidental mutation by consumers
        return this.workspaces.map(ws => ({ ...ws }));
    }

    restoreState(serializedWorkspaceState) {
        if (!serializedWorkspaceState || !serializedWorkspaceState.workspaces || serializedWorkspaceState.workspaces.length === 0) {
            return false;
        }

        this.workspaces = serializedWorkspaceState.workspaces;
        this.activeWorkspaceId = serializedWorkspaceState.activeWorkspaceId;
        this.nextWorkspaceIndex = serializedWorkspaceState.nextWorkspaceIndex || (this.workspaces.length + 1);

        // Ensure fallback if active ID is invalid
        if (!this.workspaces.find(ws => ws.id === this.activeWorkspaceId)) {
            this.activeWorkspaceId = this.workspaces[0].id;
        }

        window.LDE_ACTIVE_WORKSPACE_ID = this.activeWorkspaceId;
        
        // Broadcast the full restoration event and state change
        EventBus.emit('workspace.stateChanged');
        EventBus.emit('workspace.switched', { previous: null, current: this.activeWorkspaceId });
        return true;
    }

    moveWindowToWorkspace(windowId, targetWorkspaceId) {
        EventBus.emit('workspace.windowMoved', { windowId, targetWorkspaceId });
        EventBus.emit('workspace.stateChanged');
        return true;
    }

    reset() {
        this.workspaces = [];
        this.nextWorkspaceIndex = 1;
        this.activeWorkspaceId = null;
        this.createWorkspace('Workspace 1');
        EventBus.emit('workspace.stateChanged');
    }
}
