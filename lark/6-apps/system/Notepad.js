import { 
    omni_button, 
    omni_toolbar,
    omni_sidebarTab,
    omni_group,
    omni_preferenceItem
} from '../../5-platform/settings/SettingsComponents.js';
import { WorkspaceTabs } from '../../9-ui/components/WorkspaceTabs.js';

let activeNotepadInstance = null;

const isWindowAlive = (instance, registry) => {
    if (!instance || !instance.windowId) return false;
    const WindowService = registry.get('WindowService');
    if (!WindowService) return false;
    const state = WindowService.getWindowState(instance.windowId);
    return Boolean(state);
};

const parseLaunchIntent = (launchContext) => {
    if (!launchContext) return null;
    if (launchContext.intent) return launchContext.intent;
    if (launchContext.path) return { action: 'open-file', path: launchContext.path };
    if (launchContext.args && launchContext.args[0]) return { path: launchContext.args[0] };
    return null;
};

export default {
    async run(registry, pid, launchContext = {}) {
        const intent = parseLaunchIntent(launchContext);
        if (activeNotepadInstance && isWindowAlive(activeNotepadInstance, registry)) {
            const WindowService = registry.get('WindowService');
            if (WindowService) {
                WindowService.restoreWindow(activeNotepadInstance.windowId);
                WindowService.focusWindow(activeNotepadInstance.windowId);
            }
            if (intent) {
                activeNotepadInstance.handleIntent(intent);
            }
            return activeNotepadInstance;
        }

        activeNotepadInstance = null;
        activeNotepadInstance = new NotepadApplication(registry, pid);
        activeNotepadInstance.start(intent);
        return activeNotepadInstance;
    },
    async onIntent(registry, intent) {
        if (activeNotepadInstance && isWindowAlive(activeNotepadInstance, registry)) {
            const WindowService = registry.get('WindowService');
            if (WindowService) {
                WindowService.restoreWindow(activeNotepadInstance.windowId);
                WindowService.focusWindow(activeNotepadInstance.windowId);
            }
            activeNotepadInstance.handleIntent(intent);
        } else {
            activeNotepadInstance = null;
            const ProcessService = registry.get('ProcessService');
            const proc = ProcessService ? ProcessService.getProcesses().find(p => p.appId === 'sys.notepad') : null;
            const pid = proc ? proc.pid : null;
            activeNotepadInstance = new NotepadApplication(registry, pid);
            activeNotepadInstance.start(intent);
        }
    }
};

class NotepadApplication {
    constructor(registry, pid = null) {
        this.registry = registry;
        this.pid = pid;
        this.windowService = registry.get('WindowService');
        this.fileService = registry.get('FileService');
        this.dialogService = registry.get('DialogService');
        
        this.windowId = null;
        this.contentElement = null;
        
        // Settings State
        this.configuredFolders = [];
        this.activeFolder = null;
        this.currentView = 'editor'; // 'editor' | 'settings'
        this.availableNotes = [];

        this.MAX_FILE_SIZE = 1024 * 1024; // 1MB boundary limit
        this.textarea = null;

        // Initialize Generic WorkspaceTabs Framework Instance
        this.workspaceTabs = new WorkspaceTabs({
            onTabSelect: (tab) => {
                if (!tab) {
                    if (this.windowService && this.windowId) {
                        this.windowService.closeWindow(this.windowId);
                    }
                    return;
                }
                if (this.textarea) {
                    this.textarea.value = tab.content || '';
                }
                this._updateTitle(tab);
            },
            onTabClose: async (tab) => {
                if (tab.dirty) {
                    if (this.dialogService) {
                        const confirmed = await this.dialogService.confirm(
                            `You have unsaved changes in '${tab.title}'. Discard current work?`,
                            'Unsaved Changes'
                        );
                        return confirmed;
                    }
                }
                return true;
            },
            onTabAdd: () => {
                this._handleNew();
            }
        });
    }

