/**
 * PowerMenu
 * 
 * Responsibility:
 * Renders the session/power control dropdown menu on the desktop.
 * 
 * Does NOT:
 * - Implement power actions (uses PowerService)
 */
export class PowerMenu {
    constructor(registry) {
        this.registry = registry;
        const SessionService = this.registry.get('SessionService');
        const PowerService = this.registry.get('PowerService');
        
        const session = SessionService ? SessionService.getCurrentSession() : null;
        const username = session ? session.user.username : 'Unknown';

        this.element = document.createElement('div');
        this.element.className = 'lde-power-menu-container';

        const powerBtn = document.createElement('div');
        powerBtn.textContent = `${username} ⏻`;
        powerBtn.className = 'lde-power-btn';

        const dropdown = document.createElement('div');
        dropdown.className = 'lde-power-dropdown';

        const addMenuItem = (text, onClick) => {
            const item = document.createElement('div');
            item.textContent = text;
            item.className = 'lde-power-item';
            item.onclick = onClick;
            dropdown.appendChild(item);
        };

        addMenuItem('Lock', () => PowerService && PowerService.lock());
        addMenuItem('Logout', () => PowerService && PowerService.logout());
        addMenuItem('Reboot', () => PowerService && PowerService.reboot());
        addMenuItem('Shutdown', () => PowerService && PowerService.shutdown());

        powerBtn.onclick = () => {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        };

        this.handleDocumentClick = (e) => {
            if (!this.element.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        };
        document.addEventListener('click', this.handleDocumentClick);

        this.element.appendChild(powerBtn);
        this.element.appendChild(dropdown);
    }

    destroy() {
        document.removeEventListener('click', this.handleDocumentClick);
        this.element.remove();
    }
}
