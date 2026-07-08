/**
 * Dock
 *
 * Responsibility:
 * Renders the application launcher dock at the bottom of the screen.
 *
 * Does NOT:
 * - Launch applications directly
 */
export class Dock {
    constructor(onAppClick) {
        this.element = document.createElement('div');
        this.element.className = 'lde-dock';
        this.onAppClick = onAppClick;
    }

    /**
     * Renders a list of apps in the dock.
     * @param {Array} apps 
     */
    /**
     * Renders a list of apps in the dock.
     * @param {Array} apps 
     * @param {Array} runningAppIds
     */
    render(apps, runningAppIds = []) {
        this.element.innerHTML = '';
        const visibleApps = apps.filter(app => !app.hidden);
        for (const app of visibleApps) {
            const iconContainer = document.createElement('div');
            iconContainer.className = 'lde-dock-icon-container';
            iconContainer.title = app.name;

            const icon = document.createElement('div');
            icon.className = 'lde-dock-icon';
            icon.innerText = app.icon;
            
            const indicator = document.createElement('div');
            indicator.className = 'lde-dock-indicator';
            if (runningAppIds.includes(app.id)) {
                indicator.classList.add('active');
            }
            
            iconContainer.onclick = () => {
                if (this.onAppClick) this.onAppClick(app.id);
            };

            iconContainer.appendChild(icon);
            iconContainer.appendChild(indicator);
            this.element.appendChild(iconContainer);
        }
    }
}
