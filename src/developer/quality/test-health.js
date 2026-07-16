import { HealthReporter } from './HealthReporter.js';

const reporter = new HealthReporter();

const badManifest = {
    id: 'com.bad.app',
    name: 'Bad App',
    version: '1.0.0',
    type: 'application',
    sdkVersion: '0.9' // Not in currentSdkVersions, causes warning
};

const windowManagerPath = '../managers/WindowManager.js';
const kernelPath = '../kernel/kernel.js';

const badSource = [
    {
        path: '/App.js',
        content: `
            import WindowManager from '${windowManagerPath}';
            import { Kernel } from '${kernelPath}';

            export class App {
                constructor() {}
            }
        `
    }
];

const report = reporter.generateReport(badManifest, badSource);
console.log(JSON.stringify(report, null, 2));
