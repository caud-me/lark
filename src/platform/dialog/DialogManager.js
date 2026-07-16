// import { EventBus } from '../../kernel/SystemEventBus.js';

// /**
//  * DialogManager
//  * 
//  * Responsibility:
//  * Manages the #lde-dialog-layer DOM element and renders active dialogs.
//  * 
//  * Does NOT:
//  * - Handle business logic or promise resolution (handled by DialogService)
//  * - Manage windowing or window stacking
//  */
// export class DialogManager {
//     constructor() {
//         this.dialogLayer = document.createElement('div');
//         this.dialogLayer.id = 'lde-dialog-layer';
//         this.dialogLayer.style.position = 'absolute';
//         this.dialogLayer.style.top = '0';
//         this.dialogLayer.style.left = '0';
//         this.dialogLayer.style.width = '100vw';
//         this.dialogLayer.style.height = '100vh';
//         this.dialogLayer.style.pointerEvents = 'none'; // Only block when modal is active
//         this.dialogLayer.style.zIndex = '99990'; // High above windows, below panic/lock
//         document.body.appendChild(this.dialogLayer);
//     }

//     /**
//      * Renders a dialog to the layer.
//      * @param {Object} dialogConfig 
//      * @param {Function} onResolve 
//      */
//     showDialog(dialogConfig, onResolve) {
//         const overlay = document.createElement('div');
//         overlay.classList.add('lde-dialog-overlay');
//         overlay.style.position = 'absolute';
//         overlay.style.top = '0';
//         overlay.style.left = '0';
//         overlay.style.width = '100%';
//         overlay.style.height = '100%';
//         overlay.style.display = 'flex';
//         overlay.style.alignItems = 'center';
//         overlay.style.justifyContent = 'center';
//         overlay.style.pointerEvents = 'auto'; // Block underlying clicks

//         // Resolve creator environment context via the public WindowService API.
//         // Falls back to the active EnvironmentManager type if no window is focused.
//         let creatorEnvironmentType = 'DESKTOP';
//         if (this.registry) {
//             const windowService = this.registry.get('WindowService');
//             if (windowService) {
//                 const envType = windowService.getActiveWindowEnvironmentType();
//                 if (envType) creatorEnvironmentType = envType;
//             }

//             if (!creatorEnvironmentType || creatorEnvironmentType === 'DESKTOP') {
//                 const envManager = this.registry.get('EnvironmentManager');
//                 const activeEnv = envManager ? envManager.getActiveEnvironment() : null;
//                 if (activeEnv && activeEnv.type) {
//                     creatorEnvironmentType = activeEnv.type;
//                 }
//             }
//         }

//         const typeStr = typeof creatorEnvironmentType === 'symbol' ? creatorEnvironmentType.description : String(creatorEnvironmentType);
//         overlay.setAttribute('data-environment-type', typeStr.toUpperCase());

//         if (dialogConfig.modal) {
//             overlay.style.backgroundColor = 'var(--lde-dialog-backdrop, rgba(0, 0, 0, 0.4))'; // Backdrop for modal
//             overlay.style.backdropFilter = 'blur(4px)';
//         }

//         const box = document.createElement('div');
//         box.style.backgroundColor = 'var(--lde-bg-surface-elevated)';
//         box.style.borderRadius = 'var(--lde-radius-md)';
//         box.style.width = '350px';
//         box.style.maxWidth = '90vw';
//         box.style.padding = '20px';
//         box.style.display = 'flex';
//         box.style.flexDirection = 'column';
//         box.style.gap = '16px';
//         box.style.border = '1px solid var(--lde-border-base)';
//         box.style.boxShadow = 'var(--lde-shadow-large, 0 12px 32px rgba(0,0,0,0.5))';
//         box.style.color = 'var(--lde-text-primary)';

//         const title = document.createElement('div');
//         title.style.fontSize = '1.125rem';
//         title.style.fontWeight = '600';
//         title.style.color = 'var(--lde-text-primary)';
//         title.textContent = dialogConfig.title || 'Notification';
//         box.appendChild(title);

//         if (dialogConfig.contentElement) {
//             box.appendChild(dialogConfig.contentElement);
//         } else if (dialogConfig.message) {
//             const message = document.createElement('div');
//             message.style.fontSize = '12px';
//             message.style.color = 'var(--lde-text-secondary)';
//             message.textContent = dialogConfig.message;
//             box.appendChild(message);
//         }

//         let inputEl = null;
//         if (dialogConfig.type === 'prompt') {
//             inputEl = document.createElement('input');
//             inputEl.type = dialogConfig.inputType || 'text';
//             inputEl.id = 'lde-dialog-input-' + Date.now();
//             inputEl.name = inputEl.id;
//             inputEl.className = 'lde-input';
//             if (dialogConfig.defaultValue) inputEl.value = dialogConfig.defaultValue;
//             box.appendChild(inputEl);
//         }

