import { EventBus } from '../kernel/SystemEventBus.js';

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

    notify(title, message, type = 'info') {
        const notif = this.notificationManager.notify({ title, message, type });
        EventBus.emit('notification.created', {
            severity: 'Info',
            source: 'NotificationService',
            message: `Notification created: ${title}`,
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

    getNotifications() {
        return this.notificationManager.getNotifications();
    }
}
