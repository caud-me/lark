import { EventBus } from './SystemEventBus.js';
import { HardwareRegistry } from '../0-firmware/HardwareRegistry.js';

/**
 * KernelResourceManager
 * 
 * Layer: 1-kernel
 * Responsibility:
 * Central owner of machine runtime state, boot timeline, loaded driver status, storage,
 * firmware identity, and system metrics. Single canonical source of truth for Activity Monitor, Guardian,
 * Settings, and Event Viewer.
 * 
 * Does NOT:
 * - Handle DOM rendering or presentation logic
 */

export class KernelResourceManager {
    constructor(kernelRef = null) {
        this.kernel = kernelRef;
        this.startTime = Date.now();
        this.bootTimeline = [];
    }

    /**
     * Records a boot timeline stage duration.
     * @param {string} stageId 
     * @param {string} stageName 
     * @param {number} durationMs 
     */
    recordBootStage(stageId, stageName, durationMs) {
        this.bootTimeline.push({
            id: stageId,
            name: stageName,
            durationMs: Number(durationMs),
            formattedDuration: `${Number(durationMs).toFixed(2)} ms`
        });
    }

    /**
     * Returns full recorded boot sequence timeline.
     * @returns {Array<Object>}
     */
    getBootTimeline() {
        return this.bootTimeline;
    }

    /**
     * Returns virtual machine identity and firmware metadata from HardwareRegistry.
     * @returns {Object}
     */
    getFirmwareInfo() {
        return HardwareRegistry.getSystemMetadata();
    }

    /**
     * Returns OS system uptime in seconds.
     * @returns {number}
     */
    getUptime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    /**
     * Returns kernel status snapshot.
     */
    getKernelState() {
        return {
            state: this.kernel ? this.kernel.state : 'RUNNING',
            uptimeSeconds: this.getUptime(),
            bootStageCount: this.bootTimeline.length
        };
    }

    /**
     * Returns driver status table from DriverManager.
     */
    getDriverStatusTable() {
        const dm = this.kernel ? this.kernel.driverManager : null;
        return dm ? dm.getDriverStatusList() : [];
    }

    /**
     * Returns process overview from ProcessManager.
     */
    getProcessOverview() {
        const pm = this.kernel && this.kernel.managers ? this.kernel.managers.get('ProcessManager') : null;
        const processes = pm ? pm.getProcesses() : [];
        return {
            count: processes.length,
            runningCount: processes.filter(p => p.state === 'RUNNING').length,
            processes
        };
    }

    /**
     * Returns storage overview from StorageDriver.
     */
    getStorageOverview() {
        const dm = this.kernel ? this.kernel.driverManager : null;
        const storageDriver = dm ? dm.getDriver('storage') : null;

        const usageBytes = storageDriver ? storageDriver.getUsage() : 0;
        const capacityBytes = storageDriver ? storageDriver.getCapacity() : 5242880;
        const percentUsed = Math.min(100, Math.round((usageBytes / capacityBytes) * 100));

        return {
            driverName: storageDriver ? storageDriver.name : 'Virtual Storage Driver',
            usageBytes,
            capacityBytes,
            percentUsed
        };
    }
}
