import { ShellComponent } from './ShellComponent.js';
import { EventBus } from '../../../1-kernel/SystemEventBus.js';
import { US_QWERTY } from '../../input/KeyboardLayouts.js';

/**
 * OnScreenKeyboardSurface
 * 
 * Responsibility:
 * Floating software keyboard shell surface.
 * Emits text inputs into active focused DOM elements using modern selection APIs.
 * 
 * Does NOT:
 * - Direct window management
 * - Handle physical keyboard normalization (InputPolicy does this)
 */
export class OnScreenKeyboardSurface extends ShellComponent {
    constructor() {
        super();
        this.overlay = null;
        this.container = null;
        this.isVisible = false;
        
        // Dynamic surface state
        this.shiftActive = false;
        this.capsLock = false;
        this.activeLayout = US_QWERTY;
        this.backspaceTimer = null;

        // Bound event handlers for cleanup
        this._onToggle = this._onToggle.bind(this);
        this._onShow = this._onShow.bind(this);
        this._onHide = this._onHide.bind(this);
        this._onDocumentKeyDown = this._onDocumentKeyDown.bind(this);

        this._subscribeEvents();
    }

    _subscribeEvents() {
        EventBus.on('experimental.osk.toggle', this._onToggle);
        EventBus.on('experimental.osk.show', this._onShow);
        EventBus.on('experimental.osk.hide', this._onHide);
        document.addEventListener('keydown', this._onDocumentKeyDown, true);
    }

    _unsubscribeEvents() {
        EventBus.off('experimental.osk.toggle', this._onToggle);
        EventBus.off('experimental.osk.show', this._onShow);
        EventBus.off('experimental.osk.hide', this._onHide);
        document.removeEventListener('keydown', this._onDocumentKeyDown, true);
    }

    mount(container) {
        if (this.overlay) return;
        this.container = container;

        this.overlay = document.createElement('div');
        this.overlay.className = 'lde-osk-overlay';

        const keyboardBox = document.createElement('div');
        keyboardBox.className = 'lde-osk-container';
        this.overlay.appendChild(keyboardBox);

        this._render();
        this.container.appendChild(this.overlay);
    }

