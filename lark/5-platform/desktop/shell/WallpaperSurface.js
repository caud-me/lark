import { ShellComponent } from './ShellComponent.js';

export class WallpaperSurface extends ShellComponent {
    initialize(registry, environment) {
        super.initialize(registry, environment);
        
        this.element = document.createElement('div');
        this.element.className = 'lde-desktop-bg omni-wallpaper-surface';
        this.element.style.backgroundSize = 'cover';
        this.element.style.backgroundPosition = 'center';
        this.element.style.backgroundRepeat = 'no-repeat';

        this.onWallpaperUpdated = () => {
            this.updateWallpaper();
        };

        const wallpaperSvc = this.registry.get('WallpaperService');
        if (wallpaperSvc) {
            this.unsubWallpaper = wallpaperSvc.onChange(() => this.onWallpaperUpdated());
        }
        
        this.updateWallpaper();
    }

    async updateWallpaper() {
        this.element.classList.add('omni-wallpaper-surface');
        const WallpaperService = this.registry.get('WallpaperService');
        if (!WallpaperService) {
            this.element.style.backgroundImage = 'none';
            return;
        }

        const url = await WallpaperService.getWallpaperUrl();
        if (url) {
            this.element.style.backgroundImage = `url(${url})`;
            this.element.style.backgroundSize = 'cover';
            this.element.style.backgroundPosition = 'center';
            this.element.style.backgroundRepeat = 'no-repeat';
        } else {
            this.element.style.backgroundImage = 'none';
        }
    }

    resume() {
        const wallpaperSvc = this.registry.get('WallpaperService');
        if (wallpaperSvc && !this.unsubWallpaper) {
            this.unsubWallpaper = wallpaperSvc.onChange(() => this.onWallpaperUpdated());
        }
        this.updateWallpaper();

        this._onContextMenu = async (e) => {
            if (e.target !== this.element) return;
            e.preventDefault();
            
            const contextMenuService = this.registry.get('ContextMenuService');
            if (!contextMenuService) return;
            
            const actions = [
                { id: 'personalize', label: 'Personalize', icon: '&#xE790;' },
                { type: 'separator' },
                { id: 'finder', label: 'Launch Finder', icon: '&#xE8B7;' },
                { id: 'terminal', label: 'Launch Terminal', icon: '&#xE943;' },
                { id: 'eventviewer', label: 'Launch Event Viewer', icon: '&#xE7F4;' },
                { id: 'activitymonitor', label: 'Launch Activity Monitor', icon: '&#xE7F4;' },
                
            ];
            
            const result = await contextMenuService.showMenu(e.clientX, e.clientY, actions);
            if (result === 'personalize') {
                const intentService = this.registry.get('ApplicationIntentService');
                if (intentService) {
                    intentService.launchWithIntent('sys.settings', { type: 'settings.openPage', payload: { page: 'personalization' } });
                }
            } else if (result === 'finder') {
                const xyz = this.registry.get('ProcessService');
                if (xyz) {
                    await xyz.startProcess('sys.finder')
                }
            } else if (result === 'terminal') {
                const xyz = this.registry.get('ProcessService');
                if (xyz) {
                    await xyz.startProcess('sys.terminal')
                }
            } else if (result === 'eventviewer') {
                const xyz = this.registry.get('ProcessService');
                if (xyz) {
                    await xyz.startProcess('sys.eventviewer')
                }
            } else if (result === 'activitymonitor') {
                const xyz = this.registry.get('ProcessService');
                if (xyz) {
                    await xyz.startProcess('sys.activitymonitor')
                }
            }
        };

        this.element.addEventListener('contextmenu', this._onContextMenu);
    }

    suspend() {
        if (this.unsubWallpaper) {
            this.unsubWallpaper();
            this.unsubWallpaper = null;
        }
        this.element.removeEventListener('contextmenu', this._onContextMenu);
    }
}
