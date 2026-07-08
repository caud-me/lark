import { EventBus } from '../kernel/SystemEventBus.js';

/**
 * SessionManager
 *
 * Responsibility:
 * Maintains the current user session state.
 *
 * Does NOT:
 * - Enforce input policies or screen locking
 */
export class SessionManager {
    constructor(registry) {
        this.registry = registry;
        this.currentSession = null;
    }

    startSystemSession() {
        this.currentSession = {
            id: `sess_${Date.now()}`,
            user: { username: 'system', homeDirectory: '/' },
            startTime: new Date().toISOString(),
            locked: false
        };
        EventBus.emit('session.started', { severity: 'Info', source: 'SessionManager', message: 'System session established.' });
    }

    startSession(user) {
        this.currentSession = {
            id: `sess_${Date.now()}`,
            user,
            startTime: new Date().toISOString(),
            locked: false
        };
        EventBus.emit('session.started', { severity: 'Info', source: 'SessionManager', message: `Session started for user ${user.username}.` });
    }

    lockSession() {
        if (!this.currentSession || this.currentSession.user.username === 'system' || this.currentSession.locked) {
            return false;
        }

        this.currentSession.locked = true;
        EventBus.emit('session.locked', { severity: 'Info', source: 'SessionManager', message: `Session locked for user ${this.currentSession.user.username}.` });
        return true;
    }

    unlockSession() {
        if (!this.currentSession || this.currentSession.user.username === 'system' || !this.currentSession.locked) {
            return false;
        }

        this.currentSession.locked = false;
        EventBus.emit('session.unlocked', { severity: 'Info', source: 'SessionManager', message: `Session unlocked for user ${this.currentSession.user.username}.` });
        return true;
    }

    isLocked() {
        return !!(this.currentSession && this.currentSession.locked);
    }

    endSession() {
        if (this.currentSession) {
            EventBus.emit('session.ended', { severity: 'Info', source: 'SessionManager', message: `Session ended for user ${this.currentSession.user.username}.` });
            this.currentSession = null;
            // Fallback to system session automatically so OS services keep running securely
            this.startSystemSession();
        }
    }

    getCurrentSession() {
        return this.currentSession;
    }
}
