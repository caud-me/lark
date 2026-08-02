import { EventBus } from '../1-kernel/SystemEventBus.js';
import { EnvironmentType } from '../3-system/EnvironmentType.js';

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
        this._setupKeyboardShortcuts();
        this._setupOSKAutoShow();
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
            'pointerdown', 'pointerup', 'pointermove', 'pointercancel',
            'contextmenu', 'wheel'
        ];

        events.forEach(evt => {
            document.addEventListener(evt, interceptor, true); // capture phase
        });
    }

    _setupOSKAutoShow() {
        document.addEventListener('focusin', (e) => {
            const target = e.target;
            if (!target) return;

            if (target.closest && target.closest('.lde-osk-container')) return;

            const isEditable = this._isTextEditable(target);
            if (!isEditable) return;

            const settingsService = this.registry ? (this.registry.get('SettingsService') || this.registry.get('UserSettingsService')) : null;
            const isOskEnabled = settingsService ? settingsService.getSetting('dev.oskEnabled') : false;
            const isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

            if (isOskEnabled && isCoarsePointer) {
                EventBus.emit('experimental.osk.show');
            }
        }, true);

        document.addEventListener('focusout', () => {
            setTimeout(() => {
                const active = document.activeElement;
                if (!active || !this._isTextEditable(active)) {
                    if (active && active.closest && active.closest('.lde-osk-container')) return;
                    EventBus.emit('experimental.osk.hide');
                }
            }, 50);
        }, true);
    }

    _isTextEditable(target) {
        if (!target) return false;
        const tagName = target.tagName ? target.tagName.toLowerCase() : '';
        if (target.isContentEditable) return true;
        if (tagName === 'textarea') return true;
        if (tagName === 'input') {
            const type = (target.type || 'text').toLowerCase();
            return !['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'image', 'color'].includes(type);
        }
        return false;
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
        if (target.closest('#login-container')) return EnvironmentType.LOGIN;
        if (target.closest('#lock-container')) return EnvironmentType.LOCK;
        if (target.closest('#recovery-container')) return EnvironmentType.RECOVERY;
        if (target.closest('#platform-host')) {
            const envManager = this.registry.get('EnvironmentManager');
            const activeEnv = envManager ? envManager.getActiveEnvironment() : null;
            if (activeEnv) return activeEnv.type;
        }

        // 4. Fallback/default is DESKTOP (taskbar, wallpaper, desktop layout)
        return EnvironmentType.DESKTOP;
    }

    /**
     * Normalizes raw DOM KeyboardEvent into canonical shortcut representation.
     * @param {KeyboardEvent} e
     * @returns {Object} { key, code, rawKey, alt, ctrl, shift, meta, isNavKey, isArrow, isBackquote }
     */
    _normalizeKeyEvent(e) {
        const key = (e.key || '').toLowerCase();
        const code = e.code || '';
        const isArrow = code.startsWith('Arrow') || key.startsWith('arrow');
        const isBackquote = code === 'Backquote' || key === '`' || key === '~';
        const isNavKey = isArrow || isBackquote || ['home', 'end', 'pageup', 'pagedown', 'tab', 'escape', 'enter', 'backspace', 'delete'].includes(key);

        return {
            key,
            code,
            rawKey: e.key,
            alt: !!e.altKey,
            ctrl: !!e.ctrlKey,
            shift: !!e.shiftKey,
            meta: !!e.metaKey,
            isNavKey,
            isArrow,
            isBackquote
        };
    }

    /**
     * Binds system-wide keyboard shortcuts for window switching, snapping, moving, resizing, and centering.
     * Consumes normalized keyboard events strictly.
     * 
     * Browser Compatibility Invariant:
     * Bare Alt + Letter shortcuts (Alt+D, Alt+F, Alt+E) are host-reserved by Chromium/Firefox.
     * Platform shortcuts strictly consume browser-deliverable combinations:
     * - Ctrl + Backtick / Ctrl + Shift + Backtick (Window Switcher)
     * - Alt + Shift + Arrow (Window Moving)
     * - Alt + Ctrl + Arrow (Window Resizing)
     * - Alt + Arrow (Window Snapping / Maximize / Minimize)
     * - Alt + Shift + C / Alt + Home (Window Centering & Recovery)
     * @private
     */
    _setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const norm = this._normalizeKeyEvent(e);
            const windowService = this.registry ? this.registry.get('WindowService') : null;

            // 1. Window Switcher: Ctrl + Backtick / Ctrl + Shift + Backtick
            if (norm.ctrl && !norm.alt && norm.isBackquote) {
                e.preventDefault();
                e.stopPropagation();
                EventBus.emit('sys.shell.switcher.cycle', { reverse: norm.shift });
                return;
            }

            if (!windowService) return;

            // 2. Window Moving: Alt + Shift + Arrow (10px step)
            if (norm.alt && norm.shift && !norm.ctrl && norm.isArrow) {
                const mruList = windowService.getMRUWindowList();
                const active = mruList.find(w => w.focused);
                if (!active) return;

                e.preventDefault();
                e.stopPropagation();
                let dx = 0, dy = 0;
                if (norm.code === 'ArrowLeft' || norm.key === 'arrowleft') dx = -10;
                if (norm.code === 'ArrowRight' || norm.key === 'arrowright') dx = 10;
                if (norm.code === 'ArrowUp' || norm.key === 'arrowup') dy = -10;
                if (norm.code === 'ArrowDown' || norm.key === 'arrowdown') dy = 10;
                windowService.moveWindow(active.id, dx, dy);
                return;
            }

            // 3. Window Resizing: Alt + Ctrl + Arrow (10px step)
            if (norm.alt && norm.ctrl && !norm.shift && norm.isArrow) {
                const mruList = windowService.getMRUWindowList();
                const active = mruList.find(w => w.focused);
                if (!active) return;

                e.preventDefault();
                e.stopPropagation();
                let dw = 0, dh = 0;
                if (norm.code === 'ArrowLeft' || norm.key === 'arrowleft') dw = -10;
                if (norm.code === 'ArrowRight' || norm.key === 'arrowright') dw = 10;
                if (norm.code === 'ArrowUp' || norm.key === 'arrowup') dh = -10;
                if (norm.code === 'ArrowDown' || norm.key === 'arrowdown') dh = 10;
                windowService.setWindowSize(active.id, Math.max(300, active.w + dw), Math.max(200, active.h + dh));
                return;
            }

            // 4. Snapping / Maximize / Minimize: Alt + Arrow (No Ctrl, No Shift)
            if (norm.alt && !norm.ctrl && !norm.shift && norm.isArrow) {
                const mruList = windowService.getMRUWindowList();
                const active = mruList.find(w => w.focused);
                if (!active) return;

                if (norm.code === 'ArrowLeft' || norm.key === 'arrowleft') {
                    e.preventDefault();
                    e.stopPropagation();
                    windowService.snapWindow(active.id, 'left');
                } else if (norm.code === 'ArrowRight' || norm.key === 'arrowright') {
                    e.preventDefault();
                    e.stopPropagation();
                    windowService.snapWindow(active.id, 'right');
                } else if (norm.code === 'ArrowUp' || norm.key === 'arrowup') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (active.maximized) {
                        windowService.restoreWindow(active.id);
                    } else {
                        windowService.maximizeWindow(active.id);
                    }
                } else if (norm.code === 'ArrowDown' || norm.key === 'arrowdown') {
                    e.preventDefault();
                    e.stopPropagation();
                    windowService.minimizeWindow(active.id);
                }
                return;
            }

            // 5. Center Focused/Lost Window: Ctrl + Alt + C, Alt + Shift + C, or Alt + Home
            const isCenterShortcut = (norm.ctrl && norm.alt && norm.key === 'c') || (norm.alt && norm.shift && norm.key === 'c') || (norm.alt && norm.key === 'home');
            if (isCenterShortcut) {
                const mruList = windowService.getMRUWindowList();
                const active = mruList.find(w => w.focused) || mruList[0];
                if (!active) return;

                e.preventDefault();
                e.stopPropagation();
                windowService.centerWindow(active.id);
            }
        }, true);
    }
}
