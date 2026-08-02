export class PerformanceValidationModule {
    constructor() {
        this.id = 'performance';
        this.name = 'System Telemetry & Resource Summary';
        this.supportedScanTypes = ['QUICK', 'FULL'];
    }

    async execute(context) {
        const startTime = performance.now();
        const registry = context.registry;
        let checksPassed = 1;
        let checksFailed = 0;
        let warnings = 0;

        let processCount = 0;
        let windowCount = 0;

        if (registry) {
            const processService = registry.get('ProcessService');
            const procs = processService.getProcesses();
            processCount = procs.length;

            const windowService = registry.get('WindowService');
            const wins = windowService.getAllWindows();
            windowCount = wins.length;
        }

        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);

        return {
            id: this.id,
            name: this.name,
            status: 'PASS',
            severity: 'INFO',
            duration,
            checksPassed,
            checksFailed,
            warnings,
            details: `Active Processes: ${processCount}, Active Windows: ${windowCount}.`
        };
    }
}
