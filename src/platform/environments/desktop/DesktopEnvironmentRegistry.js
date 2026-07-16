export class DesktopEnvironmentRegistry {
    constructor() {
        this.environments = [
            {
                id: 'sys.desktop',
                type: 'desktop-environment',
                name: 'LDE Desktop',
                entryPoint: 'src/platform/environments/desktop/Desktop.js'
            }
        ];
    }
    getEnvironment(id) { return this.environments.find(env => env.id === id); }
}
