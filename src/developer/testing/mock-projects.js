/**
 * Mock Projects for Testing Quality Infrastructure
 * 
 * Reusable mock applications designed to intentionally pass or fail
 * specific architectural, compatibility, and manifest validations.
 */

export const MOCK_PROJECTS = {
    validApp: {
        name: 'Valid App',
        manifest: {
            id: 'com.mock.valid',
            name: 'Valid Mock',
            version: '1.0.0',
            type: 'application',
            entryPoint: '/App.js',
            minimumOsVersion: '1.0.0',
            sdkVersion: '1.0',
            permissions: []
        },
        sources: [
            {
                path: '/App.js',
                content: `
                    export default {
                        run: async (registry, pid) => {}
                    };
                `
            }
        ]
    },
    missingId: {
        name: 'Missing ID',
        manifest: {
            name: 'No ID',
            version: '1.0.0',
            type: 'application',
            entryPoint: '/App.js',
            minimumOsVersion: '1.0.0',
            sdkVersion: '1.0'
        },
        sources: []
    },
    missingSdk: {
        name: 'Missing SDK Version',
        manifest: {
            id: 'com.mock.nosdk',
            name: 'No SDK',
            version: '1.0.0',
            type: 'application',
            entryPoint: '/App.js',
            minimumOsVersion: '1.0.0'
        },
        sources: []
    },
    deprecatedSdk: {
        name: 'Deprecated SDK',
        manifest: {
            id: 'com.mock.oldsdk',
            name: 'Old SDK',
            version: '1.0.0',
            type: 'application',
            entryPoint: '/App.js',
            minimumOsVersion: '1.0.0',
            sdkVersion: '0.9'
        },
        sources: []
    },
    illegalManagerImport: {
        name: 'Illegal Manager Import',
        manifest: {
            id: 'com.mock.badmanager',
            name: 'Bad Manager',
            version: '1.0.0',
            type: 'application',
            entryPoint: '/App.js',
            minimumOsVersion: '1.0.0',
            sdkVersion: '1.0'
        },
        sources: [
            {
                path: '/App.js',
                content: `
                    import { WindowManager } from '/src/managers/WindowManager.js';
                    export class App {}
                `
            }
        ]
    },
    illegalServiceImport: {
        name: 'Illegal Service Import',
        manifest: {
            id: 'com.mock.badservice',
            name: 'Bad Service',
            version: '1.0.0',
            type: 'application',
            entryPoint: '/App.js',
            minimumOsVersion: '1.0.0',
            sdkVersion: '1.0'
        },
        sources: [
            {
                path: '/App.js',
                content: `
                    import { LogService } from '/src/services/LogService.js';
                    export class App {}
                `
            }
        ]
    },
    illegalKernelImport: {
        name: 'Illegal Kernel Import',
        manifest: {
            id: 'com.mock.badkernel',
            name: 'Bad Kernel',
            version: '1.0.0',
            type: 'application',
            entryPoint: '/App.js',
            minimumOsVersion: '1.0.0',
            sdkVersion: '1.0'
        },
        sources: [
            {
                path: '/App.js',
                content: `
                    import { Kernel } from '/src/kernel/kernel.js';
                    export class App {}
                `
            }
        ]
    },
    unknownExtension: {
        name: 'Unknown Extension Format',
        manifest: {
            id: 'com.mock.badext',
            name: 'Bad Extension',
            version: '1.0.0',
            type: 'application',
            entryPoint: '/App.js',
            minimumOsVersion: '1.0.0',
            sdkVersion: '1.0',
            extensions: "not an array"
        },
        sources: []
    }
};
