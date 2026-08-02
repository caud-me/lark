import { EventBus } from '../../1-kernel/SystemEventBus.js';
import { GuardianValidationRegistry } from './GuardianValidationRegistry.js';
import { GuardianOrchestrator, ScanType } from './GuardianOrchestrator.js';
import { ArchitectureValidationModule } from './modules/ArchitectureValidationModule.js';
import { DiskIntegrityValidationModule } from './modules/DiskIntegrityValidationModule.js';
import { StorageHealthValidationModule } from './modules/StorageHealthValidationModule.js';
import { ConfigurationValidationModule } from './modules/ConfigurationValidationModule.js';
import { PerformanceValidationModule } from './modules/PerformanceValidationModule.js';

/**
 * GuardianService
 *
 * Responsibility:
 * Operating System capability service registered in ServiceRegistry.
 * Exposes stable public APIs for platform health and integrity verification.
 * Loads history from disk during initialize() and persists updates via FileService.
 * Delegates scan workflows to GuardianOrchestrator.
 */
export class GuardianService {
    constructor(guardianHistoryManager, serviceRegistry) {
        this.historyManager = guardianHistoryManager;
        this.registry = serviceRegistry;
        this.historyPath = '/system/guardian_history.json';
        this.started = false;

        // Register default pluggable validation modules
        this.validationRegistry = new GuardianValidationRegistry();
        this.validationRegistry.register(new ConfigurationValidationModule());
        this.validationRegistry.register(new StorageHealthValidationModule());
        this.validationRegistry.register(new DiskIntegrityValidationModule());
        this.validationRegistry.register(new PerformanceValidationModule());
        this.validationRegistry.register(new ArchitectureValidationModule());

        this.orchestrator = new GuardianOrchestrator(this.registry, this.validationRegistry);

        EventBus.on('desktop.ready', this._onDesktopReady.bind(this));
    }

    /**
     * Loads persistent scan history from /system/guardian_history.json.
     */
    async initialize() {
        const fileService = this.registry.get('FileService');
        const securityService = this.registry.get('SecurityService');
        if (!fileService || !securityService) return;

        const systemContext = securityService.getSystemContext();
        try {
            if (await fileService.exists(this.historyPath, { context: systemContext })) {
                const dataStr = await fileService.readFile(this.historyPath, { context: systemContext });
                const parsed = JSON.parse(dataStr);
                if (Array.isArray(parsed)) {
                    this.historyManager.setHistory(parsed);
                }
            }
        } catch (e) {
            console.warn('[GuardianService] Could not load scan history:', e);
        }
    }

    async runStartupValidation() {
        const result = await this.orchestrator.executeScan(ScanType.STARTUP);
        this.historyManager.addScanRecord(result);
        await this._persistHistory();

        const notificationService = this.registry.get('NotificationService');
        if (notificationService) {
            if (typeof notificationService.notify === 'function') {
                notificationService.notify({
                    title: 'Guardian Platform Verification',
                    message: 'Platform health verification completed. No issues detected.',
                    type: 'info',
                    appId: 'sys.guardian'
                });
            } else if (typeof notificationService.sendNotification === 'function') {
                notificationService.sendNotification({
                    title: 'Guardian Platform Verification',
                    message: 'Platform health verification completed. No issues detected.',
                    type: 'info',
                    appId: 'sys.guardian'
                });
            }
        }

        return result;
    }

    async runQuickScan() {
        const result = await this.orchestrator.executeScan(ScanType.QUICK);
        this.historyManager.addScanRecord(result);
        await this._persistHistory();
        return result;
    }

    async runFullRegression() {
        const result = await this.orchestrator.executeScan(ScanType.FULL);
        this.historyManager.addScanRecord(result);
        await this._persistHistory();
        return result;
    }

    getLatestScan() {
        return this.historyManager.getLatestScan();
    }

    getHistory() {
        return this.historyManager.getHistory();
    }

    async _onDesktopReady() {
        if (this.started) return;
        this.started = true;
        await this.runStartupValidation();
    }

    async _persistHistory() {
        const fileService = this.registry.get('FileService');
        const securityService = this.registry.get('SecurityService');
        if (!fileService || !securityService) return;

        const systemContext = securityService.getSystemContext();
        try {
            if (!await fileService.exists('/system', { context: systemContext })) {
                await fileService.createDirectory('/system', { context: systemContext });
            }
            const dataStr = JSON.stringify(this.historyManager.getHistory(), null, 2);
            await fileService.writeFile(this.historyPath, dataStr, { context: systemContext });
        } catch (e) {
            console.error('[GuardianService] Failed to persist scan history:', e);
        }
    }
}
