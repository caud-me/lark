import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * SessionService
 *
 * Responsibility:
 * Exposes a public API for user authentication and session management.
 *
 * Does NOT:
 * - Lock the input explicitly
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
            throw new Error(`User ${username} not found.`);
        }
        
        const existingSession = this.sessionManager.getSessions().find(s => s.user.username === username);
        if (existingSession) {
            this.switchSession(existingSession.id);
            return existingSession.id;
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
        return sessionId;
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

    suspendActiveSession() {
        const currentSession = this.sessionManager.getCurrentSession();
        if (currentSession && currentSession.id !== 'sess_system') {
            this.sessionManager.suspendSession(currentSession.id);
            EventBus.emit('session.suspended', { severity: 'Info', source: 'SessionService', message: `Session ${currentSession.id} suspended.`, data: { sessionId: currentSession.id, username: currentSession.user.username } });
        }
    }

    lock(sessionId = null) {
        const targetId = sessionId || (this.sessionManager.getCurrentSession() ? this.sessionManager.getCurrentSession().id : null);
        if (!targetId) return false;

        const session = this.sessionManager.getSessions().find(s => s.id === targetId);
        const username = session ? session.user.username : 'Unknown';

        const locked = this.sessionManager.lockSession(targetId);
        if (locked) {
            EventBus.emit('session.locked', { severity: 'Info', source: 'SessionService', message: `User session locked.`, data: { sessionId: targetId, username } });
        }
        return locked;
    }

    unlock(sessionId = null) {
        const targetId = sessionId || (this.sessionManager.getCurrentSession() ? this.sessionManager.getCurrentSession().id : null);
        if (!targetId) return false;

        const session = this.sessionManager.getSessions().find(s => s.id === targetId);
        const username = session ? session.user.username : 'Unknown';

        const unlocked = this.sessionManager.unlockSession(targetId);
        if (unlocked) {
            EventBus.emit('session.unlocked', { severity: 'Info', source: 'SessionService', message: `User session unlocked.`, data: { sessionId: targetId, username } });
        }
        return unlocked;
    }

    isLocked() {
        return this.sessionManager.isLocked();
    }

    logout(sessionId = null) {
        const targetId = sessionId || (this.sessionManager.getCurrentSession() ? this.sessionManager.getCurrentSession().id : null);
        if (!targetId) return;

        const session = this.sessionManager.getSessions().find(s => s.id === targetId);
        const username = session ? session.user.username : 'Unknown';

        EventBus.emit('session.ended', { severity: 'Info', source: 'SessionService', message: `Session ${targetId} ended.`, data: { sessionId: targetId, username } });
        this.sessionManager.endSession(targetId);
    }
}
