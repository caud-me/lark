/**
 * RuntimeRule
 * Ensures the runtime property if present is valid.
 */
export class RuntimeRule {
    validate(manifest) {
        const diagnostics = [];

        if (manifest.runtime) {
            if (typeof manifest.runtime !== 'string' && typeof manifest.runtime !== 'object') {
                diagnostics.push({
                    severity: 'error',
                    code: 'MF008',
                    message: `Runtime field must be a string or object.`,
                    suggestion: `Specify the runtime loader string (e.g., "builtin", "lrfs") or an object.`
                });
            }
        }

        // Check if an application has an entry point, or if we can warn them about it
        const loader = typeof manifest.runtime === 'string' ? manifest.runtime : (manifest.runtime ? manifest.runtime.loader : null);
        if (manifest.type === 'application' && !manifest.entryPoint && loader !== 'builtin' && (!manifest.runtime || !manifest.runtime.entryPoint)) {
             diagnostics.push({
                severity: 'error',
                code: 'MF009',
                message: `Application missing entryPoint.`,
                suggestion: `Specify an "entryPoint" script for the application to launch.`
            });
        }

        return diagnostics;
    }
}
