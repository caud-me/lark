import { EventBus } from '../kernel/SystemEventBus.js';

/**
 * InputPolicy
 * 
 * Responsibility:
 * Owns session-level input decisions. Blocks browser events when the session is locked, 
 * except for specific windows designated as 'lockAllowed'.
 * 
 * Does NOT:
 * - Manage window state
 * - Manage session state
 */
export class InputPolicy {
    constructor(registry) {
        this.registry = registry;
        this.sessionLocked = false;
        
        EventBus.on('session.locked', () => {
            this.sessionLocked = true;
        });

        EventBus.on('session.unlocked', () => {
            this.sessionLocked = false;
        });

        this._setupInputPolicy();
    }

    _setupInputPolicy() {
        const interceptor = (e) => {
            if (!this.sessionLocked) return;

            const windowService = this.registry.get('WindowService');
            if (!windowService) return;

            let isAllowed = false;
            for (const win of windowService.windowManager.windows.values()) {
                if (win.options && win.options.inputPolicy === 'lockAllowed') {
                    if (win.frame && win.frame.element && win.frame.element.contains(e.target)) {
                        isAllowed = true;
                        break;
                    }
                }
            }

            if (!isAllowed) {
                e.stopPropagation();
                e.preventDefault();
            }
        };

        const events = [
            'mousedown', 'mouseup', 'click', 'dblclick',
            'keydown', 'keyup', 'keypress',
            'pointerdown', 'pointerup',
            'contextmenu', 'wheel'
        ];

        events.forEach(evt => {
            document.addEventListener(evt, interceptor, true); // capture phase
        });
    }
}
