import { EventBus } from '../../../kernel/SystemEventBus.js';

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
        
        const UserSettingsService = this.registry.get('UserSettingsService');
        const updateWallpaper = () => {
            const wallpaperColor = UserSettingsService ? UserSettingsService.getSetting('desktop.wallpaper') || '#1e1e1e' : '#1e1e1e';
            this.element.style.backgroundColor = wallpaperColor;
        };
        
        updateWallpaper();
        
        this.onSettingsChanged = (payload) => {
            // Re-eval on any setting change (handles full profile load or specific wallpaper change)
            if (!payload.key || payload.key === 'desktop.wallpaper') {
                updateWallpaper();
                if (payload.key) {
                    EventBus.emit('desktop:wallpaper', { severity: 'Info', source: 'Wallpaper', message: `Wallpaper changed to ${payload.value}` });
                }
            }
        };
        
        EventBus.on('user.settings.changed', this.onSettingsChanged);
    }

    destroy() {
        if (typeof EventBus.off === 'function') {
            EventBus.off('user.settings.changed', this.onSettingsChanged);
        }
        this.element.remove();
    }
}
