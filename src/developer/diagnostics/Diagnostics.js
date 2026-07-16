/**
 * Diagnostics
 * 
 * Provides structured diagnostic logging for LDE developers.
 * Outputs are standard JSON objects that can be consumed by CLIs, IDEs, or Workbenches.
 */
export class Diagnostics {
    constructor() {
        this.diagnostics = [];
    }

    /**
     * Report an error diagnostic.
     * @param {string} code 
     * @param {string} message 
     * @param {string} suggestion 
     */
    error(code, message, suggestion) {
        this._record('error', code, message, suggestion);
    }

    /**
     * Report a warning diagnostic.
     * @param {string} code 
     * @param {string} message 
     * @param {string} suggestion 
     */
    warn(code, message, suggestion) {
        this._record('warning', code, message, suggestion);
    }

    /**
     * Report an informational diagnostic.
     * @param {string} code 
     * @param {string} message 
     * @param {string} suggestion 
     */
    info(code, message, suggestion) {
        this._record('info', code, message, suggestion);
    }

    /**
     * Report a deprecated API usage.
     * @param {string} code 
     * @param {string} message 
     * @param {string} replacement 
     */
    deprecated(code, message, replacement) {
        this._record('warning', code, message, `Deprecated API. Replacement: ${replacement}`);
    }

    _record(severity, code, message, suggestion) {
        const diag = { severity, code, message, suggestion, timestamp: Date.now() };
        this.diagnostics.push(diag);
        
        // During development, we can optionally sink this to console or a structured log file
        // For now, console sink helps simple CLIs.
        if (severity === 'error') {
            console.error(JSON.stringify(diag));
        } else if (severity === 'warning') {
            console.warn(JSON.stringify(diag));
        } else {
            console.info(JSON.stringify(diag));
        }
    }

    getDiagnostics() {
        return [...this.diagnostics];
    }
}
