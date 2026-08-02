import { ShellComponent } from './ShellComponent.js';

export class WidgetSurface extends ShellComponent {
    initialize(registry, environment) {
        super.initialize(registry, environment);

        this.element = document.createElement('div');
        this.element.id = 'lde-widget-layer';
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.element.style.pointerEvents = 'none';
        this.element.style.zIndex = '0';

        this.activeWidgets = new Map();

        this._onWidgetChanged = this.renderWidgets.bind(this);
        
        this._onThemeChanged = (payload) => {
            const theme = payload.data?.theme || 'unknown';
            for (const active of this.activeWidgets.values()) {
                if (active.component.onThemeChanged) {
                    active.component.onThemeChanged(theme);
                }
            }
        };
    }

    resume() {
        const widgetSvc = this.registry.get('WidgetService');
        const themeSvc = this.registry.get('ThemeService');
        
        this.unsubs = [];
        if (widgetSvc) this.unsubs.push(widgetSvc.onChange(this._onWidgetChanged));
        if (themeSvc) this.unsubs.push(themeSvc.onChange(this._onThemeChanged));
        
        for (const active of this.activeWidgets.values()) {
            if (active.component.resume) {
                active.component.resume();
            }
        }
        
        this.renderWidgets();
    }

    suspend() {
        if (this.unsubs) {
            this.unsubs.forEach(unsub => unsub());
            this.unsubs = [];
        }
        
        for (const active of this.activeWidgets.values()) {
            if (active.component.suspend) {
                active.component.suspend();
            }
        }
    }

    destroy() {
        for (const active of this.activeWidgets.values()) {
            if (active.component.unmount) active.component.unmount();
            if (active.component.destroy) active.component.destroy();
            active.container.remove();
        }
        this.activeWidgets.clear();
        super.destroy();
    }

    async renderWidgets() {
        const widgetService = this.registry.get('WidgetService');
        const capabilityService = this.registry.get('CapabilityService');
        if (!widgetService) return;

        const instances = widgetService.getWidgets();
        const available = widgetService.getAvailableWidgets();
        
        // Remove unmounted instances
        const currentIds = new Set(instances.map(w => w.instanceId));
        for (const [id, active] of this.activeWidgets.entries()) {
            if (!currentIds.has(id)) {
                if (active.component.unmount) active.component.unmount();
                if (active.component.destroy) active.component.destroy();
                active.container.remove();
                this.activeWidgets.delete(id);
            }
        }

        // Mount or update instances
        for (const instance of instances) {
            let active = this.activeWidgets.get(instance.instanceId);
            
            if (!active) {
                const manifest = available.find(m => m.id === instance.widgetId);
                if (!manifest || !manifest.modulePath) continue;

                try {
                    const module = await import(manifest.modulePath);
                    if (!module.Widget) continue;
                    
                    const component = new module.Widget();
                    const container = document.createElement('div');
                    container.style.position = 'absolute';
                    container.style.pointerEvents = 'auto';
                    
                    if (component.initialize) {
                        component.initialize(instance.config || {}, capabilityService);
                    }
                    
                    this.element.appendChild(container);
                    if (component.mount) {
                        component.mount(container);
                    }
                    if (component.resume) {
                        component.resume();
                    }
                    
                    active = { instance, component, container };
                    this.activeWidgets.set(instance.instanceId, active);
                } catch (e) {
                    console.error(`[WidgetSurface] Failed to load widget ${instance.widgetId}`, e);
                    continue;
                }
            }

            active.container.style.left = `${instance.x}px`;
            active.container.style.top = `${instance.y}px`;
            active.container.style.width = `${instance.width}px`;
            active.container.style.height = `${instance.height}px`;

            if (active.component.update && JSON.stringify(active.instance.config) !== JSON.stringify(instance.config)) {
                active.component.update(instance.config || {});
            }
            active.instance = instance;
        }
    }
}
