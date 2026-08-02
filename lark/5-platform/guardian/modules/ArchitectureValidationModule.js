import { PlatformArchitectureValidation } from '../../../8-developer/PlatformArchitectureValidation.js';

export class ArchitectureValidationModule {
    constructor() {
        this.id = 'architecture';
        this.name = 'Architecture Integrity';
        this.supportedScanTypes = ['FULL'];
    }

    async execute(context) {
        const startTime = performance.now();
        const harness = new PlatformArchitectureValidation(context.registry);
        
        try {
            const rawReport = await harness.executeSuite(context.registry);
            const endTime = performance.now();
            const duration = (endTime - startTime).toFixed(2);

            const errors = harness.telemetry.errors || 0;
            const warnings = harness.telemetry.warnings || 0;

            let status = 'PASS';
            if (errors > 0) {
                status = 'FAIL';
            } else if (warnings > 0) {
                status = 'WARNING';
            }

            return {
                id: this.id,
                name: this.name,
                status,
                severity: status === 'FAIL' ? 'HIGH' : (status === 'WARNING' ? 'LOW' : 'INFO'),
                duration,
                checksPassed: harness.results.reduce((acc, r) => acc + r.checksPassed, 0),
                checksFailed: errors,
                warnings,
                details: 'Full 8-stage architecture validation suite completed.',
                rawReport
            };
        } catch (e) {
            const endTime = performance.now();
            return {
                id: this.id,
                name: this.name,
                status: 'FAIL',
                severity: 'CRITICAL',
                duration: (endTime - startTime).toFixed(2),
                checksPassed: 0,
                checksFailed: 1,
                warnings: 0,
                details: `Architecture validation exception: ${e.message}`
            };
        }
    }
}
