export class Widget {
    constructor() {
        this.container = null;
        this.config = {};
        this.capabilityService = null;
    }

    initialize(config, capabilityService) {
        this.config = config || {};
        this.capabilityService = capabilityService;
    }

    mount(container) {
        this.container = container;
        this.container.classList.add('lde-widget-card');
        
        const body = document.createElement('div');
        body.classList.add('lde-widget-body');
        
        // Establish an elegant horizontal alignment layout
        body.style.display = 'flex';
        body.style.flexDirection = 'row';
        body.style.alignItems = 'center';
        body.style.justifyContent = 'center';
        body.style.padding = '20px 24px';
        body.style.height = '100%';
        body.style.boxSizing = 'border-box';
        
        const now = new Date();
        
        // Massive Numeric Date Anchor (Left Pane)
        const dateEl = document.createElement('div');
        dateEl.style.fontSize = '64px';
        dateEl.style.fontWeight = '200';
        dateEl.style.lineHeight = '1';
        dateEl.style.letterSpacing = '-0.04em';
        dateEl.style.color = 'var(--lde-text-primary, #ffffff)';
        dateEl.style.paddingRight = '20px';
        dateEl.textContent = now.getDate();
        
        // Contextual Column Wrapper (Right Pane)
        const metadataColumn = document.createElement('div');
        metadataColumn.style.display = 'flex';
        metadataColumn.style.flexDirection = 'column';
        metadataColumn.style.justifyContent = 'center';
        metadataColumn.style.paddingLeft = '20px';
        metadataColumn.style.borderLeft = '1px solid var(--lde-border, rgba(255, 255, 255, 0.12))';
        
        // Weekday Subtext: High-contrast accent tracking
        const dayEl = document.createElement('div');
        dayEl.style.fontSize = '11px';
        dayEl.style.fontWeight = '700';
        dayEl.style.textTransform = 'uppercase';
        dayEl.style.letterSpacing = '0.14em';
        dayEl.style.color = 'var(--lde-accent, #0078d4)';
        dayEl.textContent = now.toLocaleDateString(undefined, { weekday: 'long' });
        
        // Month & Year Subtext: Quiet, editorial text footprint
        const monthEl = document.createElement('div');
        monthEl.style.fontSize = '13px';
        monthEl.style.fontWeight = '400';
        monthEl.style.textTransform = 'uppercase';
        monthEl.style.letterSpacing = '0.06em';
        monthEl.style.color = 'var(--lde-text-secondary, #888888)';
        monthEl.style.marginTop = '4px';
        monthEl.style.opacity = '0.8';
        monthEl.textContent = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

        // Build structural hierarchy tree matrix
        metadataColumn.appendChild(dayEl);
        metadataColumn.appendChild(monthEl);
        
        body.appendChild(dateEl);
        body.appendChild(metadataColumn);
        
        this.container.appendChild(body);
    }

    update(config) {
        this.config = { ...this.config, ...config };
    }

    onThemeChanged(theme) {
        // Automatically maps over context updates using global CSS variables
    }

    unmount() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    destroy() {
        this.unmount();
        this.container = null;
        this.capabilityService = null;
    }
}