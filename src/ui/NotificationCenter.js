import { EventBus } from '../kernel/SystemEventBus.js';

/**
 * NotificationCenter
 *
 * Responsibility:
 * Renders toast notifications and the notification history panel.
 *
 * Does NOT:
 * - Manage global notification state
 */
export class NotificationCenter {
    constructor(registry) {
        this.registry = registry;
        this.container = document.createElement('div');
        this.container.className = 'lde-notification-center';
        
        this._bindEvents();
    }

    _bindEvents() {
        EventBus.on('notification.created', (payload) => {
            if (payload.data) {
                this.renderToast(payload.data);
            }
        });
    }

    renderToast(notification) {
        const toast = document.createElement('div');
        toast.className = 'lde-toast';
        
        if (notification.type === 'warning') toast.classList.add('warning');
        if (notification.type === 'error') toast.classList.add('error');

        const title = document.createElement('div');
        title.className = 'lde-toast-title';
        title.textContent = notification.title;

        const msg = document.createElement('div');
        msg.className = 'lde-toast-msg';
        msg.textContent = notification.message;

        toast.appendChild(title);
        toast.appendChild(msg);
        this.container.appendChild(toast);

        // Click to dismiss
        toast.onclick = () => {
            toast.remove();
            const ns = this.registry.get('NotificationService');
            if (ns) ns.dismiss(notification.id);
        };

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
}
