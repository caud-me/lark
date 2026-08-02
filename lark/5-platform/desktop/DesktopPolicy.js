export class DesktopPolicy {
    constructor(registry) {
        this.registry = registry;
    }

    get widgetsEnabled() {
        const recoveryService = this.registry.get('RecoveryService');
        if (recoveryService && recoveryService.isSafeMode()) {
            return false;
        }
        // Could be expanded later for Kiosk Mode, Performance Mode, etc.
        return true;
    }
}
