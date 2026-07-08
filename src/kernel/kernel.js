import { ServiceRegistry } from './ServiceRegistry.js';
import { EventBus } from './SystemEventBus.js';
import { SYSTEM_INFO } from '../system/SystemVersion.js';

/**
 * Kernel
 *
 * Responsibility:
 * Coordinates OS startup, initializes managers and services, and owns the system lifecycle.
 *
 * Does NOT:
 * - Implement business logic or features
 */
class Kernel {
    constructor() {
        this.managers = new Map();
        this.state = 'UNINITIALIZED';
    }

    /**
     * Initialize the Kernel and bootstrap the OS.
     */
    async bootstrap() {
        this.state = 'BOOTING';
        EventBus.emit('kernel:boot', { severity: 'Info', source: 'Kernel', message: 'Beginning bootstrap sequence...' });

        this.bootStages = [
            { id: 'storage', name: 'Storage subsystem', run: () => this.initStorage() },
            { id: 'managers', name: 'State Managers', run: () => this.initManagers() },
            { id: 'services', name: 'System Services', run: () => this.initServices() },
            { id: 'applications', name: 'Application Startup', run: () => this.startApplications() }
        ];

        try {
            for (const stage of this.bootStages) {
                EventBus.emit('boot.stage.started', { severity: 'Info', source: 'Kernel', message: `Boot Stage: ${stage.name}...`, data: { stageId: stage.id } });
                await stage.run();
                EventBus.emit('boot.stage.completed', { severity: 'Info', source: 'Kernel', message: `Completed Boot Stage: ${stage.name}`, data: { stageId: stage.id } });
            }
            
            this.state = 'RUNNING';
            EventBus.emit('boot.completed', { severity: 'Info', source: 'Kernel', message: 'Bootstrap complete. LDE 27 is running.' });
        } catch (error) {
            this.state = 'PANIC';
            this.panic(error);
        }
    }

    async startApplications() {
        const fileService = ServiceRegistry.get('FileService');
        if (!fileService) throw new Error('[Kernel] FileService not found.');

        const processService = ServiceRegistry.get('ProcessService');

        if (fileService.exists('/system/installed.json')) {
            // Normal Boot
            EventBus.emit('kernel:login', { severity: 'Info', source: 'Kernel', message: 'Launching Login.' });
            processService.startProcess('sys.login');
        } else {
            // First Boot Setup
            EventBus.emit('kernel:firstBoot', { severity: 'Info', source: 'Kernel', message: 'First boot detected. Launching OOBE.' });
            const oobePid = await processService.startProcess('sys.oobe');
            
            const onOobeComplete = (payload) => {
                if (payload.data && payload.data.pid === oobePid) {
                    EventBus.off('process.terminated', onOobeComplete);
                    EventBus.emit('kernel:oobeComplete', { severity: 'Info', source: 'Kernel', message: 'OOBE complete. Launching Login.' });
                    processService.startProcess('sys.login');
                }
            };
            EventBus.on('process.terminated', onOobeComplete);
        }
    }

    async initStorage() {
        const { LocalStorageDriver } = await import('../storage/drivers/LocalStorageDriver.js');
        const { LRFS } = await import('../storage/lrfs/LRFS.js');
        
        const driver = new LocalStorageDriver();
        this.lrfs = new LRFS(driver);
        await this.lrfs.mount();
    }

    async initManagers() {
        const { LogManager } = await import('../managers/LogManager.js');
        const { WindowManager } = await import('../managers/WindowManager.js');
        const { ProcessManager } = await import('../managers/ProcessManager.js');
        const { SettingsManager } = await import('../managers/SettingsManager.js');
        const { UserManager } = await import('../managers/UserManager.js');
        const { SessionManager } = await import('../managers/SessionManager.js');
        const { DiskManager } = await import('../managers/DiskManager.js');
        const { AppRegistry } = await import('./AppRegistry.js');
        const { IPCManager } = await import('../managers/IPCManager.js');
        const { NotificationManager } = await import('../managers/NotificationManager.js');

        const { DialogManager } = await import('../managers/DialogManager.js');

        this.managers.set('LogManager', new LogManager());
        this.managers.set('WindowManager', new WindowManager());
        this.managers.set('DialogManager', new DialogManager());
        this.managers.set('ProcessManager', new ProcessManager());
        this.managers.set('IPCManager', new IPCManager(this.managers.get('ProcessManager')));
        this.managers.set('NotificationManager', new NotificationManager());
        this.managers.set('SettingsManager', new SettingsManager(this.lrfs));
        this.managers.set('UserManager', new UserManager(ServiceRegistry));
        
        const sessionManager = new SessionManager(ServiceRegistry);
        sessionManager.startSystemSession();
        this.managers.set('SessionManager', sessionManager);
        
        this.managers.set('DiskManager', new DiskManager(this.lrfs));
        this.appRegistry = new AppRegistry();
    }

