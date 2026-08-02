/**
 * ScopedServiceRegistry & Bound Service Wrappers
 * 
 * Responsibility:
 * Restricts user-space applications to scoped views of core platform services.
 * Automatically binds and injects process identity context (PID) internally.
 */

export class BoundFileService {
    #processId;

    constructor(globalFileService, pid) {
        this.globalFileService = globalFileService;
        this.#processId = pid;
    }

    _cleanOptions(options) {
        const clean = { ...options, pid: this.#processId };
        delete clean.context;
        return clean;
    }

    readFile(path, options = {}) {
        return this.globalFileService.readFile(path, this._cleanOptions(options));
    }

    writeFile(path, content, options = {}) {
        return this.globalFileService.writeFile(path, content, this._cleanOptions(options));
    }

    exists(path) {
        return this.globalFileService.exists(path);
    }

    isFile(path) {
        return this.globalFileService.isFile(path);
    }

    isDirectory(path) {
        return this.globalFileService.isDirectory(path);
    }

    getType(path) {
        return this.globalFileService.getType(path);
    }

    createDirectory(path, options = {}) {
        return this.globalFileService.createDirectory(path, this._cleanOptions(options));
    }

    createFile(path, content = '', options = {}) {
        return this.globalFileService.createFile(path, content, this._cleanOptions(options));
    }

    listDirectory(path, options = {}) {
        return this.globalFileService.listDirectory(path, this._cleanOptions(options));
    }

    delete(path, options = {}) {
        return this.globalFileService.delete(path, this._cleanOptions(options));
    }

    rename(path, newName, options = {}) {
        return this.globalFileService.rename(path, newName, this._cleanOptions(options));
    }

    copy(sourcePath, destPath, options = {}) {
        return this.globalFileService.copy(sourcePath, destPath, this._cleanOptions(options));
    }

    move(sourcePath, destPath, options = {}) {
        return this.globalFileService.move(sourcePath, destPath, this._cleanOptions(options));
    }

    duplicate(path, options = {}) {
        return this.globalFileService.duplicate(path, this._cleanOptions(options));
    }

    getUsage() {
        return this.globalFileService.getUsage();
    }

    getCapacity() {
        return this.globalFileService.getCapacity();
    }

    async getStorageInfo() {
        return this.globalFileService.getStorageInfo();
    }

    canAccess(path, operation, options = {}) {
        return this.globalFileService.canAccess(path, operation, this._cleanOptions(options));
    }

    open(path, options = {}) {
        return this.globalFileService.open(path, this._cleanOptions(options));
    }

    repairMetadata(path, options = {}) {
        return this.globalFileService.repairMetadata(path, this._cleanOptions(options));
    }
}

export class BoundCapabilityService {
    #processId;

    constructor(globalCapabilityService, pid) {
        this.globalCapabilityService = globalCapabilityService;
        this.#processId = pid;
    }

    get(capabilityId) {
        // Derives the calling process's PID internally
        return this.globalCapabilityService.get(capabilityId, this.#processId);
    }

    has(capabilityId) {
        return this.globalCapabilityService.has(capabilityId);
    }
}

export class BoundWindowService {
    #processId;

    constructor(globalWindowService, pid) {
        this.globalWindowService = globalWindowService;
        this.#processId = pid;
    }

    createWindow(options = {}) {
        // Enforce the bound PID and strip workspaceId to prevent layout hijacking
        const safeOptions = { ...options };
        delete safeOptions.workspaceId;

        return this.globalWindowService.createWindow({
            ...safeOptions,
            pid: this.#processId
        });
    }

    getOwnWindows() {
        const windowsList = this.globalWindowService.getAllWindows();
        const ownWindowsList = [];
        for (let i = 0; i < windowsList.length; i++) {
            const winObj = windowsList[i];
            if (winObj.pid === this.#processId) {
                ownWindowsList.push(winObj);
            }
        }
        return ownWindowsList;
    }

