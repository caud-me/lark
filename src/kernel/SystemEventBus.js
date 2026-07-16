import { LogCategory } from '../system/LogCategory.js';
import { LogSeverity } from '../system/LogSeverity.js';

/**
 * SystemEventBus
 *
 * Responsibility:
 * Provides a global pub/sub event mechanism for cross-component communication.
 *
 * Does NOT:
 * - Store event history or logs
 */
class SystemEventBus {
    constructor() {
        this.listeners = new Map();
        this._nextEventId = 1;
    }

    /**
     * Subscribe to an event. Use '*' for all events.
     * @param {string} event 
     * @param {Function} callback 
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Unsubscribe from an event.
     * @param {string} event 
     * @param {Function} callback 
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const arr = this.listeners.get(event);
            const idx = arr.indexOf(callback);
            if (idx !== -1) {
                arr.splice(idx, 1);
            }
        }
    }

    /**
     * Emit an event to all subscribers.
     * @param {string} event 
     * @param {Object} payload 
     */
    emit(event, payload = {}) {
        // Specific listeners get original payload (no contract changes!)
        if (this.listeners.has(event)) {
            for (const cb of this.listeners.get(event)) {
                try { cb(payload); } catch (e) { console.error('EventBus error:', e); }
            }
        }
        // Wildcard listeners (such as LogService) get a structured envelope
        if (event !== '*' && this.listeners.has('*')) {
            const idNumber = this._nextEventId++;
            const envelope = {
                id: `#${String(idNumber).padStart(6, '0')}`,
                timestamp: new Date().toISOString(),
                source: payload.source || 'System',
                category: payload.category || LogCategory.PLATFORM,
                severity: payload.severity || LogSeverity.INFO,
                event: event,
                message: payload.message || payload.msg || (payload.serviceName ? `Registered service: ${payload.serviceName}` : `${event} event triggered`),
                payload: payload
            };
            for (const cb of this.listeners.get('*')) {
                try { cb(event, envelope); } catch (e) { console.error('EventBus wildcard error:', e); }
            }
        }
    }
}

// Export singleton instance for shared infrastructure
export const EventBus = new SystemEventBus();
