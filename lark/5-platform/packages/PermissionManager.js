/**
 * PermissionManager
 *
 * Responsibility:
 * Owns the mutable state of granted, denied, or revoked permissions.
 * Does NOT own requested permissions (those belong to ApplicationDatabaseManager).
 */
export class PermissionManager {
    constructor() {
        this.state = {};
    }

    setState(state) {
        this.state = state;
    }

    getState() {
        return this.state;
    }

    getPermissionState(appId, permission) {
        if (this.state[appId] && this.state[appId][permission]) {
            return this.state[appId][permission]; // 'granted', 'denied', 'revoked'
        }
        return 'unprompted';
    }

    setPermissionState(appId, permission, status) {
        if (!this.state[appId]) this.state[appId] = {};
        this.state[appId][permission] = status;
    }
}
