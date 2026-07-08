import { EventBus } from '../kernel/SystemEventBus.js';

/**
 * DialogManager
 * 
 * Responsibility:
 * Manages the #lde-dialog-layer DOM element and renders active dialogs.
 * 
 * Does NOT:
 * - Handle business logic or promise resolution (handled by DialogService)
 * - Manage windowing or window stacking
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
        this.dialogLayer.style.pointerEvents = 'none'; // Only block when modal is active
        this.dialogLayer.style.zIndex = '99990'; // High above windows, below panic/lock
        document.body.appendChild(this.dialogLayer);
    }

    /**
     * Renders a dialog to the layer.
     * @param {Object} dialogConfig 
     * @param {Function} onResolve 
     */
    showDialog(dialogConfig, onResolve) {
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.pointerEvents = 'auto'; // Block underlying clicks

        if (dialogConfig.modal) {
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'; // Backdrop for modal
            overlay.style.backdropFilter = 'blur(4px)';
        }

        const box = document.createElement('div');
        box.style.backgroundColor = 'var(--lde-bg-surface-elevated)';
        box.style.borderRadius = 'var(--lde-radius-md)';
        box.style.width = '350px';
        box.style.maxWidth = '90vw';
        box.style.padding = '20px';
        box.style.display = 'flex';
        box.style.flexDirection = 'column';
        box.style.gap = '16px';
        box.style.boxShadow = '0 12px 32px rgba(0,0,0,0.5)';
        box.style.border = '1px solid var(--lde-border)';

        const title = document.createElement('div');
        title.style.fontSize = '1.125rem';
        title.style.fontWeight = '600';
        title.style.color = 'var(--lde-text-primary)';
        title.textContent = dialogConfig.title || 'Notification';
        box.appendChild(title);

        if (dialogConfig.message) {
            const message = document.createElement('div');
            message.style.fontSize = '0.875rem';
            message.style.color = 'var(--lde-text-secondary)';
            message.textContent = dialogConfig.message;
            box.appendChild(message);
        }

        let inputEl = null;
        if (dialogConfig.type === 'prompt') {
            inputEl = document.createElement('input');
            inputEl.type = 'text';
            inputEl.className = 'lde-input';
            if (dialogConfig.defaultValue) inputEl.value = dialogConfig.defaultValue;
            box.appendChild(inputEl);
        }

        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.justifyContent = 'flex-end';
        btnContainer.style.gap = '8px';
        btnContainer.style.marginTop = '8px';

        const close = (result) => {
            overlay.remove();
            if (this.dialogLayer.children.length === 0) {
                this.dialogLayer.style.pointerEvents = 'none';
            }
            onResolve(result);
        };

        if (dialogConfig.type === 'confirm' || dialogConfig.type === 'prompt') {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'lde-btn';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onclick = () => close(dialogConfig.type === 'prompt' ? null : false);
            btnContainer.appendChild(cancelBtn);
        }

        const okBtn = document.createElement('button');
        okBtn.className = 'lde-btn lde-btn-primary';
        okBtn.textContent = 'OK';
        okBtn.onclick = () => {
            if (dialogConfig.type === 'prompt') close(inputEl.value);
            else if (dialogConfig.type === 'confirm') close(true);
            else close(true); // alert
        };
        btnContainer.appendChild(okBtn);

        box.appendChild(btnContainer);
        overlay.appendChild(box);
        this.dialogLayer.appendChild(overlay);

        if (inputEl) {
            inputEl.focus();
            inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') okBtn.click();
                if (e.key === 'Escape') {
                    if (dialogConfig.type === 'prompt') close(null);
                    else close(false);
                }
            });
        } else {
            okBtn.focus();
        }
    }
}
