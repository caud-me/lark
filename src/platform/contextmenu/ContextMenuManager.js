import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * ContextMenuManager
 * 
 * Responsibility:
 * Manages the #lde-context-menu-layer DOM element and renders active menus.
 * 
 * Does NOT:
 * - Handle business logic or promise resolution (handled by ContextMenuService)
 */
export class ContextMenuManager {
    constructor() {
        this.layer = document.createElement('div');
        this.layer.id = 'lde-context-menu-layer';
        this.layer.style.position = 'absolute';
        this.layer.style.top = '0';
        this.layer.style.left = '0';
        this.layer.style.width = '100vw';
        this.layer.style.height = '100vh';
        this.layer.style.pointerEvents = 'none';
        this.layer.style.zIndex = '99980'; // Just below dialogs
        document.body.appendChild(this.layer);
    }

    /**
     * Renders a context menu to the layer.
     * @param {number} x 
     * @param {number} y 
     * @param {Array} items - [{ id, label, icon }]
     * @param {Function} onResolve 
     */
    showMenu(x, y, items, onResolve) {
        // Clear any existing menu
        this.layer.innerHTML = '';
        this.layer.style.pointerEvents = 'auto'; // Block clicks outside

        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';

        const menu = document.createElement('div');
        menu.className = 'lde-context-menu';
        // Keep within bounds
        menu.style.left = `${Math.min(x, window.innerWidth - 200)}px`;
        menu.style.top = `${Math.min(y, window.innerHeight - (items.length * 32 + 16))}px`;

        const close = (result) => {
            this.layer.innerHTML = '';
            this.layer.style.pointerEvents = 'none';
            onResolve(result);
        };

        overlay.onmousedown = (e) => {
            if (!menu.contains(e.target)) {
                close(null); // Clicked outside
            }
        };

        items.forEach(item => {
            if (item.type === 'separator') {
                const sep = document.createElement('div');
                sep.className = 'lde-context-menu-separator';
                menu.appendChild(sep);
                return;
            }

            const btn = document.createElement('button');
            btn.className = 'lde-context-menu-item';

            if (item.icon) {
                const icon = document.createElement('span');
                icon.textContent = item.icon;
                btn.appendChild(icon);
            }

            const label = document.createElement('span');
            label.textContent = item.label;
            btn.appendChild(label);

            btn.onclick = () => close(item.id);
            menu.appendChild(btn);
        });

        overlay.appendChild(menu);
        this.layer.appendChild(overlay);
    }
}
