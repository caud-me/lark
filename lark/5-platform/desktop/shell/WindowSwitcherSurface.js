import { ShellComponent } from './ShellComponent.js';
import { EventBus } from '../../../1-kernel/SystemEventBus.js';

/**
 * WindowSwitcherSurface
 * 
 * Responsibility:
 * Transient presentation shell surface for Alt+Tab / Ctrl+Backtick MRU window switching.
 * Queries WindowService.getMRUWindowList() upon activation and renders thumbnail previews.
 * Consumes PresentationEffectsService for motion policies.
 */
export class WindowSwitcherSurface extends ShellComponent {
    initialize(registry, environment) {
        super.initialize(registry, environment);

        this.element = document.createElement('div');
        this.element.className = 'lde-switcher-overlay';

        this.container = document.createElement('div');
        this.container.className = 'lde-switcher-container';
        this.element.appendChild(this.container);

        this.mruWindows = [];
        this.selectedIndex = 0;
        this.isOpen = false;

        this._onCycle = (payload) => {
            const reverse = payload && payload.reverse;
            if (!this.isOpen) {
                this.open(reverse);
            } else {
                this.cycle(reverse);
            }
        };

        this._onKeyUp = (e) => {
            if (this.isOpen && (e.key === 'Control' || e.code === 'ControlLeft' || e.code === 'ControlRight')) {
                this.selectCurrent();
            }
        };
    }

    resume() {
        EventBus.on('sys.shell.switcher.cycle', this._onCycle);
    }

    suspend() {
        EventBus.off('sys.shell.switcher.cycle', this._onCycle);
        this.close();
    }

    destroy() {
        this.suspend();
        super.destroy();
    }

    open(reverse = false) {
        const windowService = this.registry.get('WindowService');
        if (!windowService) return;

        this.mruWindows = windowService.getMRUWindowList().filter(w => !w.minimized);
        if (this.mruWindows.length <= 1) return; // Nothing to switch

        this.isOpen = true;
        this.selectedIndex = reverse ? this.mruWindows.length - 1 : 1;

        document.addEventListener('keyup', this._onKeyUp, true);
        this._evaluateMotionPolicy(true);
        this.render();
    }

    cycle(reverse = false) {
        if (!this.isOpen || this.mruWindows.length === 0) return;
        if (reverse) {
            this.selectedIndex = (this.selectedIndex - 1 + this.mruWindows.length) % this.mruWindows.length;
        } else {
            this.selectedIndex = (this.selectedIndex + 1) % this.mruWindows.length;
        }
        this.render();
    }

    selectCurrent() {
        if (!this.isOpen) return;

        const selected = this.mruWindows[this.selectedIndex];
        this.close();

        if (selected) {
            const windowService = this.registry.get('WindowService');
            if (windowService) {
                windowService.focusWindow(selected.id);
            }
        }
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        document.removeEventListener('keyup', this._onKeyUp, true);
        this._evaluateMotionPolicy(false);
        this.element.classList.remove('showing');
        this.mruWindows = [];
    }

    _evaluateMotionPolicy(showing) {
        const effectsService = this.registry.get('PresentationEffectsService');
        const policy = effectsService ? effectsService.getMotionPolicy('general') : { enabled: true, duration: 200 };

        if (showing) {
            this.element.classList.add('showing');
            if (policy && policy.enabled) {
                this.element.classList.add('animating');
                setTimeout(() => this.element.classList.remove('animating'), (policy.duration || 200) + 50);
            }
        }
    }

    render() {
        this.container.innerHTML = '';
        const applicationService = this.registry.get('ApplicationService');

        this.mruWindows.forEach((win, idx) => {
            const item = document.createElement('div');
            item.className = 'lde-switcher-item' + (idx === this.selectedIndex ? ' active' : '');
            
            const app = (applicationService && win.appId) ? applicationService.getApplication(win.appId) : null;
            let titleText = win.title;
            if (!titleText || titleText === 'Window' || titleText.startsWith('win-')) {
                if (app) {
                    titleText = app.title || app.name || win.appId;
                }
            }
            if (!titleText) {
                titleText = win.id;
            }

            const iconEl = document.createElement('div');
            iconEl.className = 'lde-switcher-icon';
            iconEl.innerHTML = (app && app.icon) ? app.icon : '<i>&#xE737;</i>';

            const titleEl = document.createElement('div');
            titleEl.className = 'lde-switcher-title';
            titleEl.textContent = titleText;

            item.appendChild(iconEl);
            item.appendChild(titleEl);

            item.addEventListener('pointerdown', () => {
                this.selectedIndex = idx;
                this.selectCurrent();
            });

            this.container.appendChild(item);
        });
    }
}
