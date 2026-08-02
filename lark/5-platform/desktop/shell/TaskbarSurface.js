import { ShellComponent } from './ShellComponent.js';
import { WindowStates } from '../../../3-system/WindowStates.js';
import { EventBus } from '../../../1-kernel/SystemEventBus.js';

export class TaskbarSurface extends ShellComponent {
    initialize(registry, environment) {
        super.initialize(registry, environment);

        this.element = document.createElement('div');
        this.element.className = 'lde-taskbar';

        this.leftRegion = document.createElement('div');
        this.leftRegion.className = 'lde-taskbar-region';

        this.centerRegion = document.createElement('div');
        this.centerRegion.className = 'lde-taskbar-region';

        this.rightRegion = document.createElement('div');
        this.rightRegion.className = 'lde-taskbar-region';

        this.element.appendChild(this.leftRegion);
        this.element.appendChild(this.centerRegion);
        this.element.appendChild(this.rightRegion);

        this.handleDocumentClick = (e) => {
            if (this.powerDropdown && this.powerContainer && !this.powerContainer.contains(e.target)) {
                this.powerDropdown.classList.remove('show');
            }
        };

        this.activePid = null;
        this.windowStates = new Map();

        // Event handlers
        this._onWindowFocused = (payload) => {
            if (payload && payload.pid) {
                const processService = this.registry.get('ProcessService');
                const proc = processService ? processService.getProcess(payload.pid) : null;
                if (proc && proc.sessionId === this.environment.id) {
                    this.activePid = payload.pid;
                    this.windowStates.set(this.activePid, WindowStates.NORMAL);
                    this.renderTaskbar();
                }
            }
        };

        this._onWindowBlurred = (payload) => {
            if (payload && payload.pid === this.activePid) {
                this.activePid = null;
                this.renderTaskbar();
            }
        };

        this._onWindowMinimized = (payload) => {
            if (payload && payload.pid) {
                const processService = this.registry.get('ProcessService');
                const proc = processService ? processService.getProcess(payload.pid) : null;
                if (proc && proc.sessionId === this.environment.id) {
                    this.windowStates.set(payload.pid, WindowStates.MINIMIZED);
                    if (this.activePid === payload.pid) this.activePid = null;
                    this.renderTaskbar();
                }
            }
        };

        this._onWindowRestored = (payload) => {
            if (payload && payload.pid) {
                const processService = this.registry.get('ProcessService');
                const proc = processService ? processService.getProcess(payload.pid) : null;
                if (proc && proc.sessionId === this.environment.id) {
                    this.windowStates.set(payload.pid, WindowStates.NORMAL);
                    this.renderTaskbar();
                }
            }
        };

        this._onWindowClosed = (payload) => {
            if (payload && payload.pid) {
                this.windowStates.delete(payload.pid);
                if (this.activePid === payload.pid) this.activePid = null;
                this.renderTaskbar();
            }
        };

        this._onProcessLifecycle = () => this.renderTaskbar();
        this._onSettingsChanged = (payload) => {
            const key = payload?.data?.key || payload?.key;
            if (!key || key === 'dev.oskEnabled') {
                this.renderTaskbar();
            }
        };
    }

    resume() {
        const winSvc = this.registry.get('WindowService');
        const procSvc = this.registry.get('ProcessService');
        const dbSvc = this.registry.get('ApplicationDatabaseService');

        this.unsubs = [];
        
        if (winSvc) {
            this.unsubs.push(winSvc.onFocused(this._onWindowFocused));
            this.unsubs.push(winSvc.onBlurred(this._onWindowBlurred));
            this.unsubs.push(winSvc.onMinimized(this._onWindowMinimized));
            this.unsubs.push(winSvc.onRestored(this._onWindowRestored));
            this.unsubs.push(winSvc.onMaximized(this._onWindowRestored));
            this.unsubs.push(winSvc.onClosed(this._onWindowClosed));
            this.unsubs.push(winSvc.onCreated(this._onProcessLifecycle));
        }

        if (procSvc) {
            this.unsubs.push(procSvc.onStarted(this._onProcessLifecycle));
            this.unsubs.push(procSvc.onTerminated(this._onProcessLifecycle));
        }

        if (dbSvc) {
            this.unsubs.push(dbSvc.onChange(this._onProcessLifecycle));
        }

        EventBus.on('system.settings.changed', this._onSettingsChanged);
        EventBus.on('user.settings.changed', this._onSettingsChanged);
        document.addEventListener('click', this.handleDocumentClick);
        this.renderTaskbar();
    }

