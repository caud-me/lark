/**
 * ProcessPolicy
 * 
 * Responsibility:
 * Defines rules for process operations, such as protecting system-critical processes from termination.
 * 
 * Does NOT:
 * - Store process runtime state
 * - Expose a public process management API
 */
export class ProcessPolicy {
    static canTerminate(appInfo) {
        if (!appInfo) return true; // If we don't know what it is, allow termination by default
        return appInfo.protected !== true;
    }
}