    async initServices() {
        const { LogService } = await import('../services/LogService.js');
        const { WindowService } = await import('../services/WindowService.js');
        const { ProcessService } = await import('../services/ProcessService.js');
        const { FileService } = await import('../services/FileService.js');
        const { SettingsService } = await import('../services/SettingsService.js');
        const { AppService } = await import('../services/AppService.js');
        const { CommandService } = await import('../services/CommandService.js');
        const { UserService } = await import('../services/UserService.js');
        const { SessionService } = await import('../services/SessionService.js');
        const { DiskService } = await import('../services/DiskService.js');
        const { PowerService } = await import('../services/PowerService.js');
        const { IPCService } = await import('../services/IPCService.js');
        const { NotificationService } = await import('../services/NotificationService.js');

        const { DialogService } = await import('../services/DialogService.js');

        ServiceRegistry.register('LogService', new LogService(this.managers.get('LogManager')));
        ServiceRegistry.register('WindowService', new WindowService(this.managers.get('WindowManager')));
        ServiceRegistry.register('DialogService', new DialogService(this.managers.get('DialogManager')));
        ServiceRegistry.register('SessionService', new SessionService(this.managers.get('SessionManager'), this.managers.get('UserManager')));
        
        // FileService is registered after SessionService so it can securely resolve active session identity
        ServiceRegistry.register('FileService', new FileService(this.lrfs, ServiceRegistry));
        
        ServiceRegistry.register('SettingsService', new SettingsService(this.managers.get('SettingsManager')));
        ServiceRegistry.register('UserService', new UserService(this.managers.get('UserManager')));
        ServiceRegistry.register('DiskService', new DiskService(this.managers.get('DiskManager')));
        ServiceRegistry.register('IPCService', new IPCService(this.managers.get('IPCManager')));
        ServiceRegistry.register('NotificationService', new NotificationService(this.managers.get('NotificationManager')));
        
        const appService = new AppService(this.appRegistry);
        ServiceRegistry.register('AppService', appService);
        
        ServiceRegistry.register('ProcessService', new ProcessService(this.managers.get('ProcessManager'), appService, ServiceRegistry));
        ServiceRegistry.register('CommandService', new CommandService(ServiceRegistry));
        ServiceRegistry.register('PowerService', new PowerService(this.managers.get('ProcessManager'), this.managers.get('SessionManager'), ServiceRegistry));
        
        const { InputPolicy } = await import('../policies/InputPolicy.js');
        new InputPolicy(ServiceRegistry);
    }



    panic(error) {
        EventBus.emit('kernel:panic', { severity: 'Error', source: 'Kernel', message: `KERNEL PANIC: ${error.stack || error}` });
        
        let eventData = [];
        try {
            const syslogService = ServiceRegistry.get('LogService');
            if (syslogService) {
                const logs = syslogService.getLogs();
                eventData = logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.severity} [${l.source}]: ${l.message}`);
            }
        } catch(e) {}
        
        const errorStack = (error.stack || error.toString()).split('\n');
        
        const panicLines = [
            `CR0: 0x0000000080010033, CR2: 0x00000000ff5ea1fd, CR3: 0x000000000c4e9000`,
            `Fault CR2: 0x00000000ff5ea1fd, Error code: 0x0000000000000000, Fault CPU: 0x0, PL: 0, VF: 5`,
            ``,
            `Panicked task 0xffffff9d921cb290: 20 threads: pid 0:`,
            `Backtrace (CPU 0), panicked thread: 0xffffff98c54000c0, Frame : Return Address`,
            ...errorStack,
            ``,
            `Process name corresponding to current thread (0xffffff98c54000c8): Unknown`,
            `Boot args: -v debug=0x100 keepsyms=1 -lgfxblt -wegnoegpu -vi2c-force-polling`,
            ``,
            `Mac OS version:`,
            `Not yet set`,
            ``,
            `Kernel version:`,
            `LDE Kernel Version ${SYSTEM_INFO.version} (${SYSTEM_INFO.codename}): ${new Date().toUTCString()}; root:xnu-12377.41.6-2/RELEASE_X86_64`,
            `Kernel UUID: 375EF211-CCBA-3A63-9670-924A3BF74221`,
            `roots installed: 0`,
            `KernelCache slide: 0x0000000006a00000`,
            `KernelCache base:  0xffffff8006c00000`,
            `System shutdown begun: NO`,
            `Panic diags file unavailable, panic occurred prior to initialization`,
            `Hibernation exit count: 0`,
            ``,
            `System uptime in nanoseconds: ${Math.floor(performance.now() * 1000000)}`,
            `Last Sleep:           absolute           base_tsc          base_nano`,
            `  Uptime  : 0x0000000030c203b1`,
            `  Sleep   : 0x0000000000000000 0x0000000000000000 0x0000000000000000`,
            `  Wake    : 0x0000000000000000 0x00000018f4bfdd9a 0x0000000000000000`,
            ``,
            `Event Viewer Logs (LDE Syslog):`,
            ...eventData,
            ``,
            `** In Memory Panic Stackshot Succeeded ** Bytes Traced 4380 (Uncompressed 9360) **`,
            ``,
            `Please go to https://panic.lde27.com to report this panic`
        ];

        document.body.innerHTML = `
            <div id="panic-screen" style="background-color: #000; color: #fff; height: 100vh; width: 100vw; font-family: monospace; font-size: 14px; font-weight: bold; position: absolute; top: 0; left: 0; z-index: 999999; overflow-y: auto; overflow-x: hidden; padding: 20px; box-sizing: border-box; line-height: 0.9; white-space: pre-wrap; word-break: break-all;">
            </div>
        `;
        
        const container = document.getElementById('panic-screen');
        let currentLine = 0;
        
        const interval = setInterval(() => {
            if (currentLine >= panicLines.length) {
                clearInterval(interval);
                return;
            }
            
            const line = document.createElement('div');
            line.textContent = panicLines[currentLine];
            // Ensure empty strings take up vertical space
            if (panicLines[currentLine] === '') {
                line.style.minHeight = '1em';
            }
            container.appendChild(line);
            
            container.scrollTop = container.scrollHeight;
            currentLine++;
        }, 15); // Fast enough to look like a dump, slow enough to see the animation
    }
}

export const coreKernel = new Kernel();
