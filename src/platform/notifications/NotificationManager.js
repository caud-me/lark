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
        this.notifications = new Map();
        this.nextId = 1;
    }

    notify(options) {
        const id = `notif-${this.nextId++}`;
        const notification = {
            id,
            title: options.title || 'Notification',
            message: options.message || '',
            type: options.type || 'info', // info, warning, error
            appId: options.appId || 'system',
            progress: options.progress !== undefined ? options.progress : null,
            actions: options.actions || null,
            timestamp: new Date().toISOString()
        };
        
        this.notifications.set(id, notification);
        return notification;
    }

    dismiss(id) {
        if (this.notifications.has(id)) {
            this.notifications.delete(id);
            return true;
        }
        return false;
    }

    clearAll() {
        const count = this.notifications.size;
        this.notifications.clear();
        return count;
    }

    getNotifications() {
        return Array.from(this.notifications.values());
    }
}
