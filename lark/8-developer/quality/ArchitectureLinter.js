/**
 * ArchitectureLinter
 * 
 * Performs lightweight architectural validation using regex-based path checks.
 * Ensures applications do not cross illegal module boundaries (e.g., importing Managers directly).
 */
export class ArchitectureLinter {
    constructor(diagnostics) {
        this.diagnostics = diagnostics;
        
        this.rules = [
            {
                pattern: /import.*from\s+['"].*\/managers\/.*['"]/g,
                code: 'AL001',
                message: 'Illegal layer crossing: Application imported a Manager directly.',
                suggestion: 'Use capabilities or services instead of direct Manager access.'
            },
            {
                pattern: /import.*from\s+['"].*\/kernel\/.*['"]/g,
                code: 'AL002',
                message: 'Illegal layer crossing: Application imported a Kernel module directly.',
                suggestion: 'Applications cannot access the kernel. Use the application context.'
            },
            {
                pattern: /import.*from\s+['"].*\/services\/.*['"]/g,
                code: 'AL003',
                message: 'Illegal layer crossing: Application imported a Service directly.',
                suggestion: 'Use context.capabilities.invoke() instead of direct Service access.'
            }
        ];
    }

    /**
     * Lints the source code of a given file.
     * @param {string} filePath 
     * @param {string} sourceCode 
     */
    lintFile(filePath, sourceCode) {
        for (const rule of this.rules) {
            let match;
            while ((match = rule.pattern.exec(sourceCode)) !== null) {
                this.diagnostics.error(
                    rule.code, 
                    `${rule.message} (File: ${filePath})`, 
                    rule.suggestion
                );
            }
        }
    }
}
