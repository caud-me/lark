import { EventBus } from '../../1-kernel/SystemEventBus.js';
import { Result } from '../common/Result.js';

/**
 * SessionService
 *
 * Responsibility:
 * Exposes a public API for user authentication and session management.
 * Standardizes domain operations (login, lock, unlock, logout) using Result Object contracts.
 * Pure read-only getters (getCurrentSession, getSessions, isLocked) return native values.
 */
export class SessionService {
    constructor(sessionManager, userManager, registry) {
        this.sessionManager = sessionManager;
        this.userManager = userManager;
        this.registry = registry;
    }

    getCurrentSession() {
        return this.sessionManager.getCurrentSession();
    }

    getSessions() {
        return this.sessionManager.getSessions();
    }

    login(username) {
        const user = this.userManager.getUser(username);
        if (!user) {
            return Result.failure('USER_NOT_FOUND', `User account '${username}' not found.`);
        }
        
        const existingSession = this.sessionManager.getSessions().find(s => s.user.username === username);
        if (existingSession) {
            this.switchSession(existingSession.id);
            return Result.success({ sessionId: existingSession.id, username }, `Switched to existing session for '${username}'.`);
        }

        const currentSession = this.sessionManager.getCurrentSession();
        if (currentSession && currentSession.id !== 'sess_system') {
            this.sessionManager.suspendSession(currentSession.id);
            EventBus.emit('session.suspended', { severity: 'Info', source: 'SessionService', message: `Session ${currentSession.id} suspended.`, data: { sessionId: currentSession.id, username: currentSession.user.username } });
        }

        const sessionId = this.sessionManager.createSession(user);
        this.sessionManager.activateSession(sessionId);
        
        // Persist last active user
        if (this.registry) {
            const fileService = this.registry.get('FileService');
            if (fileService) {
                try {
                    fileService.writeFile('/system/lastUser.json', JSON.stringify({ lastActiveUser: username }), { context: { role: 'SYSTEM' } });
                } catch (e) {
                    console.warn('[SessionService] Failed to persist last active user:', e);
                }
            }
        }

        EventBus.emit('session.started', { severity: 'Info', source: 'SessionService', message: `Session ${sessionId} started for ${username}.`, data: { sessionId, username } });
        return Result.success({ sessionId, username }, `Session started for '${username}'.`);
    }

    getLastActiveUser() {
        if (this.registry) {
            const fileService = this.registry.get('FileService');
            if (fileService && fileService.exists('/system/lastUser.json')) {
                try {
                    const data = fileService.readFile('/system/lastUser.json', { context: { role: 'SYSTEM' } });
                    const parsed = JSON.parse(data);
                    return parsed.lastActiveUser || null;
                } catch (e) {
                    console.warn('[SessionService] Failed to read last active user:', e);
                }
            }
        }
        return null;
    }

    switchSession(sessionId) {
        const targetSession = this.sessionManager.getSessions().find(s => s.id === sessionId);
        if (!targetSession) throw new Error(`Session ${sessionId} not found.`);

        const currentSession = this.sessionManager.getCurrentSession();
        if (currentSession && currentSession.id === sessionId) {
            return; // Already active
        }

        if (currentSession && currentSession.id !== 'sess_system') {
            this.sessionManager.suspendSession(currentSession.id);
            EventBus.emit('session.suspended', { severity: 'Info', source: 'SessionService', message: `Session ${currentSession.id} suspended.`, data: { sessionId: currentSession.id, username: currentSession.user.username } });
        }

        this.sessionManager.resumeSession(sessionId);
        EventBus.emit('session.resumed', { severity: 'Info', source: 'SessionService', message: `Session ${sessionId} resumed.`, data: { sessionId, username: targetSession.user.username } });
    }

    _bindEvent(eventName, callback) {
        const handler = (payload) => {
            const { sessionId } = payload.data || {};
            if (sessionId === this._getCurrentSessionId()) {
                callback(payload.data || payload);
            }
        };
        EventBus.on(eventName, handler);
        return () => EventBus.off(eventName, handler);
    }

    onStarted(callback) { return this._bindEvent('session.started', callback); }
    onEnded(callback) { return this._bindEvent('session.ended', callback); }
    onLocked(callback) { return this._bindEvent('session.locked', callback); }
    onUnlocked(callback) { return this._bindEvent('session.unlocked', callback); }
    onSuspended(callback) { return this._bindEvent('session.suspended', callback); }
    onResumed(callback) { return this._bindEvent('session.resumed', callback); }

    _getCurrentSessionId() {
        const currentSession = this.sessionManager.getCurrentSession();
        return currentSession ? currentSession.id : null;
    }

    suspendActiveSession() {
        const currentSession = this.sessionManager.getCurrentSession();
        if (currentSession && currentSession.id !== 'sess_system') {
            this.sessionManager.suspendSession(currentSession.id);
            EventBus.emit('session.suspended', { severity: 'Info', source: 'SessionService', message: `Session ${currentSession.id} suspended.`, data: { sessionId: currentSession.id, username: currentSession.user.username } });
        }
    }

    lock(sessionId = null) {
        const targetId = sessionId || (this.sessionManager.getCurrentSession() ? this.sessionManager.getCurrentSession().id : null);
        if (!targetId) return Result.failure('SESSION_NOT_FOUND', 'No active user session to lock.');

        const session = this.sessionManager.getSessions().find(s => s.id === targetId);
        const username = session ? session.user.username : 'Unknown';

        const locked = this.sessionManager.lockSession(targetId);
        if (locked) {
            EventBus.emit('session.locked', { severity: 'Info', source: 'SessionService', message: `User session locked.`, data: { sessionId: targetId, username } });
            return Result.success({ sessionId: targetId, username }, 'User session locked successfully.');
        }
        return Result.failure('LOCK_FAILED', 'Failed to lock user session.');
    }

    unlock(sessionId = null) {
        const targetId = sessionId || (this.sessionManager.getCurrentSession() ? this.sessionManager.getCurrentSession().id : null);
        if (!targetId) return Result.failure('SESSION_NOT_FOUND', 'No active user session to unlock.');

        const session = this.sessionManager.getSessions().find(s => s.id === targetId);
        const username = session ? session.user.username : 'Unknown';

        const unlocked = this.sessionManager.unlockSession(targetId);
        if (unlocked) {
            EventBus.emit('session.unlocked', { severity: 'Info', source: 'SessionService', message: `User session unlocked.`, data: { sessionId: targetId, username } });
            return Result.success({ sessionId: targetId, username }, 'User session unlocked successfully.');
        }
        return Result.failure('UNLOCK_FAILED', 'Failed to unlock user session.');
    }

    isLocked() {
        return this.sessionManager.isLocked();
    }

    logout(sessionId = null) {
        const targetId = sessionId || (this.sessionManager.getCurrentSession() ? this.sessionManager.getCurrentSession().id : null);
        if (!targetId) return Result.failure('SESSION_NOT_FOUND', 'No active user session to log out.');

        const session = this.sessionManager.getSessions().find(s => s.id === targetId);
        const username = session ? session.user.username : 'Unknown';

        this.sessionManager.endSession(targetId);
        return Result.success({ sessionId: targetId, username }, `Session ended for '${username}'.`);
    }
}
