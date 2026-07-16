import { EventBus } from '../../../kernel/SystemEventBus.js';

/**
 * Taskbar
 *
 * Responsibility:
 * Renders the primary desktop shell component at the bottom of the screen.
 * Handles application launching, active tasks, session controls, and placeholders.
 *
 * Does NOT:
 * - Implement business logic regarding processes or users.
 * - Manually track state. It simply renders the state it receives.
 */
export class Taskbar {
    constructor(onAppClick, onTaskClick, onPowerAction) {
        this.onAppClick = onAppClick;
        this.onTaskClick = onTaskClick;
        this.onPowerAction = onPowerAction;

        this.element = document.createElement('div');
        this.element.className = 'lde-taskbar';

        // Setup Regions
        this.leftRegion = document.createElement('div');
        this.leftRegion.className = 'lde-taskbar-region';

        this.centerRegion = document.createElement('div');
        this.centerRegion.className = 'lde-taskbar-region';

        this.rightRegion = document.createElement('div');
        this.rightRegion.className = 'lde-taskbar-region';

        this.element.appendChild(this.leftRegion);
        this.element.appendChild(this.centerRegion);
        this.element.appendChild(this.rightRegion);

        // Global click handler to close dropdowns
        this.handleDocumentClick = (e) => {
            if (this.powerDropdown && this.powerContainer && !this.powerContainer.contains(e.target)) {
                this.powerDropdown.classList.remove('show');
            }
            if (this.appDropdown && this.appContainer && !this.appContainer.contains(e.target)) {
                this.appDropdown.classList.remove('show');
            }
        };
        document.addEventListener('click', this.handleDocumentClick);
    }