//         const btnContainer = document.createElement('div');
//         btnContainer.style.display = 'flex';
//         btnContainer.style.justifyContent = 'flex-end';
//         btnContainer.style.gap = '8px';
//         btnContainer.style.marginTop = '8px';

//         const close = (result) => {
//             overlay.remove();
//             if (this.dialogLayer.children.length === 0) {
//                 this.dialogLayer.style.pointerEvents = 'none';
//             }
//             onResolve(result);
//         };
//         let primaryBtn = null;

//         if (dialogConfig.buttons) {
//             dialogConfig.buttons.forEach(btnDef => {
//                 const btn = document.createElement('button');
//                 btn.className = 'lde-btn' + (btnDef.primary ? ' lde-btn-primary' : '');
//                 btn.textContent = btnDef.label;
//                 btn.onclick = () => {
//                     if (dialogConfig.type === 'prompt' && btnDef.result === true) close(inputEl.value);
//                     else close(btnDef.result);
//                 };
//                 btnContainer.appendChild(btn);
//                 if (btnDef.primary) primaryBtn = btn;
//             });
//             if (!primaryBtn && btnContainer.firstChild) primaryBtn = btnContainer.firstChild;
//         } else {
//             if (dialogConfig.type === 'confirm' || dialogConfig.type === 'prompt') {
//                 const cancelBtn = document.createElement('button');
//                 cancelBtn.className = 'lde-btn';
//                 cancelBtn.textContent = 'Cancel';
//                 cancelBtn.onclick = () => close(dialogConfig.type === 'prompt' ? null : false);
//                 btnContainer.appendChild(cancelBtn);
//             }

//             const okBtn = document.createElement('button');
//             okBtn.className = 'lde-btn lde-btn-primary';
//             okBtn.textContent = 'OK';
//             okBtn.onclick = () => {
//                 if (dialogConfig.type === 'prompt') close(inputEl.value);
//                 else if (dialogConfig.type === 'confirm') close(true);
//                 else close(true); // alert
//             };
//             btnContainer.appendChild(okBtn);
//             primaryBtn = okBtn;
//         }

//         box.appendChild(btnContainer);
//         overlay.appendChild(box);
//         this.dialogLayer.appendChild(overlay);

//         if (inputEl) {
//             inputEl.focus();
//             inputEl.addEventListener('keydown', (e) => {
//                 if (e.key === 'Enter' && primaryBtn) primaryBtn.click();
//                 if (e.key === 'Escape') {
//                     if (dialogConfig.type === 'prompt') close(null);
//                     else close(false);
//                 }
//             });
//         } else if (primaryBtn) {
//             primaryBtn.focus();
//         }
//     }
// }

import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * DialogManager
 * 
 * Responsibility:
 * Manages the #lde-dialog-layer DOM element and renders active system modal dialogs[cite: 7].
 * Uses modern template string HTML injection and dedicated style isolation[cite: 7].
 * 
 * Does NOT:
 * - Handle business logic or promise resolution (handled by DialogService)[cite: 7].
 * - Manage general application windowing frames[cite: 7].
 */
export class DialogManager {
    constructor() {
        this.dialogLayer = document.createElement('div');
        this.dialogLayer.id = 'lde-dialog-layer';
        this.dialogLayer.style.position = 'absolute';
        this.dialogLayer.style.top = '0';
        this.dialogLayer.style.left = '0';
        this.dialogLayer.style.width = '100vw';
        this.dialogLayer.style.height = '100vh';
        this.dialogLayer.style.pointerEvents = 'none'; 
        this.dialogLayer.style.zIndex = '99990'; 
        document.body.appendChild(this.dialogLayer);

        this.injectGlobalStyles();
    }

