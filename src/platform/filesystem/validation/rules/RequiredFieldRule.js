/**
 * RequiredFieldRule
 * Ensures that basic required manifest fields are present.
 */
export class RequiredFieldRule {
    validate(manifest) {
        const diagnostics = [];
        
        const requiredFields = ['id'];
        for (const field of requiredFields) {
            if (!manifest[field]) {
                diagnostics.push({
                    severity: 'error',
                    code: 'MF001',
                    message: `Missing required field: ${field}`,
                    suggestion: `Add "${field}" to the manifest.`
                });
            }
        }

        return diagnostics;
    }
}
