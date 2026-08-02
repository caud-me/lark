/**
 * Phase 6: Window Frame UI
 * 
 * Responsibility: Pure presentation component. Renders the OS window chrome.
 * Emits events for dragging, resizing, and window controls.
 */
export class WindowFrame {
    constructor(title, callbacks = {}, options = {}) {
        this.element = document.createElement('div');
        this.element.className = 'lde-window-frame inactive';
        
        this.callbacks = callbacks;
        this.options = {
            closable: options.closable !== false,
            movable: options.movable !== false,
            resizable: options.resizable !== false,
            ...options
        };
        
        this._buildTitleBar(title);
        this._buildContentArea();
        if (this.options.resizable) {
            this._buildResizeHandles();
        }

        this.element.addEventListener('pointerdown', () => {
            if (this.callbacks.onFocus) this.callbacks.onFocus();
        });

        this.element.addEventListener('animationend', (e) => {
            if (e.animationName === 'ldeFluidOpen') {
                this.element.classList.add('opened');
            }
        });
    }

    setPosition(x, y) {
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    setSize(w, h) {
        this.element.style.width = `${w}px`;
        this.element.style.height = `${h}px`;
    }

    setState(state) {
        // Presentation is now handled entirely by the Desktop via EventBus
        // so that WindowFrame is not coupled to CSS logic for minimized windows.
    }

    setZIndex(z) {
        this.element.style.zIndex = z;
    }

    setActive(isActive) {
        if (isActive) {
            this.element.classList.add('active');
            this.element.classList.remove('inactive');
            this.titleBar.classList.add('active');
            this.titleBar.classList.remove('inactive');
        } else {
            this.element.classList.add('inactive');
            this.element.classList.remove('active');
            this.titleBar.classList.add('inactive');
            this.titleBar.classList.remove('active');
        }
    }

    setTitle(title) {
        if (this.titleBar) {
            const titleText = this.titleBar.querySelector('.lde-window-title-text');
            if (titleText) {
                titleText.innerText = title;
            }
        }
    }

    _buildTitleBar(title) {
        this.titleBar = document.createElement('div');
        this.titleBar.className = 'lde-window-titlebar inactive';

        const titleText = document.createElement('span');
        titleText.innerText = title;
        titleText.className = 'lde-window-title-text';

        // Drag support (Unified Pointer Events)
        this.onPointerMoveDrag = null;
        this.onPointerUpDrag = null;
        if (this.options.movable) {
            let startX = 0, startY = 0;
            this.onPointerMoveDrag = (e) => {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                startX = e.clientX;
                startY = e.clientY;
                if (this.callbacks.onDrag) this.callbacks.onDrag(dx, dy, e.clientX, e.clientY);
            };
            this.onPointerUpDrag = (e) => {
                document.removeEventListener('pointermove', this.onPointerMoveDrag);
                document.removeEventListener('pointerup', this.onPointerUpDrag);
                document.removeEventListener('pointercancel', this.onPointerUpDrag);
                if (this.callbacks.onDragEnd) this.callbacks.onDragEnd(e.clientX, e.clientY);
            };
            this.titleBar.addEventListener('pointerdown', (e) => {
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                this.element.classList.remove('animating-motion', 'minimizing', 'restoring', 'closing');
                this.element.classList.add('opened');
                startX = e.clientX;
                startY = e.clientY;
                document.addEventListener('pointermove', this.onPointerMoveDrag);
                document.addEventListener('pointerup', this.onPointerUpDrag);
                document.addEventListener('pointercancel', this.onPointerUpDrag);
            });
        }

        this.titleBar.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            e.preventDefault();
            e.stopPropagation();
            if (this.callbacks.onContextMenu) {
                this.callbacks.onContextMenu(e.clientX, e.clientY);
            }
        });

        // Controls
        const controls = document.createElement('div');
        controls.className = 'lde-window-controls';

        const minBtn = this._createBtn('\uE921', 'lde-window-btn-warning', 'Minimize', () => this.callbacks.onMinimize && this.callbacks.onMinimize());
        const maxBtn = this._createBtn('\uE922', 'lde-window-btn-success', 'Maximize', () => this.callbacks.onMaximize && this.callbacks.onMaximize());
        
        controls.appendChild(minBtn);
        if (this.options.resizable) {
            controls.appendChild(maxBtn);
        }
        if (this.options.closable) {
            const closeBtn = this._createBtn('\uE8BB', 'lde-window-btn-danger', 'Close', () => this.callbacks.onClose && this.callbacks.onClose());
            controls.appendChild(closeBtn);
        }

        this.titleBar.appendChild(titleText);
        this.titleBar.appendChild(controls);
        this.element.appendChild(this.titleBar);
    }

    _createBtn(label, hoverClass, ariaLabel, onClick) {
        const btn = document.createElement('button');
        btn.innerHTML = `<i>${label}</i>`;
        btn.className = `lde-window-btn ${hoverClass}`;
        btn.onclick = onClick;
        btn.setAttribute('aria-label', ariaLabel);
        btn.tabIndex = 0;
        return btn;
    }

    _buildContentArea() {
        this.contentElement = document.createElement('div');
        this.contentElement.className = 'lde-window-content-area';
        this.element.appendChild(this.contentElement);
    }

    _buildResizeHandles() {
        const edges = ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
        edges.forEach(edge => {
            const handle = document.createElement('div');
            handle.className = `lde-resize-handle lde-resize-handle-${edge}`;
            
            let startX = 0, startY = 0;
            const onPointerMove = (e) => {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                startX = e.clientX;
                startY = e.clientY;
                if (this.callbacks.onResize) this.callbacks.onResize(dx, dy, edge);
            };
            const onPointerUp = () => {
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
                document.removeEventListener('pointercancel', onPointerUp);
            };
            handle.addEventListener('pointerdown', (e) => {
                startX = e.clientX;
                startY = e.clientY;
                document.addEventListener('pointermove', onPointerMove);
                document.addEventListener('pointerup', onPointerUp);
                document.addEventListener('pointercancel', onPointerUp);
                e.stopPropagation();
            });

            this.element.appendChild(handle);
        });
    }

    destroy() {
        if (this.onPointerMoveDrag) {
            document.removeEventListener('pointermove', this.onPointerMoveDrag);
            document.removeEventListener('pointerup', this.onPointerUpDrag);
            document.removeEventListener('pointercancel', this.onPointerUpDrag);
        }
        // Remove opened class so animation: none !important is un-bound
        this.element.classList.remove('opened');
        // Add closing animation class
        this.element.classList.add('closing');
        // Remove after animation ends
        const removeElement = () => {
            if (this.element && this.element.parentNode) {
                this.element.remove();
            }
        };
        this.element.addEventListener('animationend', (e) => {
            if (e.animationName === 'ldeFluidClose') {
                removeElement();
            }
        });
        // Fallback timeout (in case animationend does not fire)
        setTimeout(removeElement, 350);
    }
}