    unmount() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
        this.container = null;
    }

    show() {
        if (!this.overlay) return;
        this.isVisible = true;
        this.overlay.classList.add('showing');
    }

    hide() {
        if (!this.overlay) return;
        this.isVisible = false;
        this.overlay.classList.remove('showing');
        this._stopBackspaceRepeat();
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    _onToggle() {
        this.toggle();
    }

    _onShow() {
        this.show();
    }

    _onHide() {
        this.hide();
    }

    _onDocumentKeyDown(e) {
        if (this.isVisible && (e.key === 'Escape' || e.code === 'Escape')) {
            this.hide();
        }
    }

    _render() {
        if (!this.overlay) return;
        const keyboardBox = this.overlay.querySelector('.lde-osk-container');
        if (!keyboardBox) return;

        keyboardBox.innerHTML = '';

        // Render header bar with drag handle / dismiss button
        const header = document.createElement('div');
        header.className = 'lde-osk-header';
        header.innerHTML = `
            <span class="lde-osk-title">${this.activeLayout.name}</span>
            <button class="lde-osk-dismiss" title="Dismiss Keyboard"><i>&#xE711;</i></button>
        `;
        header.querySelector('.lde-osk-dismiss').onclick = (e) => {
            e.preventDefault();
            this.hide();
        };
        keyboardBox.appendChild(header);

        // Render Layout Rows
        this.activeLayout.rows.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'lde-osk-row';

            row.forEach(keyDef => {
                const keyEl = document.createElement('button');
                keyEl.className = 'lde-osk-key';
                keyEl.setAttribute('data-id', keyDef.id);
                keyEl.setAttribute('data-code', keyDef.code);
                keyEl.setAttribute('data-type', keyDef.type);

                if (keyDef.widthMultiplier) {
                    keyEl.style.flex = `${keyDef.widthMultiplier}`;
                }

                // Determine active label (Shift / Caps)
                const isUppercase = this.shiftActive ^ this.capsLock;
                let labelText = keyDef.label;
                if (keyDef.shiftLabel && this.shiftActive) {
                    labelText = keyDef.shiftLabel;
                } else if (isUppercase && keyDef.shiftKey && keyDef.type === 'character') {
                    labelText = keyDef.shiftKey;
                }

                keyEl.textContent = labelText;

                // Active state highlights for Shift & CapsLock
                if (keyDef.id.startsWith('Shift') && this.shiftActive) {
                    keyEl.classList.add('active');
                }
                if (keyDef.id === 'CapsLock' && this.capsLock) {
                    keyEl.classList.add('active');
                }

                // Pointer events to prevent focus loss on target input element
                keyEl.onpointerdown = (e) => {
                    e.preventDefault(); // Prevent active input from losing focus!
                    keyEl.classList.add('pressed');

                    if (keyDef.id === 'Backspace') {
                        this._handleKeyPress(keyDef);
                        this._startBackspaceRepeat(keyDef);
                    }
                };

                keyEl.onpointerup = (e) => {
                    e.preventDefault();
                    keyEl.classList.remove('pressed');

                    if (keyDef.id === 'Backspace') {
                        this._stopBackspaceRepeat();
                    } else {
                        this._handleKeyPress(keyDef);
                    }
                };

                keyEl.onpointerleave = () => {
                    keyEl.classList.remove('pressed');
                    if (keyDef.id === 'Backspace') {
                        this._stopBackspaceRepeat();
                    }
                };

                rowEl.appendChild(keyEl);
            });

            keyboardBox.appendChild(rowEl);
        });
    }

    _startBackspaceRepeat(keyDef) {
        this._stopBackspaceRepeat();
        this.backspaceTimer = setInterval(() => {
            this._handleKeyPress(keyDef);
        }, 100);
    }

    _stopBackspaceRepeat() {
        if (this.backspaceTimer) {
            clearInterval(this.backspaceTimer);
            this.backspaceTimer = null;
        }
    }

    _handleKeyPress(keyDef) {
        const target = document.activeElement;

        // Modifier Toggles
        if (keyDef.id.startsWith('Shift')) {
            this.shiftActive = !this.shiftActive;
            this._render();
            return;
        }

        if (keyDef.id === 'CapsLock') {
            this.capsLock = !this.capsLock;
            this._render();
            return;
        }

        // Special System Keys
        if (keyDef.id === 'Escape') {
            this.hide();
            return;
        }

        if (!target) return;

        // Determine input character
        const isUppercase = this.shiftActive ^ this.capsLock;
        let inputChar = keyDef.key;
        if (keyDef.shiftKey && (this.shiftActive || isUppercase)) {
            inputChar = isUppercase && !keyDef.shiftLabel ? keyDef.shiftKey : (this.shiftActive && keyDef.shiftLabel ? keyDef.shiftLabel : keyDef.key);
        }

        // 1. Dispatch beforeinput event
        const beforeInputEvt = new InputEvent('beforeinput', {
            bubbles: true,
            cancelable: true,
            inputType: keyDef.id === 'Backspace' ? 'deleteContentBackward' : (keyDef.id === 'Enter' ? 'insertLineBreak' : 'insertText'),
            data: (keyDef.type === 'character') ? inputChar : null
        });
        
        const isAllowed = target.dispatchEvent(beforeInputEvt);
        if (!isAllowed) return; // If app canceled beforeinput, abort

        // 2. Perform DOM Text / Selection Mutation
        const tagName = target.tagName ? target.tagName.toLowerCase() : '';
        const isTextInput = (tagName === 'input' || tagName === 'textarea');
        const isContentEditable = target.isContentEditable;

        if (isTextInput) {
            const start = target.selectionStart !== null ? target.selectionStart : target.value.length;
            const end = target.selectionEnd !== null ? target.selectionEnd : target.value.length;
            const val = target.value || '';

            if (keyDef.id === 'Backspace') {
                if (start !== end) {
                    target.value = val.substring(0, start) + val.substring(end);
                    target.selectionStart = target.selectionEnd = start;
                } else if (start > 0) {
                    target.value = val.substring(0, start - 1) + val.substring(start);
                    target.selectionStart = target.selectionEnd = start - 1;
                }
            } else if (keyDef.id === 'Enter') {
                if (tagName === 'textarea') {
                    target.value = val.substring(0, start) + '\n' + val.substring(end);
                    target.selectionStart = target.selectionEnd = start + 1;
                }
            } else if (keyDef.id === 'Tab') {
                target.value = val.substring(0, start) + '\t' + val.substring(end);
                target.selectionStart = target.selectionEnd = start + 1;
            } else if (keyDef.type === 'character') {
                target.value = val.substring(0, start) + inputChar + val.substring(end);
                target.selectionStart = target.selectionEnd = start + inputChar.length;
            }
        } else if (isContentEditable) {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                if (keyDef.id === 'Backspace') {
                    if (!range.collapsed) {
                        range.deleteContents();
                    } else if (range.startOffset > 0) {
                        range.setStart(range.startContainer, range.startOffset - 1);
                        range.deleteContents();
                    }
                } else if (keyDef.id === 'Enter') {
                    range.deleteContents();
                    const br = document.createElement('br');
                    range.insertNode(br);
                    range.setStartAfter(br);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                } else if (keyDef.type === 'character') {
                    range.deleteContents();
                    const textNode = document.createTextNode(inputChar);
                    range.insertNode(textNode);
                    range.setStartAfter(textNode);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        }

        // 3. Dispatch input event (NO per-keystroke change event)
        target.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: false,
            inputType: keyDef.id === 'Backspace' ? 'deleteContentBackward' : (keyDef.id === 'Enter' ? 'insertLineBreak' : 'insertText'),
            data: (keyDef.type === 'character') ? inputChar : null
        }));

        // 4. Dispatch supplementary KeyboardEvent for application listener compatibility
        target.dispatchEvent(new KeyboardEvent('keydown', {
            key: keyDef.key,
            code: keyDef.code,
            bubbles: true,
            cancelable: true,
            shiftKey: this.shiftActive
        }));
        target.dispatchEvent(new KeyboardEvent('keyup', {
            key: keyDef.key,
            code: keyDef.code,
            bubbles: true,
            cancelable: true,
            shiftKey: this.shiftActive
        }));

        // Auto-unlatch Shift after typing a character
        if (this.shiftActive && keyDef.type === 'character') {
            this.shiftActive = false;
            this._render();
        }
    }

    dispose() {
        this._stopBackspaceRepeat();
        this._unsubscribeEvents();
        this.unmount();
    }
}
