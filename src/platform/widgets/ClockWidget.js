export class Widget {
    constructor() {
        this.container = null;
        this.config = {};
        this.capabilityService = null;
        this.intervalId = null;
        this.timeElement = null;
        this.secondsElement = null;
        this.dateElement = null;
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
        
        // Grounding layout alignment structures using explicit layout boundaries
        body.style.display = 'flex';
        body.style.flexDirection = 'column';
        body.style.alignItems = 'center';
        body.style.justifyContent = 'center';
        body.style.padding = '16px';
        body.style.height = '100%';
        body.style.boxSizing = 'border-box';

        // Typographic layout flex strip to offset seconds from main readout
        const typographicStrip = document.createElement('div');
        typographicStrip.style.display = 'flex';
        typographicStrip.style.alignItems = 'baseline';

        // Hours & Minutes: Elegant, light-weight modern instrumentation styling
        this.timeElement = document.createElement('div');
        this.timeElement.style.fontSize = '48px';
        this.timeElement.style.fontWeight = '300';
        this.timeElement.style.lineHeight = '1';
        this.timeElement.style.letterSpacing = '-0.03em';
        this.timeElement.style.fontVariantNumeric = 'tabular-nums';
        this.timeElement.style.color = 'var(--lde-text-primary, #ffffff)';

        // Ticking Seconds: Scaled down, quietly tracked on the baseline
        this.secondsElement = document.createElement('div');
        this.secondsElement.style.fontSize = '16px';
        this.secondsElement.style.fontWeight = '400';
        this.secondsElement.style.fontVariantNumeric = 'tabular-nums';
        this.secondsElement.style.color = 'var(--lde-text-secondary, #888888)';
        this.secondsElement.style.opacity = '0.7';
        this.secondsElement.style.paddingLeft = '6px';

        // Contextual Calendar Line: High-end editorial structural metadata tracking
        this.dateElement = document.createElement('div');
        this.dateElement.style.fontSize = '11px';
        this.dateElement.style.fontWeight = '600';
        this.dateElement.style.textTransform = 'uppercase';
        this.dateElement.style.letterSpacing = '0.14em';
        this.dateElement.style.color = 'var(--lde-text-secondary, #888888)';
        this.dateElement.style.marginTop = '10px';
        this.dateElement.style.opacity = '0.6';

        // Append children to structural tree matrix
        typographicStrip.appendChild(this.timeElement);
        typographicStrip.appendChild(this.secondsElement);
        
        body.appendChild(typographicStrip);
        body.appendChild(this.dateElement);
        this.container.appendChild(body);

        this.updateTime();
        this.intervalId = setInterval(() => this.updateTime(), 1000);
    }

    updateTime() {
        if (!this.timeElement) return;
        const now = new Date();
        
        const baseOptions = {};
        if (this.config.timezone) {
            baseOptions.timeZone = this.config.timezone;
        }

        // Segmenting internal time string values to map distinct layout scales perfectly
        const hoursMinutesOptions = { ...baseOptions, hour: '2-digit', minute: '2-digit', hour12: false };
        const secondsOptions = { ...baseOptions, second: '2-digit' };
        const calendarOptions = { ...baseOptions, weekday: 'short', month: 'short', day: 'numeric' };

        this.timeElement.textContent = now.toLocaleTimeString(undefined, hoursMinutesOptions);
        
        if (this.secondsElement) {
            this.secondsElement.textContent = now.toLocaleTimeString(undefined, secondsOptions);
        }
        if (this.dateElement) {
            this.dateElement.textContent = now.toLocaleDateString(undefined, calendarOptions);
        }
    }

    update(config) {
        this.config = { ...this.config, ...config };
        this.updateTime();
    }

    onThemeChanged(theme) {
        // Core theme switching maps automatically over global CSS tokens.
    }

    unmount() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
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