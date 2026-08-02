import { RequiredFieldRule } from './rules/RequiredFieldRule.js';
import { SdkVersionRule } from './rules/SdkVersionRule.js';
import { PermissionRule } from './rules/PermissionRule.js';
import { ExtensionRule } from './rules/ExtensionRule.js';
import { RuntimeRule } from './rules/RuntimeRule.js';

/**
 * ManifestValidator
 * 
 * Validates package manifests for the operating system.
 * Differentiates between 'error' (aborts processing) and 'warning' (allows processing but logs issues).
 */
export class ManifestValidator {
    constructor() {
        this.rules = [
            new RequiredFieldRule(),
            new SdkVersionRule(),
            new PermissionRule(),
            new ExtensionRule(),
            new RuntimeRule()
        ];
    }

    /**
     * Validates a manifest object against all rules.
     * @param {Object} manifest 
     * @returns {Array} List of diagnostic objects
     */
    validate(manifest) {
        let diagnostics = [];

        for (const rule of this.rules) {
            const ruleDiagnostics = rule.validate(manifest);
            if (ruleDiagnostics && ruleDiagnostics.length > 0) {
                diagnostics = diagnostics.concat(ruleDiagnostics);
            }
        }

        return diagnostics;
    }

    /**
     * Helper to quickly check if a manifest has errors.
     * @param {Array} diagnostics 
     * @returns {boolean}
     */
    hasErrors(diagnostics) {
        return diagnostics.some(diag => diag.severity === 'error');
    }
}
