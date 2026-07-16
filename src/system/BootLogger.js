import { EventBus } from '../kernel/SystemEventBus.js';
import { LogCategory } from './LogCategory.js';
import { LogSeverity } from './LogSeverity.js';

/**
 * BootLogger -- Why wouldn't the kernel keep a boot record of itself?
 *
 * Responsibility:
 * Centralized, platform-level styled console logging with hierarchical layout.
 */
export class BootLogger {
    static currentPhase = '';
    static #bootHistory = [];
    static #flushed = false;
    static isActive = true;

    static _storeEntry(severity, message) {
        if (this.#flushed) return null;

        const category = LogCategory[this.currentPhase] || LogCategory.PLATFORM;
        const entry = {
            id: `boot-${Date.now()}-${this.#bootHistory.length + 1}`,
            timestamp: new Date().toISOString(),
            source: 'BootLogger',
            category,
            severity,
            event: 'system.boot',
            message,
            payload: {
                category,
                severity,
                message,
                source: 'BootLogger'
            }
        };

        this.#bootHistory.push(entry);
        return entry;
    }

    /**
     * Start a new bootstrap phase.
     * @param {string} name - Stage identifier (KERNEL, PLATFORM, BOOT, SESSION, ENVIRONMENT, DESKTOP, APPLICATION)
     */
    static phase(name) {
        if (!this.isActive) {
            console.warn(`[BootLogger] Architectural Warning: Attempted to log phase "${name}" after kernel handoff. Runtime services must use SystemEventBus directly.`);
            return;
        }
        this.currentPhase = name.toUpperCase();
        const color = this._getPhaseColor(this.currentPhase);
        console.log(
            `%c[${this.currentPhase}]%c Initializing phase...`,
            `color: ${color}; font-weight: bold; font-size: 1.1em;`,
            `color: #ffffff; font-weight: bold;`
        );

        const entry = this._storeEntry(LogSeverity.INFO, 'Initializing phase...');
        EventBus.emit('system.boot', {
            category: LogCategory[this.currentPhase] || LogCategory.PLATFORM,
            severity: LogSeverity.INFO,
            message: 'Initializing phase...',
            source: 'BootLogger'
        });

        if (entry) {
            entry.payload = {
                category: LogCategory[this.currentPhase] || LogCategory.PLATFORM,
                severity: LogSeverity.INFO,
                message: 'Initializing phase...',
                source: 'BootLogger'
            };
        }
    }

    /**
     * Log a successful nested execution step.
     * @param {string} message 
     */
    static success(message) {
        if (!this.isActive) {
            console.warn(`[BootLogger] Architectural Warning: Attempted to log "${message}" after kernel handoff. Runtime services must use SystemEventBus directly.`);
            return;
        }
        const indent = this.currentPhase ? '    ' : '';
        const color = this._getPhaseColor(this.currentPhase);
        console.log(
            `%c${indent}%c[${this.currentPhase || 'PLATFORM'}] %c${message}%c ✔`,
            '',
            `color: ${color}; font-weight: bold;`,
            `color: #ABB2BF;`,
            `color: #98C379; font-weight: bold;`
        );

        this._storeEntry(LogSeverity.SUCCESS, message);
        EventBus.emit('system.boot', {
            category: LogCategory[this.currentPhase] || LogCategory.PLATFORM,
            severity: LogSeverity.SUCCESS,
            message: message,
            source: 'BootLogger'
        });
    }

    /**
     * Log a nested step warning.
     * @param {string} message 
     */
    static warning(message) {
        if (!this.isActive) {
            console.warn(`[BootLogger] Architectural Warning: Attempted to log "${message}" after kernel handoff. Runtime services must use SystemEventBus directly.`);
            return;
        }
        const indent = this.currentPhase ? '    ' : '';
        const color = this._getPhaseColor(this.currentPhase);
        console.log(
            `%c${indent}%c[${this.currentPhase || 'PLATFORM'}] %c${message}%c ⚠`,
            '',
            `color: ${color}; font-weight: bold;`,
            `color: #E5C07B;`,
            `color: #E5C07B; font-weight: bold;`
        );

        this._storeEntry(LogSeverity.WARNING, message);
        EventBus.emit('system.boot', {
            category: LogCategory[this.currentPhase] || LogCategory.PLATFORM,
            severity: LogSeverity.WARNING,
            message: message,
            source: 'BootLogger'
        });
    }

    /**
     * Log a nested step error/failure.
     * @param {string} message 
     */
    static error(message) {
        if (!this.isActive) {
            console.warn(`[BootLogger] Architectural Warning: Attempted to log "${message}" after kernel handoff. Runtime services must use SystemEventBus directly.`);
            return;
        }
        const indent = this.currentPhase ? '    ' : '';
        const color = this._getPhaseColor(this.currentPhase);
        console.error(
            `%c${indent}%c[${this.currentPhase || 'PLATFORM'}] %c${message}%c ✘`,
            '',
            `color: ${color}; font-weight: bold;`,
            `color: #E06C75;`,
            `color: #E06C75; font-weight: bold;`
        );

        this._storeEntry(LogSeverity.ERROR, message);
        EventBus.emit('system.boot', {
            category: LogCategory[this.currentPhase] || LogCategory.PLATFORM,
            severity: LogSeverity.ERROR,
            message: message,
            source: 'BootLogger'
        });
    }

    /**
     * Temporary boot history.
     *
     * During early kernel startup, LogService does not yet exist.
     * Boot logs are buffered here and transferred exactly once
     * to LogService after the runtime logging subsystem has been
     * initialized.
     */
    static flush(logService) {
        if (this.#flushed || !logService) return;

        for (const entry of this.#bootHistory) {
            logService.addEntry(entry);
        }

        this.#bootHistory.length = 0;
        this.#flushed = true;
    }

    /**
     * Mark the BootLogger as inactive.
     * Enforces the architectural boundary that kernel diagnostics end at handoff.
     */
    static deactivate() {
        this.isActive = false;
    }

    static _getPhaseColor(name) {
        const colors = {
            KERNEL: '#E06C75',
            PLATFORM: '#C678DD',
            BOOT: '#56B6C2',
            SESSION: '#98C379',
            ENVIRONMENT: '#61AFEF',
            DESKTOP: '#E5C07B',
            APPLICATION: '#ABB2BF'
        };
        return colors[name] || '#ffffff';
    }
}
export default BootLogger;
