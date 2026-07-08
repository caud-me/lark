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

    getNotifications() {
        return Array.from(this.notifications.values());
    }
}
