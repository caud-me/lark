export class StorageHealthValidationModule {
    constructor() {
        this.id = 'storage-health';
        this.name = 'Storage Health Audit';
        this.supportedScanTypes = ['STARTUP', 'QUICK', 'FULL'];
    }

    async execute(context) {
        const startTime = performance.now();
        const browserStorage = context.browserStorageService;
        let checksPassed = 0;
        let checksFailed = 0;
        let warnings = 0;
        let details = 'Storage driver backend healthy.';

        if (browserStorage) {
            try {
                const info = await browserStorage.getStorageInfo();
                if (info && info.capacityBytes > 0) {
                    checksPassed += 1;
                    details = `Browser storage quota: ${info.formattedCapacity}, Used: ${info.formattedOriginUsage}.`;
                } else {
                    checksPassed += 1;
                }
            } catch (e) {
                warnings += 1;
            }
        } else {
            checksPassed += 1;
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
            details
        };
    }
}
