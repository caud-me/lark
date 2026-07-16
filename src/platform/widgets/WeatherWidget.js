export class Widget {
    constructor() {
        this.container = null;
        this.config = {};
        this.capabilityService = null;
        this.cityElement = null;
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
        
        // Tightened padding from 24px to 16px to save 16px of horizontal space
        body.style.display = 'flex';
        body.style.flexDirection = 'row';
        body.style.alignItems = 'center';
        body.style.justifyContent = 'space-between';
        body.style.padding = '16px'; 
        body.style.height = '100%';
        body.style.boxSizing = 'border-box';
        
        // Left Column: Core Weather Analytics metrics
        const metricsGroup = document.createElement('div');
        metricsGroup.style.display = 'flex';
        metricsGroup.style.alignItems = 'center';
        metricsGroup.style.gap = '8px'; // Slightly tighter gap

        // Scaled temperature down from 48px to 38px so it has room to breathe
        const tempEl = document.createElement('div');
        tempEl.style.fontSize = '38px';
        tempEl.style.fontWeight = '200';
        tempEl.style.lineHeight = '1';
        tempEl.style.letterSpacing = '-0.02em';
        tempEl.style.color = 'var(--lde-text-primary, #ffffff)';
        tempEl.textContent = '24°C';

        const iconEl = document.createElement('i');
        iconEl.style.fontStyle = 'normal';
        iconEl.style.fontFamily = 'Segoe MDL2 Assets';
        iconEl.style.fontSize = '24px'; // Tighter icon
        iconEl.style.color = 'var(--lde-accent, #0078d4)';
        iconEl.style.opacity = '0.85';
        iconEl.innerHTML = '&#xE706;'; 

        metricsGroup.appendChild(tempEl);
        metricsGroup.appendChild(iconEl);
        
        // Right Column: Geographic & Status Metadata
        const metaGroup = document.createElement('div');
        metaGroup.style.display = 'flex';
        metaGroup.style.flexDirection = 'column';
        metaGroup.style.alignItems = 'flex-end';
        metaGroup.style.textAlign = 'right';
        metaGroup.style.minWidth = '0'; // Prevents flex item from overflowing

        this.cityElement = document.createElement('div');
        this.cityElement.style.fontSize = '11px'; // Scaled down slightly
        this.cityElement.style.fontWeight = '700';
        this.cityElement.style.textTransform = 'uppercase';
        this.cityElement.style.letterSpacing = '0.1em';
        this.cityElement.style.color = 'var(--lde-text-primary, #ffffff)';
        this.cityElement.style.whiteSpace = 'nowrap';
        this.cityElement.style.overflow = 'hidden';
        this.cityElement.style.textOverflow = 'ellipsis';
        this.cityElement.textContent = this.config.city || 'Local';

        const statusNotice = document.createElement('div');
        statusNotice.style.fontSize = '9px'; // Scaled down slightly
        statusNotice.style.fontWeight = '600';
        statusNotice.style.textTransform = 'uppercase';
        statusNotice.style.letterSpacing = '0.04em';
        statusNotice.style.color = 'var(--lde-text-secondary, #888888)';
        statusNotice.style.marginTop = '2px';
        statusNotice.style.opacity = '0.45';
        statusNotice.style.whiteSpace = 'nowrap';
        statusNotice.textContent = 'Unavailable'; // Shortened "Service Unavailable" to fit

        metaGroup.appendChild(this.cityElement);
        metaGroup.appendChild(statusNotice);
        
        body.appendChild(metricsGroup);
        body.appendChild(metaGroup);
        this.container.appendChild(body);
    }

    update(config) {
        this.config = { ...this.config, ...config };
        if (this.cityElement) {
            this.cityElement.textContent = this.config.city || 'Local';
        }
    }

    onThemeChanged(theme) {
        // Automatically mapped via global style inheritance configurations
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
        this.cityElement = null;
    }
}