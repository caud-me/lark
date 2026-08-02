/**
 * KeyboardLayouts
 * 
 * Responsibility:
 * Platform-agnostic, immutable data provider for keyboard key layouts.
 * Used by OnScreenKeyboardSurface and future accessibility/authentication surfaces.
 * 
 * Does NOT:
 * - Manage active keyboard state (shift, caps lock, held keys)
 * - Render DOM elements
 */

export const US_QWERTY = {
    id: 'us_qwerty',
    name: 'US QWERTY',
    rows: [
        [
            { id: 'Escape', label: 'Esc', code: 'Escape', key: 'Escape', type: 'system', widthMultiplier: 1.2 },
            { id: '1', label: '1', shiftLabel: '!', code: 'Digit1', key: '1', shiftKey: '!', type: 'character' },
            { id: '2', label: '2', shiftLabel: '@', code: 'Digit2', key: '2', shiftKey: '@', type: 'character' },
            { id: '3', label: '3', shiftLabel: '#', code: 'Digit3', key: '3', shiftKey: '#', type: 'character' },
            { id: '4', label: '4', shiftLabel: '$', code: 'Digit4', key: '4', shiftKey: '$', type: 'character' },
            { id: '5', label: '5', shiftLabel: '%', code: 'Digit5', key: '5', shiftKey: '%', type: 'character' },
            { id: '6', label: '6', shiftLabel: '^', code: 'Digit6', key: '6', shiftKey: '^', type: 'character' },
            { id: '7', label: '7', shiftLabel: '&', code: 'Digit7', key: '7', shiftKey: '&', type: 'character' },
            { id: '8', label: '8', shiftLabel: '*', code: 'Digit8', key: '8', shiftKey: '*', type: 'character' },
            { id: '9', label: '9', shiftLabel: '(', code: 'Digit9', key: '9', shiftKey: '(', type: 'character' },
            { id: '0', label: '0', shiftLabel: ')', code: 'Digit0', key: '0', shiftKey: ')', type: 'character' },
            { id: 'Minus', label: '-', shiftLabel: '_', code: 'Minus', key: '-', shiftKey: '_', type: 'character' },
            { id: 'Equal', label: '=', shiftLabel: '+', code: 'Equal', key: '=', shiftKey: '+', type: 'character' },
            { id: 'Backspace', label: '⌫', code: 'Backspace', key: 'Backspace', type: 'editing', widthMultiplier: 1.5 }
        ],
        [
            { id: 'Tab', label: 'Tab', code: 'Tab', key: 'Tab', type: 'navigation', widthMultiplier: 1.5 },
            { id: 'q', label: 'q', shiftLabel: 'Q', code: 'KeyQ', key: 'q', shiftKey: 'Q', type: 'character' },
            { id: 'w', label: 'w', shiftLabel: 'W', code: 'KeyW', key: 'w', shiftKey: 'W', type: 'character' },
            { id: 'e', label: 'e', shiftLabel: 'E', code: 'KeyE', key: 'e', shiftKey: 'E', type: 'character' },
            { id: 'r', label: 'r', shiftLabel: 'R', code: 'KeyR', key: 'r', shiftKey: 'R', type: 'character' },
            { id: 't', label: 't', shiftLabel: 'T', code: 'KeyT', key: 't', shiftKey: 'T', type: 'character' },
            { id: 'y', label: 'y', shiftLabel: 'Y', code: 'KeyY', key: 'y', shiftKey: 'Y', type: 'character' },
            { id: 'u', label: 'u', shiftLabel: 'U', code: 'KeyU', key: 'u', shiftKey: 'U', type: 'character' },
            { id: 'i', label: 'i', shiftLabel: 'I', code: 'KeyI', key: 'i', shiftKey: 'I', type: 'character' },
            { id: 'o', label: 'o', shiftLabel: 'O', code: 'KeyO', key: 'o', shiftKey: 'O', type: 'character' },
            { id: 'p', label: 'p', shiftLabel: 'P', code: 'KeyP', key: 'p', shiftKey: 'P', type: 'character' },
            { id: 'BracketLeft', label: '[', shiftLabel: '{', code: 'BracketLeft', key: '[', shiftKey: '{', type: 'character' },
            { id: 'BracketRight', label: ']', shiftLabel: '}', code: 'BracketRight', key: ']', shiftKey: '}', type: 'character' },
            { id: 'Backslash', label: '\\', shiftLabel: '|', code: 'Backslash', key: '\\', shiftKey: '|', type: 'character' }
        ],
        [
            { id: 'CapsLock', label: 'Caps', code: 'CapsLock', key: 'CapsLock', type: 'modifier', widthMultiplier: 1.75 },
            { id: 'a', label: 'a', shiftLabel: 'A', code: 'KeyA', key: 'a', shiftKey: 'A', type: 'character' },
            { id: 's', label: 's', shiftLabel: 'S', code: 'KeyS', key: 's', shiftKey: 'S', type: 'character' },
            { id: 'd', label: 'd', shiftLabel: 'D', code: 'KeyD', key: 'd', shiftKey: 'D', type: 'character' },
            { id: 'f', label: 'f', shiftLabel: 'F', code: 'KeyF', key: 'f', shiftKey: 'F', type: 'character' },
            { id: 'g', label: 'g', shiftLabel: 'G', code: 'KeyG', key: 'g', shiftKey: 'G', type: 'character' },
            { id: 'h', label: 'h', shiftLabel: 'H', code: 'KeyH', key: 'h', shiftKey: 'H', type: 'character' },
            { id: 'j', label: 'j', shiftLabel: 'J', code: 'KeyJ', key: 'j', shiftKey: 'J', type: 'character' },
            { id: 'k', label: 'k', shiftLabel: 'K', code: 'KeyK', key: 'k', shiftKey: 'K', type: 'character' },
            { id: 'l', label: 'l', shiftLabel: 'L', code: 'KeyL', key: 'l', shiftKey: 'L', type: 'character' },
            { id: 'Semicolon', label: ';', shiftLabel: ':', code: 'Semicolon', key: ';', shiftKey: ':', type: 'character' },
            { id: 'Quote', label: "'", shiftLabel: '"', code: 'Quote', key: "'", shiftKey: '"', type: 'character' },
            { id: 'Enter', label: 'Enter', code: 'Enter', key: 'Enter', type: 'editing', widthMultiplier: 2.25 }
        ],
        [
            { id: 'ShiftLeft', label: 'Shift', code: 'ShiftLeft', key: 'Shift', type: 'modifier', widthMultiplier: 2.25 },
            { id: 'z', label: 'z', shiftLabel: 'Z', code: 'KeyZ', key: 'z', shiftKey: 'Z', type: 'character' },
            { id: 'x', label: 'x', shiftLabel: 'X', code: 'KeyX', key: 'x', shiftKey: 'X', type: 'character' },
            { id: 'c', label: 'c', shiftLabel: 'C', code: 'KeyC', key: 'c', shiftKey: 'C', type: 'character' },
            { id: 'v', label: 'v', shiftLabel: 'V', code: 'KeyV', key: 'v', shiftKey: 'V', type: 'character' },
            { id: 'b', label: 'b', shiftLabel: 'B', code: 'KeyB', key: 'b', shiftKey: 'B', type: 'character' },
            { id: 'n', label: 'n', shiftLabel: 'N', code: 'KeyN', key: 'n', shiftKey: 'N', type: 'character' },
            { id: 'm', label: 'm', shiftLabel: 'M', code: 'KeyM', key: 'm', shiftKey: 'M', type: 'character' },
            { id: 'Comma', label: ',', shiftLabel: '<', code: 'Comma', key: ',', shiftKey: '<', type: 'character' },
            { id: 'Period', label: '.', shiftLabel: '>', code: 'Period', key: '.', shiftKey: '>', type: 'character' },
            { id: 'Slash', label: '/', shiftLabel: '?', code: 'Slash', key: '/', shiftKey: '?', type: 'character' },
            { id: 'ShiftRight', label: 'Shift', code: 'ShiftRight', key: 'Shift', type: 'modifier', widthMultiplier: 2.75 }
        ],
        [
            { id: 'Space', label: 'Space', code: 'Space', key: ' ', type: 'character', widthMultiplier: 6.0 }
        ]
    ]
};