    closeWindow(id) {
        return this.globalWindowService.closeWindow(id);
    }

    focusWindow(id) {
        return this.globalWindowService.focusWindow(id);
    }

    blurWindow(id) {
        return this.globalWindowService.blurWindow(id);
    }

    setWindowPosition(id, x, y) {
        return this.globalWindowService.setWindowPosition(id, x, y);
    }

    setWindowSize(id, width, height) {
        return this.globalWindowService.setWindowSize(id, width, height);
    }

    setWindowTitle(id, title) {
        return this.globalWindowService.setWindowTitle(id, title);
    }

    minimizeWindow(id) {
        return this.globalWindowService.minimizeWindow(id);
    }

    toggleMinimize(id) {
        return this.globalWindowService.toggleMinimize(id);
    }

    isMinimized(id) {
        return this.globalWindowService.isMinimized(id);
    }

    maximizeWindow(id) {
        return this.globalWindowService.maximizeWindow(id);
    }

    restoreWindow(id) {
        return this.globalWindowService.restoreWindow(id);
    }

    getWindowState(id) {
        return this.globalWindowService.getWindowState(id);
    }

    focusWindowByPid(pid) {
        return this.globalWindowService.focusWindowByPid(pid);
    }

    minimizeWindowByPid(pid) {
        return this.globalWindowService.minimizeWindowByPid(pid);
    }

    maximizeWindowByPid(pid) {
        return this.globalWindowService.maximizeWindowByPid(pid);
    }

    restoreWindowByPid(pid) {
        return this.globalWindowService.restoreWindowByPid(pid);
    }

    toggleWindowByPid(pid) {
        return this.globalWindowService.toggleWindowByPid(pid);
    }

    closeWindowByPid(pid) {
        return this.globalWindowService.closeWindowByPid(pid);
    }

    getWindowsWithInputPolicy(policyName) {
        return this.globalWindowService.getWindowsWithInputPolicy(policyName);
    }

    getAllWindows() {
        return this.globalWindowService.getAllWindows();
    }

    getOwnWindows() {
        return this.globalWindowService.getOwnWindows(this.#processId);
    }

    getActiveWindowEnvironmentType() {
        return this.globalWindowService.getActiveWindowEnvironmentType();
    }

    getWindowEnvironmentType(windowId) {
        return this.globalWindowService.getWindowEnvironmentType(windowId);
    }

    onCreated(callback) {
        return this.globalWindowService.onCreated(callback);
    }

    onClosed(callback) {
        return this.globalWindowService.onClosed(callback);
    }

    onFocused(callback) {
        return this.globalWindowService.onFocused(callback);
    }

    onBlurred(callback) {
        return this.globalWindowService.onBlurred(callback);
    }

    onMinimized(callback) {
        return this.globalWindowService.onMinimized(callback);
    }

    onRestored(callback) {
        return this.globalWindowService.onRestored(callback);
    }

    onMaximized(callback) {
        return this.globalWindowService.onMaximized(callback);
    }
}

export class BoundProcessService {
    #processId;

    constructor(globalProcessService, pid) {
        this.globalProcessService = globalProcessService;
        this.#processId = pid;
    }

