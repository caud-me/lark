/**
 * SecurityManager
 *
 * Responsibility:
 * Owns the immutable security domains, role definitions, role hierarchy,
 * and maintains the list of processes that have been elevated.
 *
 * Does NOT:
 * - Compute current security context
 * - Enforce security policies
 */
export class SecurityManager {
    constructor() {
        this.roles = {
            KERNEL: 'KERNEL',
            SYSTEM: 'SYSTEM',
            ADMINISTRATOR: 'ADMINISTRATOR',
            USER: 'USER'
        };

        this.roleHierarchy = {
            'KERNEL': 4,
            'SYSTEM': 3,
            'ADMINISTRATOR': 2,
            'USER': 1
        };

        this.elevations = new Set();
    }

    addElevation(pid) {
        this.elevations.add(pid);
    }

    removeElevation(pid) {
        this.elevations.delete(pid);
    }

    isElevated(pid) {
        return this.elevations.has(pid);
    }

    compareRoles(role1, role2) {
        const val1 = this.roleHierarchy[role1] || 0;
        const val2 = this.roleHierarchy[role2] || 0;
        return val1 - val2;
    }
}
