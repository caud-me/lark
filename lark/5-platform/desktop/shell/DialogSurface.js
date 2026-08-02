import { ShellComponent } from './ShellComponent.js';
import { EnvironmentType } from '../../../3-system/EnvironmentType.js';

/**
 * DialogSurface
 *
 * Responsibility:
 * Renders system modal dialogs, backdrops, inputs, and buttons.
 * Subscribes ONLY to DialogService and has ZERO direct knowledge of DialogManager.
 */
export class DialogSurface extends ShellComponent {
    initialize(registry, environment) {
        super.initialize(registry, environment);

        this.element = document.createElement('div');
        this.element.id = 'lde-dialog-layer';
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100vw';
        this.element.style.height = '100vh';
        this.element.style.pointerEvents = 'none';
        this.element.style.zIndex = '99990';

        this._syncEnvironmentMetadata();
        this._injectStyles();
    }

    _syncEnvironmentMetadata() {
        if (!this.element || !this.registry) return;
        const envManager = this.registry.get('EnvironmentManager');
        const activeEnv = envManager ? envManager.getActiveEnvironment() : this.environment;
        const targetType = activeEnv ? activeEnv.type : (this.environment ? this.environment.type : null);
        if (targetType) {
            const typeKey = Object.keys(EnvironmentType).find(k => EnvironmentType[k] === targetType);
            if (typeKey) {
                this.element.setAttribute('data-environment-type', typeKey.toLowerCase());
            }
        }
    }

    _injectStyles() {
        const styleId = 'lde-shell-dialog-styles';
        if (document.getElementById(styleId)) return;

        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = `
            .shell-dialog-frame {
                background-color: #151515;
                border: solid 1px #202020;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
                color: var(--lde-text-primary, #ffffff);
                font-family: inherit;
                animation: ldeWindowOpen var(--lde-window-transition-duration, 0.25s) cubic-bezier(0.2, 0.9, 0.3, 1.1) forwards;
            }

            html.lde-motion-disabled .shell-dialog-frame {
                animation: none !important;
            }

            .shell-dialog-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding: 16px;
            }

            .shell-dialog-content h3 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
                line-height: 1.3;
            }

            .shell-dialog-content p {
                margin: 0;
                font-size: 11px;
                color: var(--lde-text-secondary, #888888);
                line-height: 1.4;
                word-wrap: break-word;
                overflow-wrap: break-word;
            }

            .shell-dialog-button-area {
                display: flex;
                gap: 8px;
                padding: 8px;
                border-top: 1px solid #1a1a1a;
            }

            .shell-dialog-button-area > button {
                flex: 1 1 auto;
                padding: 8px;
                border-radius: 8px;
                border: 1px solid #282828;
                background: #202020;
                color: #ffffff;
                cursor: pointer;
                font-size: 11px;
                font-weight: 600;
                outline: none;
                transition: background 0.15s ease, border-color 0.15s ease;
            }

            .shell-dialog-button-area > button:hover {
                background: #2b2b2b;
                border-color: #383838;
            }

            .shell-dialog-button-area > button.primary-action {
                background: #80808040;
                border-color: transparent;
                color: #ffffff;
            }

            .shell-dialog-button-area > button.primary-action:hover {
                background: #80808080;
            }

            .shell-dialog-input {
                width: 100%;
                padding: 8px 10px;
                border-radius: 8px;
                border: 1px solid #282828;
                background: #101010;
                color: #ffffff;
                font-size: 11px;
                box-sizing: border-box;
                outline: none;
                transition: border-color 0.15s ease;
            }

            .shell-dialog-input:focus {
                border-color: var(--lde-accent, #0078d4);
            }
        `;
        document.head.appendChild(styleElement);
    }

