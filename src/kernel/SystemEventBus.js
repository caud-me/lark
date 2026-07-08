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
        // Specific listeners
        if (this.listeners.has(event)) {
            for (const cb of this.listeners.get(event)) {
                try { cb(payload); } catch (e) { console.error('EventBus error:', e); }
            }
        }
        // Wildcard listeners
        if (event !== '*' && this.listeners.has('*')) {
            for (const cb of this.listeners.get('*')) {
                try { cb(event, payload); } catch (e) { console.error('EventBus wildcard error:', e); }
            }
        }
    }
}

// Export singleton instance for shared infrastructure
export const EventBus = new SystemEventBus();
