import { EventBus } from '../kernel/SystemEventBus.js';

/**
 * Wallpaper
 * 
 * Responsibility:
 * Renders the desktop background and responds to setting changes.
 * 
 * Does NOT:
 * - Handle general desktop UI layout
 * - Expose a public API for other applications
 */
export class Wallpaper {
    constructor(registry) {
        this.registry = registry;
        this.element = document.createElement('div');
        this.element.className = 'lde-desktop-bg';
        
        const SettingsService = this.registry.get('SettingsService');
        const wallpaperColor = SettingsService ? SettingsService.getSetting('desktop.wallpaper') || '#1e1e1e' : '#1e1e1e';
        this.element.style.backgroundColor = wallpaperColor;
        
        this.onSettingsChanged = (payload) => {
            if (payload.key === 'desktop.wallpaper') {
                this.element.style.backgroundColor = payload.value;
                EventBus.emit('desktop:wallpaper', { severity: 'Info', source: 'Wallpaper', message: `Wallpaper changed to ${payload.value}` });
            }
        };
        
        EventBus.on('settings:changed', this.onSettingsChanged);
    }

    destroy() {
        if (typeof EventBus.off === 'function') {
            EventBus.off('settings:changed', this.onSettingsChanged);
        }
        this.element.remove();
    }
}
