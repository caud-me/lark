import { EventBus } from '../../1-kernel/SystemEventBus.js';

/**
 * NotificationManager
 *
 * Responsibility:
 * Manages notification state and history.
 *
 * Does NOT:
 * - Render notifications to the screen
 */
export class NotificationManager {
    constructor() {
        this.sessions = new Map(); // sessionId -> Map(notificationId -> Notification)
        this.nextId = 1;

        EventBus.on('session.ended', (payload) => {
            const { sessionId } = payload.data || {};
            if (sessionId) {
                this.sessions.delete(sessionId);
            }
        });
    }

    _getSessionNotifications(sessionId) {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, new Map());
        }
        return this.sessions.get(sessionId);
    }

    notify(sessionId, options) {
        if (!sessionId) return null;

        const notifications = this._getSessionNotifications(sessionId);

        if (notifications.size >= 50) {
            const firstKey = notifications.keys().next().value;
            notifications.delete(firstKey);
        }

        const id = `notif-${this.nextId++}`;
        const notification = {
            id,
            sessionId,
            title: options.title || 'Notification',
            message: options.message || '',
            type: options.type || 'info', // info, warning, error
            appId: options.appId || 'system',
            icon: options.icon || '&#xE71D;',
            sourceProcessId: options.sourceProcessId || null,
            progress: options.progress !== undefined ? options.progress : null,
            actions: options.actions || null,
            timestamp: new Date().toISOString()
        };
        
        notifications.set(id, notification);
        return notification;
    }

    dismiss(sessionId, id) {
        if (!sessionId) return false;
        const notifications = this._getSessionNotifications(sessionId);
        if (notifications.has(id)) {
            notifications.delete(id);
            return true;
        }
        return false;
    }

    clearAll(sessionId) {
        if (!sessionId) return 0;
        const notifications = this._getSessionNotifications(sessionId);
        const count = notifications.size;
        notifications.clear();
        return count;
    }

    getNotifications(sessionId) {
        if (!sessionId) return [];
        const notifications = this._getSessionNotifications(sessionId);
        return Array.from(notifications.values());
    }
}
