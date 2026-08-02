import { ShellComponent } from './ShellComponent.js';
import { EnvironmentType } from '../../../3-system/EnvironmentType.js';

/**
 * ContextMenuSurface
 *
 * Responsibility:
 * Renders the context menu layer and handles visual menu elements and user interactions.
 * Subscribes ONLY to ContextMenuService and has ZERO direct knowledge of ContextMenuManager.
 */
export class ContextMenuSurface extends ShellComponent {
    initialize(registry, environment) {
        super.initialize(registry, environment);

        this.element = document.createElement('div');
        this.element.id = 'lde-context-menu-layer';
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100dvw';
        this.element.style.height = '100dvh';
        this.element.style.pointerEvents = 'none';
        this.element.style.zIndex = '99980';

        if (environment && environment.type) {
            const typeKey = Object.keys(EnvironmentType).find(k => EnvironmentType[k] === environment.type);
            if (typeKey) {
                this.element.setAttribute('data-environment-type', typeKey.toLowerCase());
            }
        }
    }

    resume() {
        const service = this.registry.get('ContextMenuService');
        if (service) {
            this.unsub = service.onMenuChanged(() => this._render());
        }
        this._render();
    }

    suspend() {
        if (this.unsub) {
            this.unsub();
            this.unsub = null;
        }
        this.element.innerHTML = '';
        this.element.style.pointerEvents = 'none';
    }

    _render() {
        this.element.innerHTML = '';
        const service = this.registry.get('ContextMenuService');
        if (!service) {
            this.element.style.pointerEvents = 'none';
            return;
        }

        const menuState = service.getActiveMenu();
        if (!menuState) {
            this.element.style.pointerEvents = 'none';
            return;
        }

        this.element.style.pointerEvents = 'auto';

        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';

        const menu = document.createElement('div');
        menu.className = 'lde-context-menu';
        const { x, y, items } = menuState;

        menu.style.left = `${Math.min(x, window.innerWidth - 200)}px`;
        menu.style.top = `${Math.min(y, window.innerHeight - ((items ? items.length : 0) * 32 + 16))}px`;

        overlay.onmousedown = (e) => {
            if (!menu.contains(e.target)) {
                service.dismissMenu(null);
            }
        };

        if (items && Array.isArray(items)) {
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
                    const icon = document.createElement('i');
                    icon.innerHTML = item.icon;
                    icon.style.fontFamily = 'sfi';
                    icon.style.fontStyle = 'normal';
                    btn.appendChild(icon);
                }

                const label = document.createElement('span');
                label.textContent = item.label;
                btn.appendChild(label);

                if (item.disabled) {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                } else {
                    btn.onmousedown = (e) => {
                        e.stopPropagation();
                        service.dismissMenu(item.id);
                    };
                }

                menu.appendChild(btn);
            });
        }

        overlay.appendChild(menu);
        this.element.appendChild(overlay);
    }
}