    suspend() {
        if (this.unsubs) {
            this.unsubs.forEach(unsub => unsub());
            this.unsubs = [];
        }
        EventBus.off('system.settings.changed', this._onSettingsChanged);
        EventBus.off('user.settings.changed', this._onSettingsChanged);
        document.removeEventListener('click', this.handleDocumentClick);
    }

    destroy() {
        document.removeEventListener('click', this.handleDocumentClick);
        super.destroy();
    }

    // Handlers querying services directly
    onAppClick(appId) {
        const intentService = this.registry.get('ApplicationIntentService');
        if (intentService) {
            intentService.launchWithIntent(appId, { action: 'open-app' }, { sessionId: this.environment.id });
        }
    }

    onTaskClick(pid) {
        const windowService = this.registry.get('WindowService');
        if (windowService) {
            windowService.toggleWindowByPid(pid);
        }
    }

    onPowerAction(action) {
        const powerService = this.registry.get('PowerService');
        if (!powerService) return;
        switch (action) {
            case 'lock': powerService.lock(); break;
            case 'logout': powerService.logout(); break;
            case 'reboot': powerService.reboot(); break;
            case 'shutdown': powerService.shutdown(); break;
        }
    }

    renderTaskbar() {
        const applicationService = this.registry.get('ApplicationService');
        const processService = this.registry.get('ProcessService');
        const sessionService = this.registry.get('SessionService');

        if (!applicationService || !processService) return;

        const allApps = applicationService.getInstalledApplications();
        const launcherApps = allApps.filter(a => !a.hidden);
        launcherApps.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));

        const windowService = this.registry.get('WindowService');
        const workspaceService = this.registry.get('WorkspaceService');
        const activeWorkspaceId = workspaceService ? workspaceService.getActiveWorkspaceId() : null;

        const procs = processService.getProcesses();
        const running = [];

        for (const p of procs) {
            const appDef = applicationService.getApplication(p.appId);
            if (appDef && !appDef.hidden && p.sessionId === this.environment.id) {
                let isOnActiveWorkspace = true;
                if (windowService && activeWorkspaceId) {
                    const wins = windowService.windowManager.getAllWindows().filter(w => w.pid === p.pid);
                    if (wins.length > 0) {
                        isOnActiveWorkspace = wins.some(w => w.workspaceId === activeWorkspaceId);
                    }
                }

                running.push({
                    pid: p.pid,
                    appId: p.appId,
                    appName: appDef.title || appDef.name,
                    isActive: this.activePid === p.pid,
                    isMinimized: this.windowStates.get(p.pid) === WindowStates.MINIMIZED,
                    isOnActiveWorkspace: isOnActiveWorkspace
                });
            }
        }

        const session = sessionService ? sessionService.getCurrentSession() : null;
        const workspaces = workspaceService ? workspaceService.getWorkspaces() : [];

        this._renderDOM({ launcher: launcherApps, running, activePid: this.activePid, session, workspaces, activeWorkspaceId, workspaceService });
    }

    _renderDOM({ launcher = [], running = [], activePid = null, session = null, workspaces = [], activeWorkspaceId = null, workspaceService = null }) {
        const applicationService = this.registry.get('ApplicationService');
        
        this.leftRegion.innerHTML = '';
        this.centerRegion.innerHTML = '';
        this.rightRegion.innerHTML = '';

        // --- Workspaces Switcher ---
        if (workspaceService && workspaces.length > 0) {
            const wsContainer = document.createElement('div');
            wsContainer.className = 'lde-taskbar-ws-container';
            wsContainer.style.display = 'flex';
            wsContainer.style.gap = '2px';
            wsContainer.style.marginLeft = '8px';

            workspaces.forEach((ws, index) => {
                const btn = document.createElement('div');
                btn.className = 'lde-taskbar-item';
                btn.textContent = `${index + 1}`;
                btn.title = ws.name || `Workspace ${index + 1}`;
                if (ws.id === activeWorkspaceId) {
                    btn.classList.add('active');
                }
                btn.onclick = () => {
                    workspaceService.switchTo(ws.id);
                    this.renderTaskbar();
                };

                btn.oncontextmenu = (e) => {
                    e.preventDefault();

                    const contextMenuService = this.registry.get('ContextMenuService');
                    if (contextMenuService) {
                        contextMenuService.showMenu(e.clientX, e.clientY, [
                            {
                                id: 'remove_ws',
                                label: 'Remove Workspace',
                                icon: '&#xE74D;',
                                disabled: workspaces.length <= 1
                            }
                        ]).then(selectedId => {
                            if (selectedId === 'remove_ws') {
                                workspaceService.removeWorkspace(ws.id);
                                this.renderTaskbar();
                            }
                        });
                    }
                };

                wsContainer.appendChild(btn);
            });

            const addBtn = document.createElement('div');
            addBtn.className = 'lde-taskbar-item';
            addBtn.innerHTML = '<i>&#xE109;</i>';
            addBtn.title = 'New Workspace';
            addBtn.onclick = () => {
                const newWs = workspaceService.createWorkspace();
                workspaceService.switchTo(newWs.id);
                this.renderTaskbar();
            };
            wsContainer.appendChild(addBtn);

            const settingsService = this.registry.get('SettingsService') || this.registry.get('UserSettingsService');
            const isOskEnabled = settingsService ? settingsService.getSetting('dev.oskEnabled') : false;

            if (isOskEnabled) {
                const oskBtn = document.createElement('div');
                oskBtn.className = 'lde-taskbar-item';
                oskBtn.innerHTML = '<i>&#xE765;</i>';
                oskBtn.title = 'On-Screen Keyboard (Experimental)';
                oskBtn.setAttribute('aria-label', 'Toggle On-Screen Keyboard');
                oskBtn.onclick = () => EventBus.emit('experimental.osk.toggle');
                wsContainer.appendChild(oskBtn);
            }

            this.leftRegion.appendChild(wsContainer);
        }

        // --- Center Region: Tasks ---
        for (const task of running) {
            const item = document.createElement('div');
            item.className = 'lde-taskbar-item';
            item.tabIndex = 0;
            item.setAttribute('aria-label', `Switch to ${task.appName || task.appId}`);
            if (task.isActive) {
                item.classList.add('active');
            }
            if (!task.isOnActiveWorkspace) {
                item.style.opacity = '0.5';
                item.title = `${task.appName || task.appId} (Background Workspace)`;
            }
            if (task.isMinimized) {
                item.classList.add('minimized');
            }

            item.textContent = task.appName || task.appId;

            item.onclick = () => {
                if (!task.isOnActiveWorkspace && workspaceService) {
                    const windowService = this.registry.get('WindowService');
                    if (windowService) {
                        const wins = windowService.windowManager.getAllWindows().filter(w => w.pid === task.pid);
                        if (wins.length > 0) {
                            workspaceService.switchTo(wins[0].workspaceId);
                        }
                    }
                }
                this.onTaskClick(task.pid);
            };

            this.centerRegion.appendChild(item);
        }

        // --- Right Region: Widgets ---
        const searchBtn = document.createElement('div');
        searchBtn.className = 'lde-taskbar-item';
        searchBtn.innerHTML = '<i>&#xE721;</i>';
        searchBtn.tabIndex = 0;
        searchBtn.title = 'Spotlight Search';
        searchBtn.setAttribute('aria-label', 'Spotlight Search');
        searchBtn.onclick = () => EventBus.emit('sys.shell.search.toggle');
        this.rightRegion.appendChild(searchBtn);
        
        const notifBtn = document.createElement('div');
        notifBtn.className = 'lde-taskbar-item';
        notifBtn.innerHTML = '<i>&#xEA8F;</i>';
        notifBtn.tabIndex = 0;
        notifBtn.setAttribute('aria-label', 'Notifications');
        notifBtn.onclick = () => EventBus.emit('sys.shell.notifications.toggle');
        this.rightRegion.appendChild(notifBtn);

        // addPlaceholder('Clock');

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

        addMenuItem('Logout', () => this.onPowerAction('logout'));
        addMenuItem('Reboot', () => this.onPowerAction('reboot'));
        addMenuItem('Shutdown', () => this.onPowerAction('shutdown'));

        userBtn.onclick = (e) => {
            e.stopPropagation();
            this.powerDropdown.classList.toggle('show');
        };

        this.powerContainer.appendChild(userBtn);
        this.powerContainer.appendChild(this.powerDropdown);
        this.rightRegion.appendChild(this.powerContainer);
    }
}
