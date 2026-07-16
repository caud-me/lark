import { CapabilityProvider } from './CapabilityProvider.js';

/**
 * NotificationCapabilityProvider
 *
 * Responsibility:
 * Adapts the internal NotificationService for public OS consumption.
 */
export class NotificationCapabilityProvider extends CapabilityProvider {
    constructor(notificationService) {
        super();
        this.notificationService = notificationService;
    }

    getName() {
        return 'NotificationCapabilityProvider';
    }

    show(message, title = 'Notification', options = {}) {
        return this.notificationService.show(message, title, options);
    }
}
