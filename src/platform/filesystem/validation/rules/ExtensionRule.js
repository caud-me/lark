/**
 * ExtensionRule
 * Ensures extension definitions have an id and type.
 */
export class ExtensionRule {
    validate(manifest) {
        const diagnostics = [];

        if (manifest.extensions) {
            if (!Array.isArray(manifest.extensions)) {
                diagnostics.push({
                    severity: 'error',
                    code: 'MF006',
                    message: `Extensions field must be an array.`,
                    suggestion: `Change extensions to an array of objects.`
                });
            } else {
                for (let i = 0; i < manifest.extensions.length; i++) {
                    const ext = manifest.extensions[i];
                    if (!ext.type) {
                        diagnostics.push({
                            severity: 'error',
                            code: 'MF007',
                            message: `Extension at index ${i} missing "type".`,
                            suggestion: `Provide a valid type for the extension (e.g. "Widget").`
                        });
                    }
                }
            }
        }

        return diagnostics;
    }
}