    resume() {
        const dialogService = this.registry.get('DialogService');
        if (dialogService) {
            this.unsub = dialogService.onDialogChanged(() => this._render());
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
        this._syncEnvironmentMetadata();
        const dialogService = this.registry.get('DialogService');
        if (!dialogService) {
            this.element.style.pointerEvents = 'none';
            return;
        }

        const activeState = dialogService.getActiveDialog();
        if (!activeState || !activeState.config) {
            this.element.style.pointerEvents = 'none';
            return;
        }

        this.element.style.pointerEvents = 'auto';

        const { config } = activeState;

        const overlay = document.createElement('div');
        overlay.classList.add('lde-dialog-overlay');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.pointerEvents = 'auto';

        if (config.modal) {
            overlay.classList.add('omni-modal-overlay');
        }

        const uniqueInputId = 'prompt-input-' + Date.now();

        const dialogFrame = document.createElement('div');
        dialogFrame.className = 'shell-dialog-frame';
        dialogFrame.style.position = 'absolute';
        dialogFrame.style.width = '256px';

        const dialogContent = document.createElement('div');
        dialogContent.className = 'shell-dialog-content';

        if (config.contentElement) {
            const domSlot = document.createElement('div');
            domSlot.id = `dialog-custom-element-slot-${uniqueInputId}`;
            domSlot.appendChild(config.contentElement);
            dialogContent.appendChild(domSlot);
        } else {
            if (config.icon) {
                const img = document.createElement('img');
                img.src = config.icon;
                img.alt = '';
                img.style.width = '32px';
                img.style.height = '32px';
                img.style.marginBottom = '4px';
                img.style.alignSelf = 'flex-start';
                dialogContent.appendChild(img);
            }

            const title = document.createElement('h3');
            title.textContent = config.title || 'Notification';
            dialogContent.appendChild(title);

            const msg = document.createElement('p');
            msg.textContent = config.message || '';
            dialogContent.appendChild(msg);
        }

        let inputEl = null;
        if (config.type === 'prompt') {
            inputEl = document.createElement('input');
            inputEl.type = config.inputType || 'text';
            inputEl.id = uniqueInputId;
            inputEl.className = 'shell-dialog-input';
            inputEl.value = config.defaultValue || '';
            dialogContent.appendChild(inputEl);
        }

        dialogFrame.appendChild(dialogContent);

        let buttonDefinitions = config.buttons;
        if (!buttonDefinitions) {
            if (config.type === 'confirm' || config.type === 'prompt') {
                buttonDefinitions = [
                    { label: 'Cancel', result: config.type === 'prompt' ? null : false },
                    { label: 'OK', result: true, primary: true }
                ];
            } else {
                buttonDefinitions = [
                    { label: 'OK', result: true, primary: true }
                ];
            }
        }

        const buttonArea = document.createElement('div');
        buttonArea.className = 'shell-dialog-button-area';

        let primaryBtn = null;
        for (let i = 0; i < buttonDefinitions.length; i++) {
            const btnDef = buttonDefinitions[i];
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'dialog-action-btn';
            if (btnDef.primary) {
                btn.classList.add('primary-action');
                primaryBtn = btn;
            }
            btn.textContent = btnDef.label;

            btn.onclick = () => {
                if (config.type === 'prompt' && btnDef.result === true && inputEl) {
                    dialogService.dismissDialog(inputEl.value);
                } else {
                    dialogService.dismissDialog(btnDef.result);
                }
            };
            buttonArea.appendChild(btn);
        }

        if (!primaryBtn && buttonArea.firstChild) {
            primaryBtn = buttonArea.firstChild;
        }

        dialogFrame.appendChild(buttonArea);
        overlay.appendChild(dialogFrame);
        this.element.appendChild(overlay);

        if (inputEl) {
            inputEl.focus();
            inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && primaryBtn) {
                    primaryBtn.click();
                }
                if (e.key === 'Escape') {
                    dialogService.dismissDialog(config.type === 'prompt' ? null : false);
                }
            });
        } else if (primaryBtn) {
            primaryBtn.focus();
        }
    }
}
