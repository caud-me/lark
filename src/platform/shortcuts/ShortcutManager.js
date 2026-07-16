import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * ShortcutManager
 * 
 * Responsibility:
 * Hooks into global keyboard events and dispatches matched shortcuts to registered handlers.
 */
export class ShortcutManager {
    constructor() {
        this.shortcuts = [];
        
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    register(shortcutConfig) {
        // shortcutConfig: { shortcut: 'Ctrl+C', scope: 'GLOBAL', handler: fn }
        this.shortcuts.push(shortcutConfig);
        EventBus.emit('shortcut.registered', { severity: 'Info', source: 'ShortcutManager', message: `Registered shortcut ${shortcutConfig.shortcut} in scope ${shortcutConfig.scope}` });
    }

    unregister(shortcutConfig) {
        this.shortcuts = this.shortcuts.filter(s => 
            !(s.shortcut === shortcutConfig.shortcut && s.scope === shortcutConfig.scope && s.handler === shortcutConfig.handler)
        );
    }

    handleKeyDown(e) {
        // Build the shortcut string
        let keys = [];
        if (e.ctrlKey) keys.push('Ctrl');
        if (e.metaKey) keys.push('Meta');
        if (e.altKey) keys.push('Alt');
        if (e.shiftKey) keys.push('Shift');
        
        if (!['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
            let key = e.key;
            if (key === ' ') key = 'Space';
            else if (key.length === 1) key = key.toUpperCase();
            keys.push(key);
        }

        const shortcutStr = keys.join('+');

        // Evaluate scopes in priority order: TEXT_INPUT -> WINDOW -> APPLICATION -> GLOBAL
        // Currently, we just support GLOBAL and evaluate them all roughly together, but we can refine
        // the check based on e.target.
        
        const isTextInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
        
        let handled = false;

        // Sort by scope priority
        const scopePriority = { 'TEXT_INPUT': 4, 'WINDOW': 3, 'APPLICATION': 2, 'GLOBAL': 1 };
        const activeShortcuts = this.shortcuts.filter(s => s.shortcut === shortcutStr).sort((a, b) => scopePriority[b.scope] - scopePriority[a.scope]);

        for (const s of activeShortcuts) {
            if (s.scope === 'TEXT_INPUT' && !isTextInput) continue;
            // For now, WINDOW and APPLICATION are treated similarly to GLOBAL unless we have more context
            
            s.handler(e);
            handled = true;
            break; // Stop at highest priority
        }

        if (handled) {
            e.preventDefault();
        }
    }
}
