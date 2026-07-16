import { EventBus } from '../kernel/SystemEventBus.js';
import { EnvironmentType } from '../system/EnvironmentType.js';

/**
 * InputPolicy
 * 
 * Responsibility:
 * Owns session-level input decisions. Blocks browser events unless the clicked target's 
 * owner environment type matches the currently active environment type.
 *
 * Does NOT:
 * - Manage window state
 * - Manage session state
 */
export class InputPolicy {
    constructor(registry) {
        this.registry = registry;
        this._setupInputPolicy();
    }

    _setupInputPolicy() {
        const interceptor = (e) => {
            try {
                const envManager = this.registry.get('EnvironmentManager');
                const activeEnv = envManager ? envManager.getActiveEnvironment() : null;
                
                // If there's no active environment set (early boot), allow events
                if (!activeEnv) return;

                const activeType = activeEnv.type;
                const targetType = this._getTargetEnvironmentType(e.target);

                // Check if they match
                const isAllowed = (activeType === targetType);

                if (!isAllowed) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            } catch (err) {
                console.error('[InputPolicy] Interceptor error:', err);
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

    _getTargetEnvironmentType(target) {
        // 1. Element with explicit environment type metadata
        const typeEl = target.closest('[data-environment-type]');
        if (typeEl) {
            const typeStr = typeEl.getAttribute('data-environment-type').toUpperCase();
            const symbol = EnvironmentType[typeStr];
            if (symbol) return symbol;
        }

        // 2. Window frame — use the public WindowService API to avoid accessing
        //    WindowManager internals directly.
        const frame = target.closest('.lde-window-frame');
        if (frame) {
            const windowService = this.registry.get('WindowService');
            if (windowService) {
                const envType = windowService.getWindowEnvironmentType(frame.id);
                if (envType) return envType;
            }
        }

        // 3. Platform Shell containers
        if (target.closest('#oobe-container')) return EnvironmentType.BOOT;
        if (target.closest('#welcome-container')) return EnvironmentType.WELCOME;
        if (target.closest('#login-container')) return EnvironmentType.LOGIN;
        if (target.closest('#lock-container')) return EnvironmentType.LOCK;
        if (target.closest('#recovery-container')) return EnvironmentType.RECOVERY;

        // 4. Fallback/default is DESKTOP (taskbar, wallpaper, desktop layout)
        return EnvironmentType.DESKTOP;
    }
}
