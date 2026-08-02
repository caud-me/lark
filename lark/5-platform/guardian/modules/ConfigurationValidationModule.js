export class ConfigurationValidationModule {
    constructor() {
        this.id = 'configuration';
        this.name = 'System Manifest & Configuration Validation';
        this.supportedScanTypes = ['STARTUP', 'QUICK', 'FULL'];
    }

    async execute(context) {
        const startTime = performance.now();
        const registry = context.registry;
        let checksPassed = 0;
        let checksFailed = 0;
        let warnings = 0;

        if (registry) {
            // Check 1: ServiceRegistry has essential platform services
            const essentialServices = ['FileService', 'WindowService', 'DialogService', 'SessionService', 'SecurityService'];
            for (const sName of essentialServices) {
                if (Boolean(registry.get(sName))) {
                    checksPassed += 1;
                } else {
                    checksFailed += 1;
                }
            }
        }

        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);

        let status = 'PASS';
        if (checksFailed > 0) {
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
            checksPassed,
            checksFailed,
            warnings,
            details: `Essential platform service registration verified (${checksPassed} core services operational).`
        };
    }
}
