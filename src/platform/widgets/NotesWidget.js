export class Widget {
    constructor() {
        this.container = null;
        this.config = {};
        this.capabilityService = null;
        this.textarea = null;
        this.menuElement = null;
    }

    initialize(config, capabilityService) {
        this.config = config || {};
        this.capabilityService = capabilityService;
    }

    mount(container) {
        this.container = container;
        this.container.classList.add('lde-widget-card');
        
        // Base styling configurations for the outer widget card frame
        this.container.style.position = 'relative';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.transition = 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease';
        this.container.style.overflow = 'hidden';

        const body = document.createElement('div');
        body.classList.add('lde-widget-body');
        body.style.padding = '0';
        body.style.display = 'flex';
        body.style.flex = '1';
        body.style.width = '100%';
        body.style.height = '100%';
        
        this.textarea = document.createElement('textarea');
        this.textarea.style.flex = '1';
        this.textarea.style.width = '100%';
        this.textarea.style.height = '100%';
        this.textarea.style.background = 'transparent';
        this.textarea.style.border = 'none';
        this.textarea.style.padding = '16px';
        this.textarea.style.resize = 'none';
        this.textarea.style.outline = 'none';
        this.textarea.style.fontFamily = 'inherit';
        this.textarea.style.fontSize = '14px';
        this.textarea.style.lineHeight = '1.5';
        this.textarea.style.boxSizing = 'border-box';
        this.textarea.placeholder = 'Type a quick note...';
        this.textarea.value = this.config.text || '';
        
        // Auto-save input changes directly to the config context
        this.textarea.addEventListener('input', (e) => {
            this.config.text = e.target.value;
        });

        body.appendChild(this.textarea);
        this.container.appendChild(body);

        // ========================================
        // Hover Customization Menu Construction
        // ========================================
        this.menuElement = document.createElement('div');
        
        // Ultra-premium frosted floating plate design
        this.menuElement.style.position = 'absolute';
        this.menuElement.style.top = '8px';
        this.menuElement.style.right = '8px';
        this.menuElement.style.display = 'flex';
        this.menuElement.style.alignItems = 'center';
        this.menuElement.style.gap = '10px';
        this.menuElement.style.padding = '6px 12px';
        this.menuElement.style.background = 'rgba(20, 20, 20, 0.85)';
        this.menuElement.style.backdropFilter = 'blur(12px)';
        this.menuElement.style.webkitBackdropFilter = 'blur(12px)';
        this.menuElement.style.border = '1px solid rgba(255, 255, 255, 0.08)';
        this.menuElement.style.borderRadius = '20px';
        this.menuElement.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
        this.menuElement.style.opacity = '0';
        this.menuElement.style.pointerEvents = 'none';
        this.menuElement.style.transition = 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        this.menuElement.style.zIndex = '100';

        // 1. Color Customizer Sub-section
        const colorsGroup = document.createElement('div');
        colorsGroup.style.display = 'flex';
        colorsGroup.style.alignItems = 'center';
        colorsGroup.style.gap = '6px';

        const colorPalette = [
            { name: 'default', bg: 'transparent', text: '' },
            { name: 'sage', bg: '#E2EFE0', text: '#2A3B29' },
            { name: 'cream', bg: '#F9F5E8', text: '#3E3A2F' },
            { name: 'blush', bg: '#F5E0E5', text: '#402B2F' },
            { name: 'lilac', bg: '#EDE0F5', text: '#382A40' },
            { name: 'blue', bg: '#E0EAF5', text: '#2A3440' }
        ];

        colorPalette.forEach(color => {
            const dot = document.createElement('button');
            dot.style.width = '12px';
            dot.style.height = '12px';
            dot.style.borderRadius = '50%';
            dot.style.border = color.name === 'default' ? '1px dashed rgba(255, 255, 255, 0.6)' : 'none';
            dot.style.background = color.name === 'default' ? 'transparent' : color.bg;
            dot.style.cursor = 'pointer';
            dot.style.padding = '0';
            dot.style.transition = 'transform 0.15s ease';
            dot.title = `Apply ${color.name} theme`;

            dot.onmouseenter = () => { dot.style.transform = 'scale(1.25)'; };
            dot.onmouseleave = () => { dot.style.transform = 'scale(1.0)'; };

            dot.onclick = () => {
                this.applyColorTheme(color);
            };

            colorsGroup.appendChild(dot);
        });

        // Split Divider rule
        const divider = document.createElement('div');
        divider.style.width = '1px';
        divider.style.height = '14px';
        divider.style.background = 'rgba(255, 255, 255, 0.15)';

        // 2. Layout Size Selector Sub-section
        const sizesGroup = document.createElement('div');
        sizesGroup.style.display = 'flex';
        sizesGroup.style.alignItems = 'center';
        sizesGroup.style.gap = '6px';

        const sizeOptions = [
            { label: 'S', width: '240px', height: '120px' },
            { label: 'M', width: '240px', height: '240px' },
            { label: 'L', width: '360px', height: '360px' }
        ];

        sizeOptions.forEach(opt => {
            const sizeBtn = document.createElement('button');
            sizeBtn.textContent = opt.label;
            sizeBtn.style.background = 'transparent';
            sizeBtn.style.border = 'none';
            sizeBtn.style.color = 'rgba(255, 255, 255, 0.6)';
            sizeBtn.style.fontSize = '10px';
            sizeBtn.style.fontWeight = '700';
            sizeBtn.style.cursor = 'pointer';
            sizeBtn.style.padding = '2px 4px';
            sizeBtn.style.transition = 'color 0.15s ease, transform 0.15s ease';

            sizeBtn.onmouseenter = () => {
                sizeBtn.style.color = '#ffffff';
                sizeBtn.style.transform = 'scale(1.1)';
            };
            sizeBtn.onmouseleave = () => {
                sizeBtn.style.color = 'rgba(255, 255, 255, 0.6)';
                sizeBtn.style.transform = 'scale(1.0)';
            };

            sizeBtn.onclick = () => {
                this.applySizeLayout(opt.width, opt.height);
            };

            sizesGroup.appendChild(sizeBtn);
        });

        this.menuElement.appendChild(colorsGroup);
        this.menuElement.appendChild(divider);
        this.menuElement.appendChild(sizesGroup);
        this.container.appendChild(this.menuElement);

        // Bind interactive mouse boundaries to control menu state transitions
        this.container.onmouseenter = () => {
            this.menuElement.style.opacity = '1';
            this.menuElement.style.pointerEvents = 'auto';
        };

        this.container.onmouseleave = () => {
            this.menuElement.style.opacity = '0';
            this.menuElement.style.pointerEvents = 'none';
        };

        // Restore historical state variables on initialization
        this.restoreState(colorPalette, sizeOptions);
    }

    applyColorTheme(color) {
        if (color.name === 'default') {
            this.container.style.backgroundColor = '';
            this.textarea.style.color = 'var(--lde-text-primary, #ffffff)';
            this.config.colorTheme = 'default';
        } else {
            this.container.style.backgroundColor = color.bg;
            this.textarea.style.color = color.text;
            this.config.colorTheme = color.name;
        }
    }

    applySizeLayout(width, height) {
        this.container.style.width = width;
        this.container.style.height = height;
        this.config.sizeWidth = width;
        this.config.sizeHeight = height;
    }

    restoreState(colorPalette, sizeOptions) {
        // Restore layout sizing constraints
        if (this.config.sizeWidth && this.config.sizeHeight) {
            this.applySizeLayout(this.config.sizeWidth, this.config.sizeHeight);
        } else {
            // Apply fallback small standard baseline
            this.applySizeLayout('240px', '240px');
        }

        // Restore visual color configurations
        if (this.config.colorTheme) {
            const matchedTheme = colorPalette.find(c => c.name === this.config.colorTheme);
            if (matchedTheme) {
                this.applyColorTheme(matchedTheme);
            }
        }
    }

    update(config) {
        this.config = { ...this.config, ...config };
        if (this.textarea && this.config.text !== undefined) {
            this.textarea.value = this.config.text;
        }
    }

    onThemeChanged(theme) {
        // Core theme updates fall back automatically unless a custom color theme is chosen
    }

    unmount() {
        if (this.container) {
            this.container.onmouseenter = null;
            this.container.onmouseleave = null;
            this.container.innerHTML = '';
        }
    }

    destroy() {
        this.unmount();
        this.container = null;
        this.capabilityService = null;
        this.textarea = null;
        this.menuElement = null;
    }
}