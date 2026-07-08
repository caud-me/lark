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

        this.element.addEventListener('mousedown', () => {
            if (this.callbacks.onFocus) this.callbacks.onFocus();
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
        if (state === 'minimized') {
            this.contentElement.style.display = 'none';
        } else {
            this.contentElement.style.display = 'block';
        }
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

    _buildTitleBar(title) {
        this.titleBar = document.createElement('div');
        this.titleBar.className = 'lde-window-titlebar inactive';

        const titleText = document.createElement('span');
        titleText.innerText = title;
        titleText.className = 'lde-window-title-text';

        // Drag support
        this.onMouseMoveDrag = null;
        this.onMouseUpDrag = null;
        if (this.options.movable) {
            let startX = 0, startY = 0;
            this.onMouseMoveDrag = (e) => {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                startX = e.clientX;
                startY = e.clientY;
                if (this.callbacks.onDrag) this.callbacks.onDrag(dx, dy);
            };
            this.onMouseUpDrag = () => {
                document.removeEventListener('mousemove', this.onMouseMoveDrag);
                document.removeEventListener('mouseup', this.onMouseUpDrag);
            };
            this.titleBar.addEventListener('mousedown', (e) => {
                if (e.target.tagName === 'BUTTON') return;
                startX = e.clientX;
                startY = e.clientY;
                document.addEventListener('mousemove', this.onMouseMoveDrag);
                document.addEventListener('mouseup', this.onMouseUpDrag);
            });
        }

        // Controls
        const controls = document.createElement('div');
        controls.className = 'lde-window-controls';

        const minBtn = this._createBtn('−', 'lde-window-btn-warning', () => this.callbacks.onMinimize && this.callbacks.onMinimize());
        const maxBtn = this._createBtn('◻', 'lde-window-btn-success', () => this.callbacks.onMaximize && this.callbacks.onMaximize());
        
        controls.appendChild(minBtn);
        if (this.options.resizable) {
            controls.appendChild(maxBtn);
        }
        if (this.options.closable) {
            const closeBtn = this._createBtn('✕', 'lde-window-btn-danger', () => this.callbacks.onClose && this.callbacks.onClose());
            controls.appendChild(closeBtn);
        }

        this.titleBar.appendChild(titleText);
        this.titleBar.appendChild(controls);
        this.element.appendChild(this.titleBar);
    }

    _createBtn(label, hoverClass, onClick) {
        const btn = document.createElement('button');
        btn.innerText = label;
        btn.className = `lde-window-btn ${hoverClass}`;
        btn.onclick = onClick;
        return btn;
    }

    _buildContentArea() {
        this.contentElement = document.createElement('div');
        this.contentElement.className = 'lde-window-content-area';
        this.element.appendChild(this.contentElement);
    }

    _buildResizeHandles() {
        const edges = ['right', 'bottom', 'bottom-right'];
        edges.forEach(edge => {
            const handle = document.createElement('div');
            handle.className = 'lde-resize-handle';
            
            if (edge === 'right') {
                handle.classList.add('lde-resize-handle-right');
            } else if (edge === 'bottom') {
                handle.classList.add('lde-resize-handle-bottom');
            } else {
                handle.classList.add('lde-resize-handle-corner');
            }
            
            let startX = 0, startY = 0;
            const onMouseMove = (e) => {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                startX = e.clientX;
                startY = e.clientY;
                if (this.callbacks.onResize) this.callbacks.onResize(dx, dy, edge);
            };
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            handle.addEventListener('mousedown', (e) => {
                startX = e.clientX;
                startY = e.clientY;
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                e.stopPropagation();
            });
            
            this.element.appendChild(handle);
        });
    }

    destroy() {
        if (this.onMouseMoveDrag && this.onMouseUpDrag) {
            document.removeEventListener('mousemove', this.onMouseMoveDrag);
            document.removeEventListener('mouseup', this.onMouseUpDrag);
        }
        // Resize handlers are bound inside closure, to be safe they should be tracked.
        // For now, let DOM GC handle it once elements are detached, but explicit listeners on `document` must be cleared.
        this.element.remove();
    }
}
