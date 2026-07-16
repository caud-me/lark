import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * SessionManager
 *
 * Responsibility:
 * Maintains the current user session state.
 *
 * Does NOT:
 * - Enforce input policies or screen locking
 * - Call upward into Services (that would violate the layer model)
 */
export class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.activeSessionId = null;
        this._bindEvents();
    }

    _bindEvents() {
        EventBus.on('process.started', (payload) => {
            const currentSession = this.getCurrentSession();
            if (currentSession && payload.data && payload.data.process && payload.data.process.appId) {
                const appId = payload.data.process.appId;
                // Keep the recent apps list capped at 5, most recent first
                currentSession.recentlyLaunchedApps = currentSession.recentlyLaunchedApps.filter(id => id !== appId);
                currentSession.recentlyLaunchedApps.unshift(appId);
                if (currentSession.recentlyLaunchedApps.length > 5) {
                    currentSession.recentlyLaunchedApps.pop();
                }
            }
        });

        EventBus.on('window.focused', (payload) => {
            const currentSession = this.getCurrentSession();
            if (currentSession && payload.data && payload.data.appId) {
                currentSession.lastFocusedApp = payload.data.appId;
            }
        });

        const resetIdle = () => {
            const currentSession = this.getCurrentSession();
            if (currentSession) {
                if (currentSession.isIdle) {
                    currentSession.isIdle = false;
                    EventBus.emit('session.active', { severity: 'Info', source: 'SessionManager', message: 'Session is now active.' });
                }
                currentSession.lastActive = Date.now();
            }
        };

        window.addEventListener('mousemove', resetIdle, { passive: true });
        window.addEventListener('keydown', resetIdle, { passive: true });
        window.addEventListener('click', resetIdle, { passive: true });

        setInterval(() => {
            const currentSession = this.getCurrentSession();
            if (currentSession && !currentSession.locked && !currentSession.isIdle) {
                const idleTime = Date.now() - currentSession.lastActive;
                if (idleTime > 5 * 60 * 1000) { // 5 minutes
                    currentSession.isIdle = true;
                    EventBus.emit('session.idle', { severity: 'Info', source: 'SessionManager', message: 'Session is now idle.' });
                }
            }
        }, 10000);
    }

    startSystemSession() {
        const id = `sess_system`;
        const session = {
            id,
            user: { username: 'system', homeDirectory: '/', role: 'SYSTEM' },
            userRole: 'SYSTEM',
            startTime: new Date().toISOString(),
            locked: false,
            status: 'ACTIVE',
            recentlyLaunchedApps: [],
            lastFocusedApp: null,
            lastActive: Date.now(),
            isIdle: false
        };
        
        this.sessions.set(id, session);
        this.activeSessionId = id;
        EventBus.emit('session.started', { severity: 'Info', source: 'SessionManager', message: 'System session established.' });
    }

    createSession(user) {
        const id = `sess_${Date.now()}`;
        const session = {
            id,
            user,
            userRole: user.role || 'USER',
            startTime: new Date().toISOString(),
            locked: false,
            status: 'CREATED', // CREATED, ACTIVE, SUSPENDED
            recentlyLaunchedApps: [],
            lastFocusedApp: null,
            lastActive: Date.now(),
            isIdle: false
        };
        
        this.sessions.set(id, session);
        return id;
    }

    activateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        this.activeSessionId = sessionId;
        session.status = 'ACTIVE';
        session.lastActive = Date.now();
        session.isIdle = false;
        
        EventBus.emit('session.activated', { severity: 'Info', source: 'SessionManager', message: `Session ${sessionId} activated.` });
        return true;
    }

    suspendSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        session.status = 'SUSPENDED';
        if (this.activeSessionId === sessionId) {
            this.activeSessionId = null;
        }

        EventBus.emit('session.suspended', { severity: 'Info', source: 'SessionManager', message: `Session ${sessionId} suspended.` });
        return true;
    }

    resumeSession(sessionId) {
        return this.activateSession(sessionId);
    }

    lockSession(sessionId = this.activeSessionId) {
        const session = this.sessions.get(sessionId);
        if (!session || session.user.username === 'system' || session.locked) {
            return false;
        }

        session.locked = true;
        EventBus.emit('session.locked', { severity: 'Info', source: 'SessionManager', message: `Session ${sessionId} locked.` });
        return true;
    }

    unlockSession(sessionId = this.activeSessionId) {
        const session = this.sessions.get(sessionId);
        if (!session || session.user.username === 'system' || !session.locked) {
            return false;
        }

        session.locked = false;
        EventBus.emit('session.unlocked', { severity: 'Info', source: 'SessionManager', message: `Session ${sessionId} unlocked.` });
        return true;
    }

    isLocked() {
        const session = this.getCurrentSession();
        return !!(session && session.locked);
    }

    endSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            this.sessions.delete(sessionId);
            if (this.activeSessionId === sessionId) {
                this.activeSessionId = null;
            }
            EventBus.emit('session.ended', { severity: 'Info', source: 'SessionManager', message: `Session ${sessionId} ended.` });
            
            if (!this.activeSessionId && this.sessions.has('sess_system')) {
                this.activateSession('sess_system');
            }
        }
    }

    getCurrentSession() {
        return this.activeSessionId ? this.sessions.get(this.activeSessionId) : null;
    }

    getSessions() {
        return Array.from(this.sessions.values());
    }
}
