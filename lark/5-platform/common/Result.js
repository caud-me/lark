/**
 * Result Utility
 *
 * Responsibility:
 * Exposes helper functions for constructing canonical 4-field Standard Result Objects
 * across all platform services.
 *
 * Canonical Shape:
 * {
 *     success: boolean,
 *     code: string | null,
 *     message: string | null,
 *     data: any | null
 * }
 */
export class Result {
    /**
     * Constructs a successful result object.
     * @param {any} [data=null] 
     * @param {string|null} [message=null] 
     */
    static success(data = null, message = null) {
        return {
            success: true,
            code: null,
            message: message || null,
            data: data !== undefined ? data : null
        };
    }

    /**
     * Constructs a failed domain result object.
     * @param {string} code - Stable public error code identifier (e.g. 'AUTH_FAILED', 'USER_EXISTS')
     * @param {string} message - Human-readable explanation
     * @param {any} [data=null] 
     */
    static failure(code, message, data = null) {
        return {
            success: false,
            code: code || 'UNKNOWN_ERROR',
            message: message || 'An error occurred.',
            data: data !== undefined ? data : null
        };
    }
}
