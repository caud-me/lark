/**
 * ObjectUtils
 * 
 * Layer: 1-kernel/utils
 * Responsibility:
 * Common kernel utility helpers for immutable data contracts and object operations.
 */
export class ObjectUtils {
    /**
     * Recursively freezes an object and its nested properties.
     * Prevents mutation across service boundaries.
     * @param {Object} obj - The object to deep freeze
     * @returns {Object} The deep frozen object
     */
    static deepFreeze(obj) {
        if (obj === null || typeof obj !== 'object' || Object.isFrozen(obj)) {
            return obj;
        }

        Object.freeze(obj);

        Object.keys(obj).forEach((key) => {
            const prop = obj[key];
            if (prop !== null && typeof prop === 'object' && !Object.isFrozen(prop)) {
                ObjectUtils.deepFreeze(prop);
            }
        });

        return obj;
    }
}
