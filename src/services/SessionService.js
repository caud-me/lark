import { EventBus } from '../kernel/SystemEventBus.js';

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
    constructor(sessionManager, userManager) {
        this.sessionManager = sessionManager;
        this.userManager = userManager;
    }

    getCurrentSession() {
        return this.sessionManager.getCurrentSession();
    }

    login(username) {
        const user = this.userManager.getUser(username);
        if (!user) {
            throw new Error(`User ${username} not found.`);
        }
        this.sessionManager.startSession(user);
        EventBus.emit('user.login', { severity: 'Info', source: 'SessionService', message: `User ${username} logged in.` });
    }

    lock() {
        const locked = this.sessionManager.lockSession();
        if (locked) {
            EventBus.emit('user.locked', { severity: 'Info', source: 'SessionService', message: `User session locked.` });
        }
        return locked;
    }

    unlock() {
        const unlocked = this.sessionManager.unlockSession();
        if (unlocked) {
            EventBus.emit('user.unlocked', { severity: 'Info', source: 'SessionService', message: `User session unlocked.` });
        }
        return unlocked;
    }

    isLocked() {
        return this.sessionManager.isLocked();
    }

    logout() {
        EventBus.emit('user.logout', { severity: 'Info', source: 'SessionService', message: `User logged out.` });
        this.sessionManager.endSession();
    }
}
