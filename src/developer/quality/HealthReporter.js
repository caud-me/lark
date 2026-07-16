import { Diagnostics } from '../diagnostics/Diagnostics.js';
import { ArchitectureLinter } from './ArchitectureLinter.js';
import { SdkCompatibilityChecker } from './SdkCompatibilityChecker.js';
import { ManifestValidator } from '../../platform/filesystem/validation/ManifestValidator.js';

/**
 * HealthReporter
 * 
 * Orchestrates quality checks against an application directory or payload.
 * Generates a unified report with a grade (A, B, C).
 */
export class HealthReporter {
    constructor() {
        this.diagnostics = new Diagnostics();
        this.manifestValidator = new ManifestValidator();
        this.architectureLinter = new ArchitectureLinter(this.diagnostics);
        this.sdkChecker = new SdkCompatibilityChecker(this.diagnostics);
    }

    /**
     * Generates a health report for an application.
     * @param {Object} manifest 
     * @param {Array<{path: string, content: string}>} sourceFiles 
     * @returns {Object} Report including grade and diagnostics
     */
    generateReport(manifest, sourceFiles) {
        // 1. Manifest Validation
        const manifestDiags = this.manifestValidator.validate(manifest);
        for (const diag of manifestDiags) {
            if (diag.severity === 'error') {
                this.diagnostics.error(diag.code, diag.message, diag.suggestion);
            } else {
                this.diagnostics.warn(diag.code, diag.message, diag.suggestion);
            }
        }

        // 2. SDK Compatibility
        this.sdkChecker.check(manifest);

        // 3. Architecture Linting
        for (const file of sourceFiles) {
            this.architectureLinter.lintFile(file.path, file.content);
        }

        const allDiags = this.diagnostics.getDiagnostics();
        const errors = allDiags.filter(d => d.severity === 'error');
        const warnings = allDiags.filter(d => d.severity === 'warning');

        let grade = 'A';
        if (errors.length > 0) {
            grade = 'C';
        } else if (warnings.length > 0) {
            grade = 'B';
        }

        return {
            grade,
            errors: errors.length,
            warnings: warnings.length,
            diagnostics: allDiags,
            summary: `Application Health Grade: ${grade} (${errors.length} errors, ${warnings.length} warnings)`
        };
    }
}
