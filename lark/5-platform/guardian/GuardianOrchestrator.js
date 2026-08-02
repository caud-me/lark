import { SYSTEM_INFO } from '../../3-system/SystemVersion.js';
import { EventBus } from '../../1-kernel/SystemEventBus.js';

export const ScanType = {
    STARTUP: 'STARTUP',
    QUICK: 'QUICK',
    FULL: 'FULL'
};

/**
 * GuardianOrchestrator
 *
 * Responsibility:
 * Coordinates validation workflows without owning long-term state.
 * Constructs a ValidationContext once and executes registered modules from GuardianValidationRegistry.
 */
export class GuardianOrchestrator {
    constructor(serviceRegistry, validationRegistry) {
        this.registry = serviceRegistry;
        this.validationRegistry = validationRegistry;
    }

    /**
     * Executes a scan workflow for a specific ScanType.
     * @param {string} scanType ('STARTUP' | 'QUICK' | 'FULL')
     * @returns {Object} Canonical GuardianScanResult
     */
    async executeScan(scanType = ScanType.QUICK) {
        const startTime = performance.now();
        const modulesToRun = this.validationRegistry.getModulesForScanType(scanType);

        // Construct canonical ValidationContext once
        const context = {
            registry: this.registry,
            fileService: this.registry.get('FileService'),
            browserStorageService: this.registry.get('BrowserStorageService'),
            notificationService: this.registry.get('NotificationService'),
            systemVersion: SYSTEM_INFO.version,
            eventBus: EventBus
        };

        const moduleResults = [];
        let totalWarnings = 0;
        let totalErrors = 0;

        for (const mod of modulesToRun) {
            try {
                const res = await mod.execute(context);
                moduleResults.push(res);
                if (res.warnings) totalWarnings += res.warnings;
                if (res.checksFailed) totalErrors += res.checksFailed;
            } catch (e) {
                moduleResults.push({
                    id: mod.id || 'unknown',
                    name: mod.name || 'Unknown Module',
                    status: 'FAIL',
                    severity: 'CRITICAL',
                    duration: '0.00',
                    checksPassed: 0,
                    checksFailed: 1,
                    warnings: 0,
                    details: `Module execution crashed: ${e.message}`
                });
                totalErrors += 1;
            }
        }

        const endTime = performance.now();
        const durationMs = (endTime - startTime).toFixed(2);

        let overallStatus = 'PASS';
        if (totalErrors > 0) {
            overallStatus = 'FAIL';
        } else if (totalWarnings > 0) {
            overallStatus = 'WARNING';
        }

        const activeVolStr = localStorage.getItem('lde27_active_volume');
        let driverLabel = 'IndexedDB (lde27_indexeddb_disk)';
        if (activeVolStr) {
            try {
                const parsed = JSON.parse(activeVolStr);
                driverLabel = `${parsed.type || 'Storage'} (${parsed.id || 'disk'})`;
            } catch (e) {
                console.warn('[GuardianOrchestrator] Active volume JSON parse note:', e.message);
            }
        }

        return {
            id: `scan-${Date.now()}`,
            platformVersion: SYSTEM_INFO.version,
            guardianVersion: '1.0',
            scanType,
            timestamp: new Date().toISOString(),
            durationMs,
            overallStatus,
            storageDriver: driverLabel,
            warnings: totalWarnings,
            errors: totalErrors,
            modules: moduleResults
        };
    }
}