    start(intent = null) {
        if (!this.windowService) {
            console.error('[Notepad] WindowService could not be located.');
            return;
        }

        const win = this.windowService.createWindow({
            title: 'Notepad',
            width: 850,
            height: 620,
            center: true,
            pid: this.pid
        });

        this.windowId = win.id;
        this.contentElement = win.contentElement;

        win.onClose = async () => {
            for (let i = this.workspaceTabs.tabs.length - 1; i >= 0; i--) {
                const tab = this.workspaceTabs.tabs[i];
                if (tab.dirty) {
                    const canClose = await this.workspaceTabs.onTabClose(tab);
                    if (!canClose) return false;
                }
            }
            if (activeNotepadInstance === this) {
                activeNotepadInstance = null;
            }
            return true;
        };

        this._loadSettings();

        // Create default initial document tab
        this.workspaceTabs.addTab({
            title: 'Untitled',
            path: null,
            content: '',
            dirty: false
        });

        this._buildUI();

        if (intent) {
            this.handleIntent(intent);
        }
    }

    handleIntent(intent) {
        if (!intent) return;
        let targetPath = null;
        if (typeof intent === 'string') {
            targetPath = intent;
        } else if (intent.path !== undefined) {
            targetPath = intent.path;
        } else if (intent.payload && intent.payload.path !== undefined) {
            targetPath = intent.payload.path;
        } else if (intent.data && intent.data.path !== undefined) {
            targetPath = intent.data.path;
        }

        if (targetPath) {
            this.currentView = 'editor';
            this._openFile(targetPath);
            if (this.windowService && this.windowId) {
                this.windowService.restoreWindow(this.windowId);
                this.windowService.focusWindow(this.windowId);
            }
        }
    }

    _getSettingsPath() {
        const SessionService = this.registry.get('SessionService');
        const currentSession = SessionService ? SessionService.getCurrentSession() : null;
        let ownerUsername = 'system';
        
        if (currentSession && currentSession.user) {
            ownerUsername = currentSession.user.username;
        }
        
        let homeDirectory = '/';
        if (ownerUsername !== 'system') {
            homeDirectory = `/users/${ownerUsername}`;
        }
        
        let targetPath = '/Settings/notepad.json';
        if (homeDirectory !== '/') {
            targetPath = `${homeDirectory}/Settings/notepad.json`;
        }
        
        return targetPath;
    }

    _loadSettings() {
        if (!this.fileService) return;
        
        const settingsPath = this._getSettingsPath();
        
        if (this.fileService.exists(settingsPath)) {
            try {
                const content = this.fileService.readFile(settingsPath);
                const data = JSON.parse(content);
                
                if (data && Array.isArray(data.folders)) {
                    this.configuredFolders = data.folders;
                }
            } catch (error) {
                console.error('[Notepad] Failed to load settings:', error);
            }
        }
    }

    _saveSettings() {
        if (!this.fileService) return;
        
        const settingsPath = this._getSettingsPath();
        const settingsDir = settingsPath.substring(0, settingsPath.lastIndexOf('/'));
        
        if (settingsDir !== '') {
            if (this.fileService.exists(settingsDir) === false) {
                this.fileService.createDirectory(settingsDir);
            }
        }

        const data = {
            folders: this.configuredFolders
        };
        
        this.fileService.writeFile(settingsPath, JSON.stringify(data, null, 4));
    }