    /**
     * Re-renders the Taskbar with current system state.
     * @param {Object} state
     * @param {Array} state.pinnedApps - Apps pinned to the launcher
     * @param {Array} state.runningProcesses - Active tasks (unique applications or windows)
     * @param {Object} state.activeProcess - Currently focused task (optional)
     * @param {Object} state.session - Current user session
     */
    render({ launcher = [], running = [], activePid = null, session = null, widgets = {} }) {
        this.leftRegion.innerHTML = '';
        this.centerRegion.innerHTML = '';
        this.rightRegion.innerHTML = '';

        // --- Left Region: Launcher ---
        this.appContainer = document.createElement('div');
        this.appContainer.className = 'lde-taskbar-app-container';

        const launcherBtn = document.createElement('div');
        launcherBtn.className = 'lde-taskbar-item';
        launcherBtn.textContent = 'Start';
        launcherBtn.tabIndex = 0;
        launcherBtn.setAttribute('aria-label', 'Launcher');

        this.appDropdown = document.createElement('div');
        this.appDropdown.className = 'lde-app-dropdown';

        // Launcher Structure: Search, Pinned, Applications, Recent
        
        // 1. Search Input
        const searchInput = document.createElement('input');
        searchInput.className = 'lde-input';
        searchInput.placeholder = 'Search apps...';
        searchInput.style.margin = '8px';
        searchInput.style.width = 'calc(100% - 16px)';
        
        this.appDropdown.appendChild(searchInput);

        // 2. Pinned Placeholder
        const pinnedHeader = document.createElement('div');
        pinnedHeader.className = 'lde-app-dropdown-header';
        pinnedHeader.textContent = 'Pinned (future)';
        this.appDropdown.appendChild(pinnedHeader);

        // 3. Applications Container
        const appListContainer = document.createElement('div');
        
        const categories = {};
        for (const app of launcher) {
            const cat = app.category || 'Other';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(app);
        }

        const renderAppList = (filter = '') => {
            appListContainer.innerHTML = '';
            for (const [cat, apps] of Object.entries(categories)) {
                const filteredApps = apps.filter(app => {
                    if (!filter) return true;
                    const lowerFilter = filter.toLowerCase();
                    const titleMatch = (app.title || app.name || '').toLowerCase().includes(lowerFilter);
                    const descMatch = (app.description || '').toLowerCase().includes(lowerFilter);
                    const keywordMatch = (app.keywords || []).some(k => k.toLowerCase().includes(lowerFilter));
                    return titleMatch || descMatch || keywordMatch;
                });
                if (filteredApps.length === 0) continue;

                const catHeader = document.createElement('div');
                catHeader.className = 'lde-app-dropdown-header';
                catHeader.textContent = cat;
                appListContainer.appendChild(catHeader);

                const table = document.createElement('table');
                table.className = 'lde-table';
                table.style.tableLayout = 'fixed';
                table.style.width = '100%';
                
                const tbody = document.createElement('tbody');
                table.appendChild(tbody);

                for (const app of filteredApps) {
                    const item = document.createElement('tr');
                    item.className = 'lde-app-item';
                    item.title = `Launch ${app.title || app.name}`; // Launch hint
                    item.tabIndex = 0; // Focusable

                    const td = document.createElement('td');
                    td.style.padding = '8px';

                    const titleDiv = document.createElement('div');
                    titleDiv.style.overflow = 'hidden';
                    titleDiv.style.textOverflow = 'ellipsis';
                    titleDiv.style.whiteSpace = 'nowrap';
                    titleDiv.textContent = app.title || app.name;
                    
                    const descDiv = document.createElement('div');
                    descDiv.style.color = 'var(--text-secondary, #888)';
                    descDiv.style.fontSize = '12px';
                    descDiv.style.overflow = 'hidden';
                    descDiv.style.textOverflow = 'ellipsis';
                    descDiv.style.whiteSpace = 'nowrap';
                    descDiv.textContent = `${app.version ? 'v' + app.version + ' - ' : ''}${app.description || ''}`;

                    td.appendChild(titleDiv);
                    if (app.description || app.version) td.appendChild(descDiv);

                    item.appendChild(td);

                    item.onclick = (e) => {
                        e.stopPropagation();
                        this.appDropdown.classList.remove('show');
                        this.onAppClick && this.onAppClick(app.id);
                    };
                    tbody.appendChild(item);
                }
                appListContainer.appendChild(table);
            }
        };

        renderAppList('');

        searchInput.oninput = (e) => {
            renderAppList(e.target.value);
        };

        searchInput.onkeydown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const firstItem = appListContainer.querySelector('.lde-app-item');
                if (firstItem) firstItem.focus();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const firstItem = appListContainer.querySelector('.lde-app-item');
                if (firstItem) firstItem.click();
            }
        };

        appListContainer.onkeydown = (e) => {
            const items = Array.from(appListContainer.querySelectorAll('.lde-app-item'));
            const idx = items.indexOf(document.activeElement);
            if (idx === -1) return;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (idx < items.length - 1) items[idx + 1].focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (idx > 0) items[idx - 1].focus();
                else searchInput.focus();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                document.activeElement.click();
            }
        };

        this.appDropdown.appendChild(appListContainer);

        // 4. Recently Used Placeholder
        const recentHeader = document.createElement('div');
        recentHeader.className = 'lde-app-dropdown-header';
        recentHeader.textContent = 'Recently Used (future)';
        this.appDropdown.appendChild(recentHeader);

        launcherBtn.onclick = (e) => {
            e.stopPropagation();
            this.appDropdown.classList.toggle('show');
            if (this.appDropdown.classList.contains('show')) searchInput.focus();
        };

        this.appContainer.appendChild(launcherBtn);
        this.appContainer.appendChild(this.appDropdown);
        this.leftRegion.appendChild(this.appContainer);

        // --- Center Region: Tasks ---
        for (const task of running) {
            const item = document.createElement('div');
            item.className = 'lde-taskbar-item';
            item.tabIndex = 0;
            item.setAttribute('aria-label', `Switch to ${task.appName || task.appId}`);
            if (task.isActive) {
                item.classList.add('active');
            }
            if (task.isMinimized) {
                item.classList.add('minimized');
            }
            item.textContent = task.appName || task.appId;
            item.onclick = () => this.onTaskClick && this.onTaskClick(task.pid);
            this.centerRegion.appendChild(item);
        }

        // --- Right Region: Widgets ---
        const addPlaceholder = (text) => {
            const el = document.createElement('div');
            el.className = 'lde-taskbar-item placeholder';
            el.textContent = text;
            this.rightRegion.appendChild(el);
        };

        addPlaceholder('Search');
        
        const notifBtn = document.createElement('div');
        notifBtn.className = 'lde-taskbar-item';
        notifBtn.textContent = '🔔';
        notifBtn.tabIndex = 0;
        notifBtn.setAttribute('aria-label', 'Notifications');
        notifBtn.onclick = () => EventBus.emit('taskbar:toggleNotifications');
        this.rightRegion.appendChild(notifBtn);

        addPlaceholder('Clock');

        // Session / Power Control
        this.powerContainer = document.createElement('div');
        this.powerContainer.className = 'lde-taskbar-power-container';

        const userBtn = document.createElement('div');
        userBtn.className = 'lde-taskbar-item';
        userBtn.tabIndex = 0;
        userBtn.setAttribute('aria-label', 'Session Controls');
        const username = session && session.user ? session.user.username : 'Unknown';
        userBtn.textContent = `${username} ⏻`;

        this.powerDropdown = document.createElement('div');
        this.powerDropdown.className = 'lde-power-dropdown';

        const addMenuItem = (text, onClick) => {
            const item = document.createElement('div');
            item.className = 'lde-power-item';
            item.textContent = text;
            item.tabIndex = 0;
            item.setAttribute('aria-label', text);
            item.onclick = onClick;
            item.onkeydown = (e) => {
                if (e.key === 'Enter') onClick();
            };
            this.powerDropdown.appendChild(item);
        };

        // addMenuItem('Lock', () => this.onPowerAction && this.onPowerAction('lock'));
        addMenuItem('Logout', () => this.onPowerAction && this.onPowerAction('logout'));
        addMenuItem('Reboot', () => this.onPowerAction && this.onPowerAction('reboot'));
        addMenuItem('Shutdown', () => this.onPowerAction && this.onPowerAction('shutdown'));

        userBtn.onclick = (e) => {
            e.stopPropagation();
            this.powerDropdown.classList.toggle('show');
        };

        this.powerContainer.appendChild(userBtn);
        this.powerContainer.appendChild(this.powerDropdown);
        this.rightRegion.appendChild(this.powerContainer);
    }

    destroy() {
        document.removeEventListener('click', this.handleDocumentClick);
        this.element.remove();
    }

    toggleLauncher() {
        if (this.appDropdown) {
            this.appDropdown.classList.toggle('show');
            if (this.appDropdown.classList.contains('show')) {
                const searchInput = this.appDropdown.querySelector('input');
                if (searchInput) searchInput.focus();
            }
        }
    }
}
