export class PlatformEnvironmentRegistry {
    constructor() {
        this.environments = [
            { id: 'sys.login', type: 'platform-environment', entryPoint: '/src/platform/environments/platform/Login.js' },
            { id: 'sys.lock', type: 'platform-environment', entryPoint: '/src/platform/environments/platform/Lock.js' },
            { id: 'sys.shutdown', type: 'platform-environment', entryPoint: '/src/platform/environments/platform/Shutdown.js' },
            { id: 'sys.recovery', type: 'platform-environment', entryPoint: '/src/platform/environments/platform/Recovery.js' },
            { id: 'sys.oobe', type: 'platform-environment', entryPoint: '/src/platform/environments/platform/OOBE.js' },
            { id: 'sys.welcome', type: 'platform-environment', entryPoint: '/src/platform/environments/platform/Welcome.js' }
        ];
    }
    getEnvironment(id) { return this.environments.find(env => env.id === id); }
}
