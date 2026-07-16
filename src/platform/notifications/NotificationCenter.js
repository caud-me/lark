import { EventBus } from '../../kernel/SystemEventBus.js';

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
        
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'lde-toast-container';
        this.container.appendChild(this.toastContainer);

        this.trayPanel = document.createElement('div');
        this.trayPanel.className = 'lde-notification-tray';
        this.trayPanel.style.display = 'none';
        this.container.appendChild(this.trayPanel);
        
        this._bindEvents();
    }

    _bindEvents() {
        EventBus.on('notification.created', (payload) => {
            if (payload.data) {
                this.renderToast(payload.data);
                if (this.trayPanel.style.display === 'block') this.refreshTray();
            }
        });
        
        EventBus.on('notification.dismissed', () => {
            if (this.trayPanel.style.display === 'block') this.refreshTray();
        });

        EventBus.on('notification.cleared_all', () => {
            if (this.trayPanel.style.display === 'block') this.refreshTray();
        });

        EventBus.on('taskbar:toggleNotifications', () => {
            this.trayPanel.style.display = this.trayPanel.style.display === 'none' ? 'block' : 'none';
            if (this.trayPanel.style.display === 'block') this.refreshTray();
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

        if (notification.progress !== null) {
            const progress = document.createElement('progress');
            progress.className = 'lde-toast-progress';
            progress.max = 100;
            progress.value = notification.progress;
            progress.style.width = '100%';
            toast.appendChild(progress);
        }

        if (notification.actions && notification.actions.length > 0) {
            const btnGroup = document.createElement('div');
            btnGroup.style.display = 'flex';
            btnGroup.style.gap = '4px';
            btnGroup.style.marginTop = '8px';
            notification.actions.forEach(action => {
                const btn = document.createElement('button');
                btn.className = 'lde-btn lde-btn-small';
                btn.textContent = action.label;
                btn.onclick = (e) => {
                    e.stopPropagation();
                    EventBus.emit(`notification.action.${action.id}`, { notification });
                    toast.remove();
                    const ns = this.registry.get('NotificationService');
                    if (ns) ns.dismiss(notification.id);
                };
                btnGroup.appendChild(btn);
            });
            toast.appendChild(btnGroup);
        }

        this.toastContainer.appendChild(toast);

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

    refreshTray() {
        this.trayPanel.innerHTML = '';
        const ns = this.registry.get('NotificationService');
        if (!ns) return;

        const header = document.createElement('div');
        header.className = 'lde-tray-header';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.padding = '12px';
        header.style.borderBottom = '1px solid var(--lde-border)';
        
        const title = document.createElement('div');
        title.style.fontWeight = 'bold';
        title.textContent = 'Notifications';
        
        const clearBtn = document.createElement('button');
        clearBtn.className = 'lde-btn';
        clearBtn.textContent = 'Clear All';
        clearBtn.onclick = () => ns.clearAll();

        header.appendChild(title);
        header.appendChild(clearBtn);
        this.trayPanel.appendChild(header);

        const list = document.createElement('div');
        list.className = 'lde-tray-list';
        list.style.padding = '12px';
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        list.style.gap = '8px';
        list.style.overflowY = 'auto';
        list.style.maxHeight = '400px';

        const notifications = ns.getNotifications();
        if (notifications.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'No new notifications.';
            empty.style.color = 'var(--text-secondary)';
            empty.style.fontSize = '12px';
            list.appendChild(empty);
        } else {
            // Group by appId
            const groups = {};
            notifications.forEach(n => {
                if (!groups[n.appId]) groups[n.appId] = [];
                groups[n.appId].push(n);
            });

            for (const [appId, groupNotifs] of Object.entries(groups)) {
                const groupHeader = document.createElement('div');
                groupHeader.textContent = appId;
                groupHeader.style.fontWeight = 'bold';
                groupHeader.style.fontSize = '11px';
                groupHeader.style.marginTop = '8px';
                groupHeader.style.color = 'var(--text-secondary)';
                list.appendChild(groupHeader);

                groupNotifs.reverse().forEach(n => {
                    const item = document.createElement('div');
                    item.className = 'lde-tray-item';
                    item.style.backgroundColor = 'var(--lde-bg-surface-elevated)';
                    item.style.padding = '8px';
                    item.style.borderRadius = 'var(--lde-radius-sm)';
                    item.style.borderLeft = n.type === 'error' ? '3px solid #ff4444' : n.type === 'warning' ? '3px solid #ffbb33' : '3px solid var(--lde-accent)';
                    
                    const itemTitle = document.createElement('div');
                    itemTitle.style.fontWeight = 'bold';
                    itemTitle.style.fontSize = '12px';
                    itemTitle.textContent = n.title;

                    const itemMsg = document.createElement('div');
                    itemMsg.style.fontSize = '11px';
                    itemMsg.style.color = 'var(--text-secondary)';
                    itemMsg.textContent = n.message;

                    item.appendChild(itemTitle);
                    item.appendChild(itemMsg);

                    const closeBtn = document.createElement('button');
                    closeBtn.textContent = '×';
                    closeBtn.style.position = 'absolute';
                    closeBtn.style.right = '8px';
                    closeBtn.style.top = '8px';
                    closeBtn.style.background = 'transparent';
                    closeBtn.style.border = 'none';
                    closeBtn.style.color = 'var(--text-secondary)';
                    closeBtn.style.cursor = 'pointer';
                    closeBtn.onclick = () => ns.dismiss(n.id);
                    
                    item.style.position = 'relative';
                    item.appendChild(closeBtn);

                    list.appendChild(item);
                });
            }
        }
        this.trayPanel.appendChild(list);
    }
}