    /**
     * Injects isolated component style blocks into the document head safely.
     */
    injectGlobalStyles() {
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
                background: #80808080);
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

    /**
     * Renders a custom styled dialog frame to the layer container[cite: 7].
     * @param {Object} dialogConfig 
     * @param {Function} onResolve 
     */
    showDialog(dialogConfig, onResolve) {
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

        // Resolve active system creator environment metadata tagging[cite: 7]
        let creatorEnvironmentType = 'DESKTOP';
        if (this.registry) {
            const windowService = this.registry.get('WindowService');
            if (windowService) {
                const envType = windowService.getActiveWindowEnvironmentType();
                if (envType) creatorEnvironmentType = envType;
            }

            if (!creatorEnvironmentType || creatorEnvironmentType === 'DESKTOP') {
                const envManager = this.registry.get('EnvironmentManager');
                const activeEnv = envManager ? envManager.getActiveEnvironment() : null;
                if (activeEnv && activeEnv.type) {
                    creatorEnvironmentType = activeEnv.type;
                }
            }
        }

        const typeStr = typeof creatorEnvironmentType === 'symbol' ? creatorEnvironmentType.description : String(creatorEnvironmentType);
        overlay.setAttribute('data-environment-type', typeStr.toUpperCase());

        if (dialogConfig.modal) {
            // Apply 50% dark overlay and grayscale saturation backdrop filtering[cite: 7]
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; 
            overlay.style.backdropFilter = 'saturate(0)';
            overlay.style.webkitBackdropFilter = 'saturate(0)';
        }

        // ========================================
        // HTML Injection Construction Layer
        // ========================================
        const uniqueInputId = 'prompt-input-' + Date.now();
        let contentHtml = '';

        if (dialogConfig.contentElement) {
            // Allocate a DOM mounting target for custom injected content wrappers[cite: 7]
            contentHtml = `<div id="dialog-custom-element-slot-${uniqueInputId}"></div>`;
        } else {
            const iconTag = dialogConfig.icon ? `<img src="${dialogConfig.icon}" alt="" style="width: 32px; height: 32px; margin-bottom: 4px; align-self: flex-start;">` : '';
            contentHtml = `
                ${iconTag}
                <h3>${dialogConfig.title || 'Notification'}</h3>
                <p>${dialogConfig.message || ''}</p>
            `;
        }

        let inputHtml = '';
        if (dialogConfig.type === 'prompt') {
            inputHtml = `
                <input 
                    type="${dialogConfig.inputType || 'text'}" 
                    id="${uniqueInputId}" 
                    class="shell-dialog-input" 
                    value="${dialogConfig.defaultValue || ''}"
                >
            `;
        }

        // Determine correct action control structures[cite: 7]
        let buttonDefinitions = dialogConfig.buttons;
        if (!buttonDefinitions) {
            if (dialogConfig.type === 'confirm' || dialogConfig.type === 'prompt') {
                buttonDefinitions = [
                    { label: 'Cancel', result: dialogConfig.type === 'prompt' ? null : false },
                    { label: 'OK', result: true, primary: true }
                ];
            } else {
                buttonDefinitions = [
                    { label: 'OK', result: true, primary: true }
                ];
            }
        }

        let buttonsHtml = '';
        for (let i = 0; i < buttonDefinitions.length; i++) {
            const btnDef = buttonDefinitions[i];
            const primaryClass = btnDef.primary ? 'primary-action' : '';
            buttonsHtml += `
                <button type="button" class="dialog-action-btn ${primaryClass}" data-btn-index="${i}">
                    ${btnDef.label}
                </button>
            `;
        }

        // Apply HTML template structure utilizing absolute positioning inline rules[cite: 7]
        overlay.innerHTML = `
            <div class="shell-dialog-frame" style="position: absolute; width: 256px;">
                <div class="shell-dialog-content">
                    ${contentHtml}
                    ${inputHtml}
                </div>
                <div class="shell-dialog-button-area">
                    ${buttonsHtml}
                </div>
            </div>
        `;

        this.dialogLayer.appendChild(overlay);
        if (this.dialogLayer.children.length > 0) {
            this.dialogLayer.style.pointerEvents = 'auto';
        }

        // Handle custom element DOM tree grafting securely[cite: 7]
        if (dialogConfig.contentElement) {
            const domSlot = overlay.querySelector(`#dialog-custom-element-slot-${uniqueInputId}`);
            if (domSlot) {
                domSlot.appendChild(dialogConfig.contentElement);
            }
        }

        // ========================================
        // Event Binding & Action Closures
        // ========================================
        const close = (result) => {
            overlay.remove();
            if (this.dialogLayer.children.length === 0) {
                this.dialogLayer.style.pointerEvents = 'none';
            }
            onResolve(result);
        };

        const buttonElements = overlay.querySelectorAll('.dialog-action-btn');
        buttonElements.forEach(btnEl => {
            const targetIndex = parseInt(btnEl.dataset.btnIndex, 10);
            const definition = buttonDefinitions[targetIndex];

            btnEl.onclick = () => {
                if (dialogConfig.type === 'prompt' && definition.result === true) {
                    const activeInput = overlay.querySelector(`#${uniqueInputId}`);
                    close(activeInput ? activeInput.value : null);
                } else {
                    close(definition.result);
                }
            };
        });

        // Resolve visual focus loops & accessibility binds[cite: 7]
        const primaryButton = overlay.querySelector('.dialog-action-btn.primary-action') || overlay.querySelector('.dialog-action-btn');
        const promptInputField = overlay.querySelector(`#${uniqueInputId}`);

        if (promptInputField) {
            promptInputField.focus();
            promptInputField.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && primaryButton) {
                    primaryButton.click();
                }
                if (e.key === 'Escape') {
                    close(null);
                }
            });
        } else if (primaryButton) {
            primaryButton.focus();
        }
    }
}