    _loadNotesFromFolders() {
        this.availableNotes = [];
        if (!this.fileService) return;

        for (let index = 0; index < this.configuredFolders.length; index++) {
            const folderPath = this.configuredFolders[index];
            
            if (this.fileService.exists(folderPath)) {
                try {
                    const items = this.fileService.listDirectory(folderPath);
                    
                    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
                        const item = items[itemIndex];
                        
                        if (item.type === 'file') {
                            const allowedExtensions = ['.txt', '.md', '.json', '.js', '.css', '.html', '.py'];
                            const hasAllowedExtension = allowedExtensions.some(ext => item.name.toLowerCase().endsWith(ext));
                            if (hasAllowedExtension) {
                                this.availableNotes.push({
                                    name: item.name,
                                    path: item.path,
                                    folder: folderPath
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error('[Notepad] Error reading folder:', folderPath, error);
                }
            }
        }
    }

    _buildUI() {
        this.contentElement.innerHTML = '';
        
        const container = document.createElement('div');
        container.className = 'omni-layout-row';

        const sidebarPanel = document.createElement('div');
        sidebarPanel.className = 'omni-panel-1';
        sidebarPanel.id = `np-sidebar-${this.windowId}`;

        const mainPanel = document.createElement('div');
        mainPanel.className = 'omni-panel-2';
        mainPanel.id = `np-main-${this.windowId}`;

        const layout_max_w_512px = document.createElement('div');
        layout_max_w_512px.className = 'layout-max-w-512px';
        layout_max_w_512px.id = `np-main-content-${this.windowId}`; 
        
        mainPanel.appendChild(layout_max_w_512px);

        container.appendChild(sidebarPanel);
        container.appendChild(mainPanel);
        this.contentElement.appendChild(container);

        this._refreshSidebar();
        this._refreshMainView(); 
    }

    _refreshSidebar() {
        const sidebarPanel = document.getElementById(`np-sidebar-${this.windowId}`);
        if (!sidebarPanel) return;

        sidebarPanel.innerHTML = '';
        this._loadNotesFromFolders();

        let topActionsHtml = '';
        const isSettingsActive = this.currentView === 'settings';
        
        topActionsHtml += omni_sidebarTab(`np-tab-new-${this.windowId}`, false, '&#xE109;', 'New Note');
        topActionsHtml += omni_sidebarTab(`np-tab-settings-${this.windowId}`, isSettingsActive, '&#xE713;', 'Settings');
        sidebarPanel.innerHTML += omni_group('', topActionsHtml);

        if (this.configuredFolders.length === 0) {
            sidebarPanel.innerHTML += `<div class="padding-8"><small>No folders configured.</small></div>`;
        } else {
            for (let folderIndex = 0; folderIndex < this.configuredFolders.length; folderIndex++) {
                const folderPath = this.configuredFolders[folderIndex];
                const baseName = folderPath.split('/').pop();
                const folderName = `<span class="layout-h flex-space-between flex-align-center" style="width: 100%;"><span>${baseName}</span><button id="np-add-note-${this.windowId}-${folderIndex}" style="background:transparent;border:none;color:inherit;cursor:pointer;padding:0;" title="New note in ${baseName}"><i>&#xE109;</i></button></span>`;
                
                let folderNotesHtml = '';
                let hasNotes = false;

                const activeTab = this.workspaceTabs.getActiveTab();

                for (let noteIndex = 0; noteIndex < this.availableNotes.length; noteIndex++) {
                    const note = this.availableNotes[noteIndex];
                    
                    if (note.folder === folderPath) {
                        hasNotes = true;
                        let isActive = false;
                        if (this.currentView === 'editor' && activeTab) {
                            if (activeTab.path === note.path) {
                                isActive = true;
                            }
                        }
                        
                        const safeId = btoa(note.path).replace(/=/g, '');
                        folderNotesHtml += omni_sidebarTab(`np-note-${this.windowId}-${safeId}`, isActive, '&#xE1A5;', note.name);
                    }
                }

                if (!hasNotes) {
                    folderNotesHtml += `<div class="padding-8"><small>Empty folder</small></div>`;
                }

                sidebarPanel.innerHTML += omni_group(folderName, folderNotesHtml);
            }
        }

        const newBtn = sidebarPanel.querySelector(`[data-id="np-tab-new-${this.windowId}"]`);
        if (newBtn) {
            newBtn.onclick = () => { this._handleNew(); };
        }

        const settingsBtn = sidebarPanel.querySelector(`[data-id="np-tab-settings-${this.windowId}"]`);
        if (settingsBtn) {
            settingsBtn.onclick = () => { 
                this.currentView = 'settings';
                this._refreshSidebar();
                this._refreshMainView();
            };
        }

        for (let folderIndex = 0; folderIndex < this.configuredFolders.length; folderIndex++) {
            const addBtn = sidebarPanel.querySelector(`#np-add-note-${this.windowId}-${folderIndex}`);
            if (addBtn) {
                addBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.activeFolder = this.configuredFolders[folderIndex];
                    this._handleNew();
                };
            }
        }

        for (let noteIndex = 0; noteIndex < this.availableNotes.length; noteIndex++) {
            const note = this.availableNotes[noteIndex];
            const safeId = btoa(note.path).replace(/=/g, '');
            const noteElement = sidebarPanel.querySelector(`[data-id="np-note-${this.windowId}-${safeId}"]`);
            
            if (noteElement) {
                noteElement.onclick = () => {
                    this.currentView = 'editor';
                    this._openFile(note.path);
                };
                
                noteElement.oncontextmenu = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const contextMenuService = this.registry.get('ContextMenuService');
                    if (!contextMenuService) return;
                    
                    const menuActions = [
                        { id: 'rename', label: 'Rename', icon: '&#xE13E;' },
                        { id: 'delete', label: 'Delete', icon: '&#xE107;' },
                        { id: 'find', label: 'Find in Finder', icon: '&#xE188;' }
                    ];
                    
                    const result = await contextMenuService.showMenu(e.clientX, e.clientY, menuActions);
                    if (!result) return;
                    
                    if (result === 'rename') {
                        const newName = await this.dialogService.prompt('Enter new name:', note.name, 'Rename Note');
                        if (newName && newName !== note.name) {
                            let targetName = newName;
                            if (!targetName.includes('.')) targetName += '.txt';
                            
                            try {
                                this.fileService.rename(note.path, targetName);
                                const newPath = note.folder + '/' + targetName;
                                const existingTab = this.workspaceTabs.getTabByPath(note.path);
                                if (existingTab) {
                                    this.workspaceTabs.updateTab(existingTab.id, { path: newPath, title: targetName });
                                }
                                this._refreshSidebar();
                            } catch (err) {
                                this.dialogService.alert(`Failed to rename: ${err.message}`, 'Error');
                            }
                        }
                    } else if (result === 'delete') {
                        const confirm = await this.dialogService.confirm(`Are you sure you want to delete ${note.name}?`, 'Delete Note');
                        if (confirm) {
                            try {
                                this.fileService.delete(note.path);
                                const existingTab = this.workspaceTabs.getTabByPath(note.path);
                                if (existingTab) {
                                    this.workspaceTabs.closeTab(existingTab.id);
                                }
                                this._refreshSidebar();
                            } catch (err) {
                                this.dialogService.alert(`Failed to delete: ${err.message}`, 'Error');
                            }
                        }
                    } else if (result === 'find') {
                        const intentService = this.registry.get('ApplicationIntentService');
                        if (intentService) {
                            intentService.launchWithIntent('sys.finder', {
                                type: 'files.openDirectory',
                                payload: { path: note.folder }
                            });
                        }
                    }
                };
            }
        }
    }

    _refreshMainView() {
        const mainPanel = document.getElementById(`np-main-${this.windowId}`);
        if (!mainPanel) return;

        mainPanel.innerHTML = '';

        if (this.currentView === 'settings') {
            this._buildSettingsView(mainPanel);
        } else {
            this._buildEditorView(mainPanel);
        }
    }

    _buildSettingsView(mainPanel) {
        this._updateTitle('Settings');

        const headerContainer = document.createElement('div');
        headerContainer.className = 'padding-8 layout-v flex-gap-8';
        headerContainer.innerHTML = '<h3>Notepad Settings</h3><p>Manage folders where notes are stored.</p>';
        mainPanel.appendChild(headerContainer);

        const cardContainer = document.createElement('div');
        cardContainer.className = 'comp-card';

        const addFolderBtnId = `np-add-folder-${this.windowId}`;
        cardContainer.innerHTML += omni_button(addFolderBtnId, '&#xE710;', 'Add Folder', 'primary');

        let foldersHtml = '';
        for (let index = 0; index < this.configuredFolders.length; index++) {
            const folderPath = this.configuredFolders[index];
            const deleteBtnId = `np-del-folder-${this.windowId}-${index}`;
            const actions = omni_button(deleteBtnId, '&#xE74D;', 'Delete', 'danger', 'small');
            foldersHtml += omni_preferenceItem(folderPath, '', '', actions);
        }

        if (this.configuredFolders.length > 0) {
            cardContainer.innerHTML += omni_group('Configured Folders', foldersHtml);
        } else {
            cardContainer.innerHTML += '<p>No folders are currently configured.</p>';
        }

        mainPanel.appendChild(cardContainer);

        const addBtn = mainPanel.querySelector(`#${addFolderBtnId}`);
        if (addBtn) {
            addBtn.onclick = async () => {
                if (!this.dialogService) return;
                
                if (this.dialogService.openDirectory) {
                    const selection = await this.dialogService.openDirectory({
                        title: 'Select Folder',
                        initialPath: '/users',
                        requireWriteAccess: true
                    });
                    
                    if (selection && selection.path) {
                        const newFolder = selection.path;
                        if (this.fileService && !this.fileService.exists(newFolder)) {
                            try {
                                this.fileService.createDirectory(newFolder);
                            } catch (error) {
                                this.dialogService.alert(`Could not create directory: ${error.message}`, 'Error');
                                return;
                            }
                        }
                        if (!this.configuredFolders.includes(newFolder)) {
                            this.configuredFolders.push(newFolder);
                            this._saveSettings();
                            this._refreshSidebar();
                            this._refreshMainView();
                        }
                    }
                } else {
                    const newFolder = await this.dialogService.prompt('Enter full folder path to add:', '/users/admin/Documents', 'Add Folder');
                    if (newFolder && newFolder.trim()) {
                        const targetFolder = newFolder.trim();
                        if (this.fileService && !this.fileService.exists(targetFolder)) {
                            try {
                                this.fileService.createDirectory(targetFolder);
                            } catch (error) {
                                this.dialogService.alert(`Could not create directory: ${error.message}`, 'Error');
                                return;
                            }
                        }
                        if (!this.configuredFolders.includes(targetFolder)) {
                            this.configuredFolders.push(targetFolder);
                            this._saveSettings();
                            this._refreshSidebar();
                            this._refreshMainView();
                        }
                    }
                }
            };
        }

        for (let index = 0; index < this.configuredFolders.length; index++) {
            const delBtn = mainPanel.querySelector(`#np-del-folder-${this.windowId}-${index}`);
            if (delBtn) {
                delBtn.onclick = () => {
                    this.configuredFolders.splice(index, 1);
                    this._saveSettings();
                    this._refreshSidebar();
                    this._refreshMainView();
                };
            }
        }
    }

    _buildEditorView(mainPanel) {
        const activeTab = this.workspaceTabs.getActiveTab();
        this._updateTitle(activeTab);

        // 1. Reusable Workspace Tabs Strip
        const tabStripContainer = this.workspaceTabs.render();
        mainPanel.appendChild(tabStripContainer);

        // 2. Toolbar
        const toolbarContainer = document.createElement('div');
        const saveBtnId = `np-save-${this.windowId}`;
        const saveAsBtnId = `np-saveas-${this.windowId}`;
        
        const saveButtonHtml = omni_button(saveBtnId, '&#xE105;', 'Save', '', 'small');
        const saveAsButtonHtml = omni_button(saveAsBtnId, '&#xE17C;', 'Save As', '', 'small');
        
        toolbarContainer.innerHTML = omni_toolbar(saveButtonHtml + saveAsButtonHtml);
        mainPanel.appendChild(toolbarContainer);
        
        // 3. Text Area Canvas
        const editorCard = document.createElement('div');
        editorCard.className = "omni-panel-fill";

        this.textarea = document.createElement('textarea');
        this.textarea.value = activeTab ? (activeTab.content || '') : '';

        this.textarea.oninput = () => {
            const currentTab = this.workspaceTabs.getActiveTab();
            if (currentTab) {
                currentTab.content = this.textarea.value;
                if (!currentTab.dirty) {
                    this.workspaceTabs.updateTab(currentTab.id, { dirty: true });
                    this._updateTitle(currentTab);
                }
            }
        };

        editorCard.appendChild(this.textarea);
        mainPanel.appendChild(editorCard);
        
        const saveBtn = mainPanel.querySelector(`#${saveBtnId}`);
        if (saveBtn) saveBtn.onclick = () => { this._handleSave(); };
        
        const saveAsBtn = mainPanel.querySelector(`#${saveAsBtnId}`);
        if (saveAsBtn) saveAsBtn.onclick = () => { this._handleSaveAs(); };
    }

    _updateTitle(activeTabOrOverride = null) {
        if (!this.windowService || !this.windowId) return;

        if (typeof activeTabOrOverride === 'string') {
            this.windowService.setWindowTitle(this.windowId, `Notepad - ${activeTabOrOverride}`);
            return;
        }

        const tab = activeTabOrOverride || this.workspaceTabs.getActiveTab();
        if (!tab) {
            this.windowService.setWindowTitle(this.windowId, 'Notepad');
            return;
        }

        const dirtyMarker = tab.dirty ? ' *' : '';
        this.windowService.setWindowTitle(this.windowId, `Notepad - ${tab.title}${dirtyMarker}`);
    }

    _getUniqueFilePath(folderPath, fileName) {
        if (!this.fileService) return `${folderPath}/${fileName}`;

        let targetPath = `${folderPath}/${fileName}`;
        if (!this.fileService.exists(targetPath)) {
            return targetPath;
        }

        const dotIdx = fileName.lastIndexOf('.');
        const nameWithoutExt = dotIdx !== -1 ? fileName.substring(0, dotIdx) : fileName;
        const ext = dotIdx !== -1 ? fileName.substring(dotIdx) : '';

        let counter = 2;
        while (this.fileService.exists(targetPath)) {
            targetPath = `${folderPath}/${nameWithoutExt} (${counter})${ext}`;
            counter++;
        }

        return targetPath;
    }

    async _handleNew() {
        if (this.configuredFolders.length === 0) {
            if (this.dialogService) {
                this.dialogService.alert('No folders configured. Please add a folder in Settings first.', 'Action Required');
            }
            this.currentView = 'settings';
            this._refreshSidebar();
            this._refreshMainView();
            return;
        }

        let activeFolderPath = this.activeFolder || this.configuredFolders[0];
        const newFileName = await this.dialogService.prompt('Enter new note filename (e.g. note.txt):', 'Untitled.txt', 'New Note');
        
        if (newFileName && newFileName.trim()) {
            let processedName = newFileName.trim();
            if (!processedName.includes('.')) {
                processedName += '.txt';
            }
            const targetPath = this._getUniqueFilePath(activeFolderPath, processedName);
            
            if (this.fileService) {
                try {
                    this.fileService.writeFile(targetPath, '');
                    this.currentView = 'editor';
                    this._openFile(targetPath);
                    this._refreshSidebar();
                } catch (error) {
                    this.dialogService.alert(`Failed to create note: ${error.message}`, 'Error');
                }
            }
        }
    }

    _openFile(path) {
        if (!this.fileService) return;

        // 1. If tab with matching path is already open, activate it!
        const existingTab = this.workspaceTabs.getTabByPath(path);
        if (existingTab) {
            this.workspaceTabs.activateTab(existingTab.id);
            this.currentView = 'editor';
            this._refreshMainView();
            this._refreshSidebar();
            return;
        }

        try {
            const contentBuffer = this.fileService.readFile(path);
            if (contentBuffer === null) {
                throw new Error('Target file not found or access denied.');
            }

            const calculatedSize = new Blob([contentBuffer]).size;
            if (calculatedSize > this.MAX_FILE_SIZE) {
                if (this.dialogService) {
                    this.dialogService.alert('File size exceeds the allowable editing max configuration limit of 1MB.', 'Error');
                }
                return;
            }

            const fileName = path.split('/').pop() || 'Untitled.txt';

            // Check if active tab is empty default tab
            const activeTab = this.workspaceTabs.getActiveTab();
            if (activeTab && !activeTab.path && !activeTab.dirty && activeTab.content === '') {
                this.workspaceTabs.updateTab(activeTab.id, {
                    title: fileName,
                    path: path,
                    content: contentBuffer,
                    dirty: false
                });
                this.workspaceTabs.activateTab(activeTab.id);
            } else {
                this.workspaceTabs.addTab({
                    title: fileName,
                    path: path,
                    content: contentBuffer,
                    dirty: false
                });
            }
            
            this.activeFolder = null;
            for (let index = 0; index < this.configuredFolders.length; index++) {
                const folder = this.configuredFolders[index];
                if (path.startsWith(folder + '/')) {
                    this.activeFolder = folder;
                    break;
                }
            }

            this.currentView = 'editor';
            this._refreshMainView();
            this._refreshSidebar();

        } catch (openError) {
            if (this.dialogService) {
                this.dialogService.alert(`Failed to open file: ${openError.message}`, 'Error');
            }
        }
    }

    async _handleSave() {
        const activeTab = this.workspaceTabs.getActiveTab();
        if (!activeTab) return;

        if (activeTab.path === null) {
            return this._handleSaveAs();
        }

        if (!this.fileService) return;

        try {
            if (this.textarea) {
                activeTab.content = this.textarea.value;
            }
            this.fileService.writeFile(activeTab.path, activeTab.content);
            this.workspaceTabs.updateTab(activeTab.id, { dirty: false });
            this._updateTitle(activeTab);
            this._refreshSidebar();
        } catch (saveError) {
            if (this.dialogService) {
                this.dialogService.alert(`Failed to save file: ${saveError.message}`, 'Error');
            }
        }
    }

    async _handleSaveAs() {
        const activeTab = this.workspaceTabs.getActiveTab();
        if (!activeTab || !this.dialogService || !this.fileService) return;

        try {
            let fallBackName = activeTab.title || 'Untitled.txt';

            const targetingSelection = await this.dialogService.saveFile({
                title: 'Save as',
                defaultName: fallBackName
            });

            if (targetingSelection && targetingSelection.path) {
                let finalPath = targetingSelection.path;
                const fileName = finalPath.split('/').pop();
                if (!fileName.includes('.')) {
                    finalPath += '.txt';
                }
                
                if (this.textarea) {
                    activeTab.content = this.textarea.value;
                }
                this.fileService.writeFile(finalPath, activeTab.content);
                this.workspaceTabs.updateTab(activeTab.id, {
                    path: finalPath,
                    title: fileName,
                    dirty: false
                });
                this._updateTitle(activeTab);
                this._refreshSidebar();
            }
        } catch (saveAsError) {
            if (this.dialogService) {
                this.dialogService.alert(`Failed to execute save operations: ${saveAsError.message}`, 'Error');
            }
        }
    }
}
