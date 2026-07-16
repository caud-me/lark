
// import { EventBus } from '../../kernel/SystemEventBus.js';

// import { Sidebar } from '../../application/components/Sidebar.js';
// import { SplitView } from '../../application/components/SplitView.js';
// import { ScrollContainer } from '../../application/components/ScrollContainer.js';
// import { ToolbarComponent } from './filemanager/ToolbarComponent.js';
// import { FileListComponent } from './filemanager/FileListComponent.js';
// import { StatusBarComponent } from './filemanager/StatusBarComponent.js';

// class FileManagerApplication extends BaseApplication {
//     constructor(context) {
//         super(context);

//         this.toolbar = new ToolbarComponent(context);
        
//         this.sidebar = new Sidebar(context, {
//             groups: [{
//                 label: 'PLACES',
//                 items: [] // Future navigation links
//             }]
//         });
        
//         this.fileList = new FileListComponent(context);
        
//         this.scrollContainer = new ScrollContainer(context, {
//             content: this.fileList
//         });
        
//         this.splitView = new SplitView(context, {
//             leftPane: this.sidebar,
//             rightPane: this.scrollContainer
//         });
        
//         // Ensure split view fills remaining vertical space
//         this.splitView.container.classList.add('flex-grow-1');

//         this.statusBar = new StatusBarComponent(context);

//         const comps = [
//             this.toolbar,
//             this.sidebar,
//             this.fileList,
//             this.scrollContainer,
//             this.splitView,
//             this.statusBar
//         ];
        
//         for (const comp of comps) {
//             this.manageComponent(comp);
//         }
//     }

//     async ready() {
//         const processService = this.context.getService('ProcessService');
//         const proc = processService.getProcess(this.context.pid);
//         const username = proc ? proc.ownerUsername : 'system';
//         const homeDirectory = username === 'system' ? '/' : `/users/${username}`;

//         this.context.state.update({
//             currentPath: homeDirectory,
//             selectedPaths: [],
//             isFocused: true
//         });

//         const winId = this.context.window.id;
//         EventBus.on('window.focused', (payload) => {
//             if (payload.data && payload.data.pid === this.context.pid) {
//                 this.context.state.update({ isFocused: true });
//             }
//         });
//         EventBus.on('window.blurred', (payload) => {
//             if (payload.data && payload.data.pid === this.context.pid) {
//                 this.context.state.update({ isFocused: false });
//             }
//         });
//     }

//     refresh() {
//         this.context.window.contentElement.className = 'lde-app-container flex-col p-0';
//         this.context.window.contentElement.style.userSelect = 'none';
//         this.context.window.contentElement.innerHTML = '';

//         this.toolbar.mount(this.context.window.contentElement);
//         this.splitView.mount(this.context.window.contentElement);
//         this.statusBar.mount(this.context.window.contentElement);
//     }
// }

// export default {
//     run: async (registry, pid) => {
//         const WindowService = registry.get('WindowService');

//         EventBus.emit('fileManager:start', { severity: 'Info', source: 'FileManager', message: 'Started File Manager.' });

//         const win = WindowService.createWindow({
//             title: 'File Manager',
//             width: 650,
//             height: 450,
//             pid
//         });

//         const context = new ApplicationContext(registry, win, pid);
//         const app = new FileManagerApplication(context);
//         await app.mount();
//         app.refresh();
//     }
// };

// this will be renamed to finder.
import { EventBus } from '../../kernel/SystemEventBus.js';
import { 
    omni_card,
    omni_preferenceItem,
    omni_listItem,
    omni_searchbar,
    omni_sidebarTab,
    omni_button,
    omni_group,
    omni_imagelistItem
} from '../../platform/settings/SettingsComponents.js';

/**
 * Finder Application
 *
 * Responsibility:
 * Provides a unified 2-panel interface for managing directories, creating files, 
 * renaming items, and executing programs within Lark OS.
 * Conforms strictly to the Omni design system standard with zero custom inline styles.
 */
