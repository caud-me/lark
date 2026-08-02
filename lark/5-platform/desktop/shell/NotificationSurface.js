import { ShellComponent } from './ShellComponent.js';
import { EventBus } from '../../../1-kernel/SystemEventBus.js';

/**
 * Injects isolated notification engine style blocks into the document head safely.
 */
function injectNotificationStyles() {
    const styleId = 'shell-notification-surface-styles';
    if (document.getElementById(styleId)) return;

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
        .shell-notification-center {
            position: fixed;
            bottom: 48px;
            right: 16px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 16px;
            z-index: 99995;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            pointer-events: none;
            user-select: none;
        }

        .shell-toast-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: auto;
        }

        .shell-toast {
            background-color: #151515;
            border: 1px solid #202020;
            border-radius: 12px;
            padding: 12px;
            width: 320px;
            color: #ffffff;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            transition: transform var(--lde-window-transition-duration, 0.2s) ease, opacity var(--lde-window-transition-duration, 0.2s) ease;
        }

        html.lde-motion-disabled .shell-toast {
            transition: none !important;
        }

        .shell-toast.warning {
            border-left: 3px solid var(--lde-warning);
        }

        .shell-toast.error {
            border-left: 3px solid var(--lde-danger);
        }

        .shell-toast-title {
            font-size: 13px;
            font-weight: 600;
            color: #ffffff;
            margin-top: 4px;
            margin-bottom: 2px;
        }

        .shell-toast-msg {
            font-size: 12px;
            color: #aaa;
            line-height: 1.4;
        }

        .shell-toast-progress {
            all: initial;
            display: block;
            width: 100%;
            height: 3px;
            background-color: #80808010;
            border-radius: 2px;
            overflow: hidden;
            margin-top: 8px;
        }

        .shell-toast-progress::-webkit-progress-bar {
            background-color: #80808010;
        }

        .shell-toast-progress::-webkit-progress-value {
            background-color: #ffffff;
        }

        .shell-notification-tray {
            background-color: #131313;
            border: 1px solid #1c1c1c;
            border-radius: 16px;
            width: 360px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
            pointer-events: auto;
            overflow: hidden;
            backdrop-filter: var(--lde-glass-backdrop-filter);
            -webkit-backdrop-filter: var(--lde-glass-backdrop-filter);
        }

        .shell-tray-header {
            border-bottom: 1px solid #202020;
            background-color: #101010;
        }

        .shell-tray-list {
            overflow-y: auto;
            max-height: 420px;
            background-color: #131313;
        }

        .shell-tray-item {
            background-color: #181818;
            border: 1px solid #222222;
            transition: background-color 0.15s ease;
        }

        .shell-tray-item:hover {
            background-color: #1c1c1c;
        }

        .shell-notification-btn {
            border: none;
            background-color: #80808020;
            padding: 6px 12px;
            border-radius: 4px;
            font-family: inherit;
            font-size: 11px;
            font-weight: 600;
            color: #ffffff;
            cursor: pointer;
            transition: background-color 0.15s ease;
        }

        .shell-notification-btn:hover {
            background-color: #80808040;
        }

        .shell-notification-close {
            border: none;
            background: transparent;
            color: #80808080;
            font-size: 16px;
            cursor: pointer;
            padding: 4px;
            line-height: 1;
            transition: color 0.15s ease;
        }

        .shell-notification-close:hover {
            color: #ffffff;
        }

        .layout-h { display: flex; flex-direction: row; }
        .layout-v { display: flex; flex-direction: column; }
        .flex-align-center { align-items: center; }
        .flex-space-between { justify-content: space-between; }
        .flex-gap-2 { gap: 2px; }
        .flex-gap-4 { gap: 4px; }
        .flex-gap-6 { gap: 6px; }
        .flex-gap-8 { gap: 8px; }
        .padding-8 { padding: 8px; }
        .padding-12 { padding: 12px; }

        small {
            font-size: 11px;
            color: #888888;
        }
    `;
    document.head.appendChild(styleElement);
}

const decodeFontEntity = (entity) => {
    let code = 0xE71D; // Default fallback icon
    if (entity) {
        if (entity.startsWith('&#x')) {
            const hexVal = entity.substring(3, entity.length - 1);
            code = parseInt(hexVal, 16);
        } else if (entity.startsWith('&#')) {
            const decVal = entity.substring(2, entity.length - 1);
            code = parseInt(decVal, 10);
        }
    }
    return String.fromCodePoint(code);
};

export class NotificationSurface extends ShellComponent {
    initialize(registry, environment) {
        super.initialize(registry, environment);
        
        // Setup stylesheet blocks immediately inside architecture trees
        injectNotificationStyles();
        
        this.container = document.createElement('div');
        this.container.className = 'shell-notification-center';
        
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'shell-toast-container';
        this.container.appendChild(this.toastContainer);

        this.trayPanel = document.createElement('div');
        this.trayPanel.className = 'shell-notification-tray';
        this.trayPanel.style.display = 'none';
        this.container.appendChild(this.trayPanel);

        this.element = this.container; 
        
        this._onNotificationCreated = (payload) => {
            if (payload.data) {
                this.renderToast(payload.data);
                if (this.trayPanel.style.display === 'block') this.refreshTray();
            }
        };
        
        this._onNotificationDismissed = () => {
            if (this.trayPanel.style.display === 'block') this.refreshTray();
        };

        this._onNotificationClearedAll = () => {
            if (this.trayPanel.style.display === 'block') this.refreshTray();
        };

        this._onToggleNotifications = () => {
            this.trayPanel.style.display = this.trayPanel.style.display === 'none' ? 'block' : 'none';
            if (this.trayPanel.style.display === 'block') this.refreshTray();
        };
    }

    resume() {
        const notifService = this.registry.get('NotificationService');
        if (notifService) {
            this.unsubNotif = notifService.onChange((event) => {
                if (event.type === 'created') this._onNotificationCreated({ data: event.data });
                if (event.type === 'dismissed') this._onNotificationDismissed({ data: event.data });
                if (event.type === 'cleared') this._onNotificationClearedAll();
            });
        }
        EventBus.on('sys.shell.notifications.toggle', this._onToggleNotifications);
    }

    suspend() {
        if (this.unsubNotif) {
            this.unsubNotif();
            this.unsubNotif = null;
        }
        if (typeof EventBus.off === 'function') {
            EventBus.off('sys.shell.notifications.toggle', this._onToggleNotifications);
        }
    }

    renderToast(notification) {
        const toast = document.createElement('div');
        toast.className = 'shell-toast';
        
        if (notification.type === 'warning') toast.classList.add('warning');
        if (notification.type === 'error') toast.classList.add('error');

        const headerBox = document.createElement('div');
        headerBox.className = 'layout-h flex-align-center flex-gap-8';
        headerBox.style.marginBottom = '4px';

        const iconDiv = document.createElement('div');
        iconDiv.style.display = 'flex';
        iconDiv.style.alignItems = 'center';
        iconDiv.style.fontFamily = "'Segoe MDL2 Assets', 'sfi'";
        iconDiv.style.fontSize = '12px';
        iconDiv.textContent = decodeFontEntity(notification.icon);

        const appLabel = document.createElement('div');
        appLabel.className = 'shell-fd-small-text shell-subtext';
        appLabel.textContent = notification.appId;

        headerBox.appendChild(iconDiv);
        headerBox.appendChild(appLabel);

        const title = document.createElement('div');
        title.className = 'shell-toast-title';
        title.textContent = notification.title;

        const msg = document.createElement('div');
        msg.className = 'shell-toast-msg';
        msg.textContent = notification.message;

        toast.appendChild(headerBox);
        toast.appendChild(title);
        toast.appendChild(msg);

        if (notification.progress !== null) {
            const progress = document.createElement('progress');
            progress.className = 'shell-toast-progress';
            progress.max = 100;
            progress.value = notification.progress;
            toast.appendChild(progress);
        }

        if (notification.actions && notification.actions.length > 0) {
            const btnGroup = document.createElement('div');
            btnGroup.className = 'layout-h flex-gap-4';
            btnGroup.style.marginTop = '8px';
            
            for (let i = 0; i < notification.actions.length; i++) {
                const action = notification.actions[i];
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'shell-notification-btn';
                btn.textContent = action.label;
                btn.onclick = (e) => {
                    e.stopPropagation();
                    EventBus.emit(`notification.action.${action.id}`, { notification });
                    toast.remove();
                    const ns = this.registry.get('NotificationService');
                    if (ns) ns.dismiss(notification.id);
                };
                btnGroup.appendChild(btn);
            }
            toast.appendChild(btnGroup);
        }

        this.toastContainer.appendChild(toast);

        toast.onclick = () => {
            toast.remove();
            const ns = this.registry.get('NotificationService');
            if (ns) ns.dismiss(notification.id);
        };

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
        header.className = 'shell-tray-header layout-h flex-space-between flex-align-center padding-12';
        
        const title = document.createElement('div');
        title.className = 'shell-tray-title';
        title.textContent = 'Notifications';
        
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'shell-notification-btn';
        clearBtn.textContent = 'Clear all';
        clearBtn.onclick = () => ns.clearAll();

        header.appendChild(title);
        header.appendChild(clearBtn);
        this.trayPanel.appendChild(header);

        const list = document.createElement('div');
        list.className = 'shell-tray-list layout-v flex-gap-8 padding-12';

        const notifications = ns.getNotifications();
        if (notifications.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'shell-fd-small-text shell-muted-text';
            empty.style.textAlign = 'center';
            empty.style.padding = '24px 0';
            empty.textContent = 'No new notifications.';
            list.appendChild(empty);
        } else {
            for (let i = notifications.length - 1; i >= 0; i--) {
                const n = notifications[i];
                const item = document.createElement('div');
                item.className = `shell-tray-item layout-v padding-8 ${n.type === 'error' ? 'type-error' : n.type === 'warning' ? 'type-warning' : ''}`;
                item.style.borderRadius = '8px';
                item.style.position = 'relative';
                
                const headerBox = document.createElement('div');
                headerBox.className = 'layout-h flex-align-center flex-gap-6';
                headerBox.style.marginBottom = '4px';

                const iconDiv = document.createElement('div');
                iconDiv.style.display = 'flex';
                iconDiv.style.alignItems = 'center';
                iconDiv.style.fontFamily = "'Segoe MDL2 Assets', 'sfi'";
                iconDiv.style.fontSize = '11px';
                iconDiv.textContent = decodeFontEntity(n.icon);
                
                const appLabel = document.createElement('div');
                appLabel.className = 'shell-fd-small-text shell-muted-text';
                appLabel.textContent = n.appId;
                
                headerBox.appendChild(iconDiv);
                headerBox.appendChild(appLabel);

                const itemTitle = document.createElement('div');
                itemTitle.className = 'shell-toast-title';
                itemTitle.style.marginTop = '0';
                itemTitle.textContent = n.title;

                const itemMsg = document.createElement('div');
                itemMsg.className = 'shell-toast-msg';
                itemMsg.textContent = n.message;

                item.appendChild(headerBox);
                item.appendChild(itemTitle);
                item.appendChild(itemMsg);

                const closeBtn = document.createElement('button');
                closeBtn.type = 'button';
                closeBtn.className = 'shell-notification-close';
                closeBtn.textContent = '✕';
                closeBtn.onclick = () => ns.dismiss(n.id);
                
                item.appendChild(closeBtn);
                list.appendChild(item);
            }
        }
        this.trayPanel.appendChild(list);
    }
}