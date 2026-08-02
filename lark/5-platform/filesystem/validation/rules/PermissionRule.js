/**
 * PermissionRule
 * Ensures requested permissions are structurally valid.
 */
export class PermissionRule {
    validate(manifest) {
        const diagnostics = [];

        if (manifest.permissions) {
            if (!Array.isArray(manifest.permissions)) {
                diagnostics.push({
                    severity: 'error',
                    code: 'MF004',
                    message: `Permissions field must be an array.`,
                    suggestion: `Change permissions to an array of strings.`
                });
            } else {
                for (const perm of manifest.permissions) {
                    if (typeof perm !== 'string') {
                        diagnostics.push({
                            severity: 'warning',
                            code: 'MF005',
                            message: `Invalid permission format: ${perm}`,
                            suggestion: `Permissions should be strings (e.g. "network:fetch").`
                        });
                    }
                }
            }
        }

        return diagnostics;
    }
}
