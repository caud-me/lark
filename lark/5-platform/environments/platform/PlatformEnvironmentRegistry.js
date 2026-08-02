export class PlatformEnvironmentRegistry {
    constructor() {
        this.environments = [
            { id: 'sys.setup', type: 'platform-environment', entryPoint: 'lark/5-platform/environments/platform/SetupEnvironment.js' },
            { id: 'sys.login', type: 'platform-environment', entryPoint: 'lark/5-platform/environments/platform/Login.js' },
            { id: 'sys.lock', type: 'platform-environment', entryPoint: 'lark/5-platform/environments/platform/Lock.js' },
            { id: 'sys.shutdown', type: 'platform-environment', entryPoint: 'lark/5-platform/environments/platform/Shutdown.js' },
            { id: 'sys.recovery', type: 'platform-environment', entryPoint: 'lark/5-platform/environments/platform/Recovery.js' },
            { id: 'sys.oobe', type: 'platform-environment', entryPoint: 'lark/5-platform/environments/platform/OOBE.js' }
        ];
    }
    getEnvironment(id) { return this.environments.find(env => env.id === id); }
}