export default {
    run: async (registry, pid, options = {}) => {
        // ========================================
        // Service Retrieval & Verification
        // ========================================
        const WindowService = registry.get('WindowService');
        const FileService = registry.get('FileService');
        const DialogService = registry.get('DialogService');
        const ProcessService = registry.get('ProcessService');
        const ShortcutService = registry.get('ShortcutService');
        const ClipboardService = registry.get('ClipboardService');
        const ContextMenuService = registry.get('ContextMenuService');
        const AssociationService = registry.get('AssociationService');

        if (!WindowService || !FileService || !DialogService || !ProcessService) {
            console.error('[Finder] Required services missing.');
            return;
        }

        const win = WindowService.createWindow({
            title: 'Finder',
            width: 840,
            height: 540,
            pid
        });

        // Initialize user directory context
        const activeProcess = ProcessService.getProcess(pid);
        const ownerUsername = activeProcess ? activeProcess.ownerUsername : 'system';
        const homeDirectory = ownerUsername === 'system' ? '/' : `/users/${ownerUsername}`;

        // Pre-calculate paths for session dedicated folders
        const pathDesktop = homeDirectory === '/' ? '/Desktop' : `${homeDirectory}/Desktop`;
        const pathDocuments = homeDirectory === '/' ? '/Documents' : `${homeDirectory}/Documents`;
        const pathDownloads = homeDirectory === '/' ? '/Downloads' : `${homeDirectory}/Downloads`;
        const pathLibrary = homeDirectory === '/' ? '/Library' : `${homeDirectory}/Library`;
        const pathPictures = homeDirectory === '/' ? '/Pictures' : `${homeDirectory}/Pictures`;

        // ========================================
        // Local Application State
        // ========================================
        let currentPath = homeDirectory;

        const executeIntent = async (intent) => {
            if (intent && intent.type === 'files.openDirectory' && intent.payload && intent.payload.path) {
                let targetPath = intent.payload.path;
                if (targetPath.startsWith('~/')) {
                    targetPath = targetPath.replace('~', homeDirectory === '/' ? '' : homeDirectory);
                }
                currentPath = targetPath;
            } else if (intent && intent.action === 'open-file' && intent.path) {
                currentPath = intent.path; // legacy
            }
        };
        const proc = ProcessService ? ProcessService.getProcess(pid) : null;
        if (proc) {
            proc.handleIntent = async (intent) => {
                await executeIntent(intent);
                triggerRefresh();
            };
        }

        if (options.intent) {
            await executeIntent(options.intent);
        } else if (options.args && options.args.length > 0) {
            await executeIntent({ action: 'open-file', path: options.args[0] });
        }

        let selectedPaths = []; 
        let searchQuery = '';   
        let isFocused = true;
        let registeredShortcutsList = [];

        // ========================================
        // File System Safe Helpers
        // ========================================
        const getParentPath = (path) => {
            if (path === '/') return '/';
            const parts = path.split('/').filter(Boolean);
            parts.pop();
            return '/' + parts.join('/');
        };

        const resolvePath = (base, relativeName) => {
            return (base === '/' ? '' : base) + '/' + relativeName;
        };

        const formatBytes = (bytes) => {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        };

        // ========================================
        // Application Dialog & Operation Hooks
        // ========================================
        const handleNewFolder = async () => {
            const folderName = await DialogService.prompt('Folder name:', '', 'New Folder');
            if (folderName && !folderName.includes('/')) {
                try {
                    const targetPath = resolvePath(currentPath, folderName);
                    FileService.createDirectory(targetPath);
                    triggerRefresh();
                } catch (err) {
                    await DialogService.alert(err.message, 'Error');
                }
            } else if (folderName) {
                await DialogService.alert('Invalid folder name.', 'Error');
            }
        };

        const handleNewFile = async () => {
            const fileName = await DialogService.prompt('File name:', '', 'New File');
            if (fileName && !fileName.includes('/')) {
                try {
                    const targetPath = resolvePath(currentPath, fileName);
                    FileService.createFile(targetPath, 'Hello World');
                    triggerRefresh();
                } catch (err) {
                    await DialogService.alert(err.message, 'Error');
                }
            } else if (fileName) {
                await DialogService.alert('Invalid file name.', 'Error');
            }
        };

        const handleRename = async () => {
            if (selectedPaths.length !== 1) return;
            const targetPath = selectedPaths[0];
            const oldName = targetPath.split('/').pop();

            const newName = await DialogService.prompt('New name:', oldName, 'Rename');
            if (newName && newName !== oldName) {
                try {
                    FileService.rename(targetPath, newName);
                    selectedPaths = [];
                    updateSidebar();
                    triggerRefresh();
                } catch (err) {
                    await DialogService.alert(err.message, 'Error');
                }
            }
        };

        const handleCopy = () => {
            if (selectedPaths.length > 0 && ClipboardService) {
                ClipboardService.copyText(`DE_COPY_FILES:${selectedPaths.join(',')}`);
                triggerRefresh(); // Refresh toolbar states
            }
        };

        const handlePaste = async () => {
            if (!ClipboardService) return;
            const text = ClipboardService.readText();
            if (text && text.startsWith('DE_COPY_FILES:')) {
                const pathsToCopy = text.substring('DE_COPY_FILES:'.length).split(',');
                try {
                    for (let i = 0; i < pathsToCopy.length; i++) {
                        const p = pathsToCopy[i];
                        if (FileService.exists(p)) {
                            const fileName = p.split('/').pop();
                            let destPath = resolvePath(currentPath, fileName);
                            if (destPath !== p) {
                                if (FileService.exists(destPath)) {
                                    FileService.duplicate(p); 
                                } else {
                                    FileService.copy(p, destPath);
                                }
                            } else {
                                FileService.duplicate(p);
                            }
                        }
                    }
                    triggerRefresh();
                } catch (err) {
                    await DialogService.alert(err.message, 'Error');
                }
            }
        };

        const handleDeleteSelected = async () => {
            if (selectedPaths.length === 0) return;
            const confirmDel = await DialogService.confirm(
                `Delete ${selectedPaths.length} item(s)?`, 
                'Confirm Deletion'
            );
            if (confirmDel) {
                try {
                    for (let i = 0; i < selectedPaths.length; i++) {
                        FileService.delete(selectedPaths[i]);
                    }
                    selectedPaths = [];
                    updateSidebar();
                    triggerRefresh();
                } catch (err) {
                    await DialogService.alert(err.message, 'Error');
                }
            }
        };

        // ========================================
        // Orchestration & Presentation Layer
        // ========================================
        const renderShell = () => {
            const container = document.createElement('div');
            container.className = 'omni-layout-row';

            container.innerHTML = `
                <!-- Left Panel: Sidebar Nav & Actions -->
                <div id="fm-sidebar-${win.id}" class="omni-panel-1">
                    <!-- Populated dynamically -->
                </div>

                <!-- Right Panel: Main Finder Viewport -->
                <div class="omni-panel-2">
                    <div id="fm-content-viewport-${win.id}" class="layout-v flex-gap-8 omni-panel-fill">
                        
                        <!-- Top Action Toolbar (Icon-Only Buttons above Address/Search) -->
                        <div id="fm-toolbar-${win.id}" class="layout-h flex-gap-8 flex-align-center">
                            <!-- Populated dynamically with action hooks -->
                        </div>

                        <!-- Path Header & Active Search Field -->
                        <div class="layout-h flex-gap-8 flex-align-center">
                            <div class="comp-searchbar flex-1">
                                <i>&#xE8B7;</i>
                                <input type="text" id="fm-path-bar-${win.id}" class="comp-input" readonly>
                            </div>
                            <div class="comp-searchbar flex-1">
                                <i>&#xE721;</i>
                                <input type="text" id="fm-search-bar-${win.id}" class="comp-input" placeholder="Filter files...">
                            </div>
                        </div>

                        <!-- Directory Entries Content Table -->
                        <div class="omni-table-scroll omni-panel-fill">
                            <table class="omni-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Size</th>
                                    </tr>
                                </thead>
                                <tbody id="fm-entries-${win.id}">
                                    <!-- Populated dynamically -->
                                </tbody>
                            </table>
                        </div>

                        <!-- Footer Area -->
                        <div class="layout-h flex-space-between flex-align-center padding-8">
                            <small id="fm-status-items-${win.id}">0 items</small>
                            <small id="fm-status-storage-${win.id}"></small>
                        </div>
                    </div>
                </div>
            `;

            win.contentElement.appendChild(container);

            const searchInput = win.contentElement.querySelector(`#fm-search-bar-${win.id}`);
            if (searchInput) {
                searchInput.oninput = (e) => {
                    searchQuery = e.target.value.toLowerCase();
                    triggerRefresh();
                };
            }
        };

        const updateSidebar = () => {
            const sidebarEl = win.contentElement.querySelector(`#fm-sidebar-${win.id}`);
            if (!sidebarEl) return;

            sidebarEl.innerHTML = '';

            // 1. PLACES (System Root level and Recent shortcuts)
            let placesHtml = '';
            placesHtml += omni_sidebarTab('place-home', currentPath === homeDirectory, '&#xE80F;', 'Home');
            placesHtml += omni_sidebarTab('place-root', currentPath === '/', '&#xF12B;', 'System Root');
            sidebarEl.innerHTML += omni_group('PLACES', placesHtml);

            // 2. ME SECTION (Redirects to dedicated session user directories)
            let meHtml = '';
            meHtml += omni_sidebarTab('me-desktop', currentPath === pathDesktop, '&#xF246;', 'Desktop');
            meHtml += omni_sidebarTab('me-documents', currentPath === pathDocuments, '&#xE8A5;', 'Documents');
            meHtml += omni_sidebarTab('me-downloads', currentPath === pathDownloads, '&#xE118;', 'Downloads');
            meHtml += omni_sidebarTab('me-library', currentPath === pathLibrary, '&#xE8F1;', 'Library');
            meHtml += omni_sidebarTab('me-pictures', currentPath === pathPictures, '&#xE158;', 'Pictures');
            sidebarEl.innerHTML += omni_group('Me', meHtml);

            // 3. STORAGE UTILIZATION (Clean Local Storage Quota Tracker)
            if (typeof FileService.getUsage === 'function') {
                const used = FileService.getUsage();
                const total = FileService.getCapacity() || 1;
                const usagePercent = Math.min(100, Math.max(0, Math.round((used / total) * 100)));

                const storageIndicatorHtml = omni_imagelistItem(
                    'hdd.webp',
                    'LRFS',
                    `${usagePercent}% of quota`,
                    `${formatBytes(used)} / ${formatBytes(total)}`,
                    `<progress max="100" value="${usagePercent}"></progress>`
                );
                sidebarEl.innerHTML += omni_group('Storage', storageIndicatorHtml);
            }

            // Bind Navigation Tabs
            sidebarEl.querySelectorAll('.comp-sidebartab').forEach(tab => {
                tab.onclick = () => {
                    const tabId = tab.dataset.id;
                    
                    if (tabId === 'place-home') {
                        currentPath = homeDirectory;
                    } else if (tabId === 'place-root') {
                        currentPath = '/';
                    } else if (tabId === 'me-desktop') {
                        currentPath = pathDesktop;
                    } else if (tabId === 'me-documents') {
                        currentPath = pathDocuments;
                    } else if (tabId === 'me-downloads') {
                        currentPath = pathDownloads;
                    } else if (tabId === 'me-library') {
                        currentPath = pathLibrary;
                    } else if (tabId === 'me-pictures') {
                        currentPath = pathPictures;
                    }

                    selectedPaths = [];
                    updateSidebar();
                    triggerRefresh();
                };
            });
        };

        const updateToolbar = () => {
            const toolbarEl = win.contentElement.querySelector(`#fm-toolbar-${win.id}`);
            if (!toolbarEl) return;

            const canGoUp = currentPath !== '/';
            const hasSelection = selectedPaths.length > 0;
            const hasSingleSelection = selectedPaths.length === 1;

            let isPasteAvailable = false;
            if (ClipboardService) {
                const text = ClipboardService.readText();
                if (text && text.startsWith('DE_COPY_FILES:')) {
                    isPasteAvailable = true;
                }
            }

            // Render clean utility triggers (Icon-only on core functions)
            let toolbarHtml = '';
            toolbarHtml += omni_button('action-up', '&#xE110;', '', '', '', !canGoUp);
            toolbarHtml += omni_button('action-new-file', '&#xE1A5;', 'New File', '', '');
            toolbarHtml += omni_button('action-new-folder', '&#xE188;', 'New Folder', '', '');
            
            // Subtle toolbar separator
            toolbarHtml += `<div style="width: 1px; height: 16px; background: #202020; margin: 0 4px;"></div>`;
            
            toolbarHtml += omni_button('action-copy', '&#xE16F;', '', '', '', !hasSelection);
            toolbarHtml += omni_button('action-paste', '&#xE16D;', '', '', '', !isPasteAvailable);
            toolbarHtml += omni_button('action-rename', '&#xE13E;', '', '', '', !hasSingleSelection);
            toolbarHtml += omni_button('action-delete', '&#xE74D;', '', 'danger', '', !hasSelection);

            toolbarEl.innerHTML = toolbarHtml;

            // Bind click handlers to newly drawn nodes
            const bindBtn = (id, handler) => {
                const btn = toolbarEl.querySelector(`#${id}`);
                if (btn) btn.onclick = handler;
            };

            bindBtn('action-up', () => {
                if (canGoUp) {
                    currentPath = getParentPath(currentPath);
                    selectedPaths = [];
                    updateSidebar();
                    triggerRefresh();
                }
            });
            bindBtn('action-new-file', handleNewFile);
            bindBtn('action-new-folder', handleNewFolder);
            bindBtn('action-copy', handleCopy);
            bindBtn('action-paste', handlePaste);
            bindBtn('action-rename', handleRename);
            bindBtn('action-delete', handleDeleteSelected);
        };

        const triggerRefresh = () => {
            const tableBody = win.contentElement.querySelector(`#fm-entries-${win.id}`);
            const pathBar = win.contentElement.querySelector(`#fm-path-bar-${win.id}`);
            const statusItems = win.contentElement.querySelector(`#fm-status-items-${win.id}`);
            const statusStorage = win.contentElement.querySelector(`#fm-status-storage-${win.id}`);

            if (!tableBody || !pathBar) return;

            pathBar.value = currentPath;

            // Dynamic Action Toolbar update loop
            updateToolbar();

            let items = [];
            try {
                items = FileService.listDirectory(currentPath) || [];
            } catch (err) {
                DialogService.alert(err.message, 'Finder Error');
                if (currentPath !== '/') {
                    currentPath = '/';
                    selectedPaths = [];
                    updateSidebar();
                    triggerRefresh();
                    return;
                }
            }

            if (searchQuery) {
                items = items.filter(item => item.name.toLowerCase().includes(searchQuery));
            }

            // Sort directories first, then files alphabetically
            items.sort((a, b) => {
                if (a.type === b.type) {
                    return a.name.localeCompare(b.name);
                }
                return a.type === 'directory' ? -1 : 1;
            });

            let rowsHtml = '';
            if (items.length === 0) {
                rowsHtml = `
                    <tr class="omni-table-row">
                        <td colspan="3" class="text-center text-secondary">No files or folders found</td>
                    </tr>
                `;
            } else {
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const isSelected = selectedPaths.includes(item.path);
                    const rowClass = `fm-item omni-table-row ${isSelected ? 'selected' : ''}`;
                    
                    const iconCode = item.type === 'directory' ? '&#xE8B7;' : '&#xE160;';
                    const displayType = item.type === 'directory' ? 'Folder' : 'File';
                    const displaySize = item.type === 'file' ? formatBytes(item.size || 0) : '—';

                    rowsHtml += `
                        <tr class="${rowClass}" data-path="${item.path}" data-type="${item.type}" data-name="${item.name}">
                            <td>
                                <div class="layout-h flex-align-center flex-gap-8">
                                    <i>${iconCode}</i>
                                    <span class="font-bold">${item.name}</span>
                                </div>
                            </td>
                            <td>${displayType}</td>
                            <td>${displaySize}</td>
                        </tr>
                    `;
                }
            }

            tableBody.innerHTML = rowsHtml;

            tableBody.querySelectorAll('.fm-item').forEach(el => {
                const targetPath = el.dataset.path;
                const targetType = el.dataset.type;

                el.onclick = (e) => {
                    if (e.ctrlKey || e.metaKey) {
                        if (selectedPaths.includes(targetPath)) {
                            selectedPaths = selectedPaths.filter(p => p !== targetPath);
                        } else {
                            selectedPaths.push(targetPath);
                        }
                    } else {
                        selectedPaths = [targetPath];
                    }
                    updateSidebar();
                    triggerRefresh();
                };

                el.ondblclick = () => {
                    if (targetType === 'directory') {
                        currentPath = targetPath;
                        selectedPaths = [];
                        const searchInput = win.contentElement.querySelector(`#fm-search-bar-${win.id}`);
                        if (searchInput) searchInput.value = '';
                        searchQuery = '';
                        updateSidebar();
                        triggerRefresh();
                    } else if (targetType === 'file') {
                        FileService.open(targetPath).catch(err => {
                            DialogService.alert(err.message, 'Error');
                        });
                    }
                };

                el.oncontextmenu = async (e) => {
                    e.preventDefault();
                    if (!ContextMenuService) return;

                    if (!selectedPaths.includes(targetPath)) {
                        selectedPaths = [targetPath];
                        updateSidebar();
                        triggerRefresh();
                    }

                    const isSingle = selectedPaths.length === 1;
                    const isFile = targetType === 'file';

                    const menuActions = [];
                    if (isSingle) {
                        if (isFile) {
                            menuActions.push({ id: 'open_with', label: 'Open With...', icon: '⚙️' });
                        } else {
                            menuActions.push({ id: 'open', label: 'Open', icon: '📂' });
                        }
                        menuActions.push({ type: 'separator' });
                        menuActions.push({ id: 'duplicate', label: 'Duplicate', icon: '📑' });
                    }
                    
                    menuActions.push({ id: 'copy', label: 'Copy Path', icon: '📋' });
                    
                    if (isSingle) {
                        menuActions.push({ id: 'rename', label: 'Rename', icon: '✏️' });
                    }
                    
                    menuActions.push({ id: 'delete', label: 'Delete', icon: '🗑️' });

                    if (isSingle) {
                        menuActions.push({ type: 'separator' });
                        menuActions.push({ id: 'properties', label: 'Properties', icon: 'ℹ️' });
                    }

                    const contextResult = await ContextMenuService.showMenu(e.clientX, e.clientY, menuActions);
                    if (!contextResult) return;

                    if (contextResult === 'open') {
                        if (isFile) {
                            FileService.open(targetPath).catch(err => DialogService.alert(err.message, 'Error'));
                        } else {
                            currentPath = targetPath;
                            selectedPaths = [];
                            updateSidebar();
                            triggerRefresh();
                        }
                    } else if (contextResult === 'open_with') {
                        const { showOpenWithDialog } = await import('../../platform/window/dialogs/OpenWithDialog.js');
                        const appId = await showOpenWithDialog(DialogService, AssociationService, targetPath);
                        if (appId) {
                            const intentService = ProcessService.registry ? ProcessService.registry.get('ApplicationIntentService') : null;
                            if (intentService) {
                                intentService.launchWithIntent(appId, { action: 'open-file', path: targetPath }, { args: [targetPath] });
                            } else {
                                ProcessService.startProcess(appId, { args: [targetPath] });
                            }
                        }
                    } else if (contextResult === 'duplicate') {
                        try {
                            FileService.duplicate(targetPath);
                            triggerRefresh();
                        } catch (err) { DialogService.alert(err.message, 'Error'); }
                    } else if (contextResult === 'copy') {
                        if (ClipboardService) {
                            ClipboardService.copyText(selectedPaths.join('\n'));
                        }
                    } else if (contextResult === 'rename') {
                        handleRename();
                    } else if (contextResult === 'delete') {
                        handleDeleteSelected();
                    } else if (contextResult === 'properties') {
                        const { showPropertiesDialog } = await import('../../platform/window/dialogs/PropertiesDialog.js');
                        let itemData = null;
                        try {
                            const itemsList = FileService.listDirectory(currentPath);
                            itemData = itemsList.find(i => i.path === targetPath);
                        } catch (err) { /* ignore */ }
                        if (itemData) {
                            showPropertiesDialog(DialogService, itemData);
                        }
                    }
                };
            });

            win.contentElement.onclick = (e) => {
                if (e.target.closest('.fm-item') || e.target.closest('.comp-sidebartab') || e.target.closest('.comp-btn') || e.target.closest('.comp-input')) return;
                if (selectedPaths.length > 0) {
                    selectedPaths = [];
                    updateSidebar();
                    triggerRefresh();
                }
            };

            statusItems.innerText = `${items.length} items (${selectedPaths.length} selected)`;
            if (typeof FileService.getUsage === 'function') {
                const used = FileService.getUsage();
                const total = FileService.getCapacity();
                statusStorage.innerText = `${formatBytes(used)} of ${formatBytes(total)} used`;
            } else {
                statusStorage.innerText = '';
            }
        };

        // ========================================
        // Application Keybind System (Shortcuts)
        // ========================================
        const registerShortcuts = () => {
            if (!ShortcutService) return;

            const bind = (key, handler) => {
                const config = {
                    shortcut: key,
                    scope: 'WINDOW',
                    handler: (e) => {
                        if (!isFocused) return;
                        handler(e);
                    }
                };
                ShortcutService.register(config);
                registeredShortcutsList.push(config);
            };

            bind('Delete', async () => {
                handleDeleteSelected();
            });

            bind('Ctrl+C', () => {
                handleCopy();
            });

            bind('Ctrl+V', async () => {
                handlePaste();
            });

            bind('F2', async () => {
                handleRename();
            });
        };

        // ========================================
        // Lifecycle & Setup Event Bindings
        // ========================================
        EventBus.emit('fileManager:start', { 
            severity: 'Info', 
            source: 'Finder', 
            message: 'Started Finder.' 
        });

        renderShell();
        updateSidebar();
        triggerRefresh();
        registerShortcuts();

        const handleFocus = (payload) => {
            if (payload.data && payload.data.pid === pid) {
                isFocused = true;
            }
        };

        const handleBlur = (payload) => {
            if (payload.data && payload.data.pid === pid) {
                isFocused = false;
            }
        };

        EventBus.on('window.focused', handleFocus);
        EventBus.on('window.blurred', handleBlur);

        win.onClose = () => {
            if (ShortcutService) {
                registeredShortcutsList.forEach(s => ShortcutService.unregister(s));
            }
            EventBus.off('window.focused', handleFocus);
            EventBus.off('window.blurred', handleBlur);
        };
    },

    onIntent: async (registry, pid, intent) => {
        const ProcessService = registry.get('ProcessService');
        if (!ProcessService) return;
        const proc = ProcessService.getProcess(pid);
        if (proc && typeof proc.handleIntent === 'function') {
            await proc.handleIntent(intent);
        }
    }
};