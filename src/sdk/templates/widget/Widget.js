export default class Widget {
    constructor(context) {
        this.context = context;
        this.element = document.createElement('div');
        this.element.style.padding = '10px';
        this.element.style.height = '100%';
        this.element.style.boxSizing = 'border-box';
        this.element.style.background = 'var(--surface-1)';
        this.element.style.borderRadius = '8px';
        
        this.element.innerHTML = `
            <h3 style="margin-top: 0;">Example Widget</h3>
            <p>Widget content goes here.</p>
        `;
    }

    mount(parent) {
        parent.appendChild(this.element);
    }

    unmount() {
        if (this.element.parentElement) {
            this.element.parentElement.removeChild(this.element);
        }
    }
}
