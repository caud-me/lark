import { SYSTEM_INFO } from '../../3-system/SystemVersion.js';

/**
 * SystemInformationService
 *
 * Layer: 5-platform/info
 * Responsibility:
 * Read-only platform service exposing unified operating system facts, firmware virtual machine identity,
 * boot state, active environment identifiers, storage capability snapshots, and Kernel boot timeline
 * via KernelResourceManager.
 *
 * Does NOT:
 * - Mutate system state or access drivers/firmware directly
 */
export class SystemInformationService {
    constructor(serviceRegistry) {
        this.registry = serviceRegistry;
    }

    /**
     * Resolves KernelResourceManager instance.
     * @private
     */
    _getResourceManager() {
        return this.registry ? this.registry.get('KernelResourceManager') : null;
    }

    /**
     * Returns canonical operating system identity facts from SystemVersion.js.
     */
    getSystemInfo() {
        return {
            name: SYSTEM_INFO.name || 'Lark OS',
            version: SYSTEM_INFO.version || '27.9.1',
            codename: SYSTEM_INFO.codename || 'Waffle',
            year: SYSTEM_INFO.year,
            milestone: SYSTEM_INFO.milestone,
            phase: SYSTEM_INFO.phase,
            build: SYSTEM_INFO.build,
            architecture: SYSTEM_INFO.architecture || 'Series 9',
            channel: SYSTEM_INFO.channel || 'stable'
        };
    }

    /**
     * Returns virtual machine identity, firmware metadata, and hardware inventory via KernelResourceManager.
     */
    getFirmwareInfo() {
        const rm = this._getResourceManager();
        if (rm && typeof rm.getFirmwareInfo === 'function') {
            return rm.getFirmwareInfo();
        }
        return {
            machineId: 'LARK-VM-UNAVAILABLE',
            vmModel: 'Lark Virtual Machine v27',
            vendor: 'Lark Technologies Inc.',
            firmwareVersion: '27.9.1-firmware',
            postStatus: 'UNKNOWN',
            devices: []
        };
    }

    /**
     * Returns active boot state facts.
     */
    getBootState() {
        const securityService = this.registry ? this.registry.get('SecurityService') : null;
        const sessionContext = securityService ? securityService.getSessionContext() : null;

        return {
            identity: sessionContext ? sessionContext.identity : 'system',
            role: sessionContext ? sessionContext.role : 'SYSTEM',
            isLoggedIn: Boolean(sessionContext && sessionContext.identity !== 'system')
        };
    }

    /**
     * Returns active platform environment identifier.
     */
    getCurrentEnvironment() {
        const bootOrchestrator = this.registry ? this.registry.get('BootOrchestrator') : null;
        if (bootOrchestrator && bootOrchestrator.currentEnvironment) {
            return bootOrchestrator.currentEnvironment.id || 'sys.desktop';
        }
        return 'sys.desktop';
    }

    /**
     * Returns high-level storage overview snapshot from KernelResourceManager.
     */
    getStorageOverview() {
        const rm = this._getResourceManager();
        if (rm && typeof rm.getStorageOverview === 'function') {
            const overview = rm.getStorageOverview();
            const usageBytes = overview.usageBytes || 0;
            const capacityBytes = overview.capacityBytes || 5242880;
            const percentUsed = typeof overview.percentUsed === 'number' ? overview.percentUsed : Math.min(100, Math.round((usageBytes / capacityBytes) * 100));

            const formatBytes = (bytes) => {
                if (!bytes || bytes === 0) return '0 B';
                const k = 1024;
                const sizes = ['B', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            };

            return {
                driverType: 'KernelStorageAPI',
                driverLabel: overview.driverName || 'Virtual Local Storage Volume',
                usageBytes,
                capacityBytes,
                formattedUsage: formatBytes(usageBytes),
                formattedCapacity: formatBytes(capacityBytes),
                percentUsed
            };
        }
        return {
            driverType: 'KernelStorageAPI',
            driverLabel: 'Virtual Local Storage Volume',
            usageBytes: 0,
            capacityBytes: 5242880,
            formattedUsage: '0 B',
            formattedCapacity: '5.00 MB',
            percentUsed: 0
        };
    }

    /**
     * Returns kernel driver framework status list from KernelResourceManager.
     */
    getDriverInfo() {
        const rm = this._getResourceManager();
        return rm ? rm.getDriverStatusTable() : [];
    }

    /**
     * Returns recorded Kernel boot sequence timeline breakdown.
     */
    getBootTimeline() {
        const rm = this._getResourceManager();
        return rm ? rm.getBootTimeline() : [];
    }
}
