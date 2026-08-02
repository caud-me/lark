import { EventBus } from '../../1-kernel/SystemEventBus.js';

/**
 * NotificationService
 *
 * STABLE PUBLIC PLATFORM API (LDE 27.7.9)
 *
 * Responsibility:
 * Exposes safe public APIs for applications and system subsystems to post and dismiss OS notifications.
 * Emits strictly owned `notification.changed` semantic events for NotificationSurface rendering.
 *
 * Does NOT:
 * - Render visual toast or notification center DOM elements directly (delegated to NotificationSurface)
 * - Persist notification buffers across sessions (delegated to NotificationManager)
 */
export class NotificationService {
    constructor(notificationManager, registry) {
        this.notificationManager = notificationManager;
        this.registry = registry;
    }

    _getCurrentSessionId() {
        if (!this.registry) return null;
        const sessionService = this.registry.get('SessionService');
        if (!sessionService) return null;
        const session = sessionService.getCurrentSession();
        return session ? session.id : null;
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
        const notif = this.notificationManager.notify(this._getCurrentSessionId(), options);
        if (notif) {
            EventBus.emit('notification.created', {
                severity: 'Info',
                source: 'NotificationService',
                message: `Notification created: ${notif.title}`,
                data: notif
            });

            // Route audio playback through KernelAudioAPI
            if (this.registry) {
                try {
                    const audioApi = this.registry.get('KernelAudioAPI');
                    if (audioApi && typeof audioApi.playSound === 'function') {
                        audioApi.playSound('notification');
                    }
                } catch (e) {
                    // Graceful audio fallback
                }
            }
        }
        return notif;
    }

    dismiss(id) {
        const dismissed = this.notificationManager.dismiss(this._getCurrentSessionId(), id);
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
        const count = this.notificationManager.clearAll(this._getCurrentSessionId());
        EventBus.emit('notification.cleared_all', {
            severity: 'Info',
            source: 'NotificationService',
            message: `Cleared ${count} notifications.`
        });
        return count;
    }

    getNotifications() {
        return this.notificationManager.getNotifications(this._getCurrentSessionId());
    }

    /**
     * Subscribes to notification events for the current session.
     * @param {Function} callback 
     * @returns {Function} Unsubscribe function
     */
    onChange(callback) {
        const handler = (payload, eventName) => {
            const { data } = payload;
            if (data && data.sessionId === this._getCurrentSessionId()) {
                let type = 'changed';
                if (eventName === 'notification.created') type = 'created';
                else if (eventName === 'notification.dismissed') type = 'dismissed';
                else if (eventName === 'notification.cleared_all') type = 'cleared';
                
                callback({ type });
            }
        };

        const createHandler = (payload) => handler(payload, 'notification.created');
        const dismissHandler = (payload) => handler(payload, 'notification.dismissed');
        const clearHandler = (payload) => handler(payload, 'notification.cleared_all');

        EventBus.on('notification.created', createHandler);
        EventBus.on('notification.dismissed', dismissHandler);
        EventBus.on('notification.cleared_all', clearHandler);

        return () => {
            EventBus.off('notification.created', createHandler);
            EventBus.off('notification.dismissed', dismissHandler);
            EventBus.off('notification.cleared_all', clearHandler);
        };
    }
}