    registerInstance(instance) {
        const proc = this.globalProcessService.getProcess(this.#processId);
        if (proc) {
            proc.instance = instance;
        }
    }

    getInstance() {
        const proc = this.globalProcessService.getProcess(this.#processId);
        if (proc) {
            return proc.instance;
        }
        return null;
    }

    isRunning() {
        const proc = this.globalProcessService.getProcess(this.#processId);
        if (proc) {
            return proc.state === 'RUNNING';
        }
        return false;
    }

    startProcess(appId, options = {}) {
        return this.globalProcessService.startProcess(appId, options);
    }

    launch(appId, options = {}) {
        return this.globalProcessService.launch(appId, options);
    }

    getProcesses() {
        return this.globalProcessService.getProcesses();
    }

    getProcess(pid) {
        return this.globalProcessService.getProcess(pid);
    }

    terminateProcess(pid) {
        return this.globalProcessService.terminateProcess(pid);
    }

    onStarted(callback) {
        return this.globalProcessService.onStarted(callback);
    }

    onTerminated(callback) {
        return this.globalProcessService.onTerminated(callback);
    }
}

export class BoundDialogService {
    #processId;

    constructor(globalDialogService, pid) {
        this.globalDialogService = globalDialogService;
        this.#processId = pid;
    }

    async alert(message, title = 'Alert') {
        return this.globalDialogService.alert(message, title);
    }

    async confirm(message, title = 'Confirm') {
        return this.globalDialogService.confirm(message, title);
    }

    async prompt(message, defaultValue = '', title = 'Input Required', inputType = 'text') {
        return this.globalDialogService.prompt(message, defaultValue, title, inputType);
    }

    async show(dialogConfig) {
        return this.globalDialogService.show(dialogConfig);
    }

    async openFile(options = {}) {
        const safeOptions = {
            title: options.title,
            initialPath: options.initialPath,
            extensions: options.extensions,
            pid: this.#processId
        };
        return this.globalDialogService.openFile(safeOptions);
    }

    async saveFile(options = {}) {
        const safeOptions = {
            title: options.title,
            initialPath: options.initialPath,
            extensions: options.extensions,
            defaultName: options.defaultName,
            pid: this.#processId
        };
        return this.globalDialogService.saveFile(safeOptions);
    }

    async openDirectory(options = {}) {
        const safeOptions = {
            title: options.title,
            initialPath: options.initialPath,
            requireWriteAccess: options.requireWriteAccess,
            pid: this.#processId
        };
        // console.log('[Diagnostic] BoundDialogService.openDirectory - Caller PID:', this.#processId, 'SafeOptions:', safeOptions);
        return this.globalDialogService.openDirectory(safeOptions);
    }
}

export class ScopedServiceRegistry {
    #processId;

    constructor(globalRegistry, pid, options = {}) {
        this.globalRegistry = globalRegistry;
        this.#processId = pid;
        this.options = options;
        this.cachedServices = new Map();
    }

    get(serviceName) {
        if (this.cachedServices.has(serviceName)) {
            return this.cachedServices.get(serviceName);
        }

        const originalService = this.globalRegistry.get(serviceName);
        if (!originalService) return null;

        let boundService = originalService;

        // Scoped wrappers are strictly limited to identity-dependent services
        if (serviceName === 'FileService') {
            boundService = new BoundFileService(originalService, this.#processId);
        } else if (serviceName === 'CapabilityService') {
            boundService = new BoundCapabilityService(originalService, this.#processId);
        } else if (serviceName === 'WindowService') {
            boundService = new BoundWindowService(originalService, this.#processId);
        } else if (serviceName === 'ProcessService') {
            boundService = new BoundProcessService(originalService, this.#processId);
        } else if (serviceName === 'DialogService') {
            boundService = new BoundDialogService(originalService, this.#processId);
        }

        this.cachedServices.set(serviceName, boundService);
        return boundService;
    }

    has(serviceName) {
        return this.globalRegistry.has(serviceName);
    }

    getProcessRecord() {
        const processService = this.globalRegistry.get('ProcessService');
        if (processService) {
            const proc = processService.getProcess(this.#processId);
            if (proc) {
                return {
                    appId: proc.appId,
                    name: proc.name,
                    ownerUsername: proc.ownerUsername,
                    sessionId: proc.sessionId,
                    args: this.options.args || [],
                    intent: this.options.intent || null
                };
            }
        }
        return {
            appId: 'unknown',
            name: 'unknown',
            ownerUsername: 'system',
            sessionId: null,
            args: [],
            intent: null
        };
    }

    getLaunchContext() {
        return {
            intent: this.options.intent || null,
            args: Array.isArray(this.options.args) ? [...this.options.args] : []
        };
    }
}
