import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * NotificationService
 *
 * Responsibility:
 * Exposes a public API for dispatching system notifications.
 *
 * Does NOT:
 * - Manage notification history
 */
export class NotificationService {
    constructor(notificationManager) {
        this.notificationManager = notificationManager;
    }

    /**
     * Dispatches a system notification.
     * @param {Object} options
     * @param {string} options.title
     * @param {string} options.message
     * @param {string} [options.type] - 'info' | 'warning' | 'error'
     * @param {string} [options.appId]
     */
    notify(options) {
        const notif = this.notificationManager.notify(options);
        EventBus.emit('notification.created', {
            severity: 'Info',
            source: 'NotificationService',
            message: `Notification created: ${notif.title}`,
            data: notif
        });
        return notif;
    }

    dismiss(id) {
        const dismissed = this.notificationManager.dismiss(id);
        if (dismissed) {
            EventBus.emit('notification.dismissed', {
                severity: 'Info',
                source: 'NotificationService',
                message: `Notification dismissed: ${id}`,
                data: { id }
            });
        }
        return dismissed;
    }

    clearAll() {
        const count = this.notificationManager.clearAll();
        EventBus.emit('notification.cleared_all', {
            severity: 'Info',
            source: 'NotificationService',
            message: `Cleared ${count} notifications.`
        });
        return count;
    }

    getNotifications() {
        return this.notificationManager.getNotifications();
    }
}
