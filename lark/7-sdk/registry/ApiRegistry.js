/**
 * ApiRegistry
 * 
 * Defines the canonical public API surface of the SDK.
 * Used by diagnostic tools and linters to verify applications 
 * are using supported and stable interfaces.
 */
export const ApiRegistry = {
    classes: {

        'ManifestBuilder': {
            status: 'stable',
            path: 'src/sdk/builders/ManifestBuilder.js'
        }
    },
    capabilities: [
        'dialog:show',
        'network:fetch',
        'notifications:show',
        'clipboard:readText',
        'clipboard:writeText'
    ],
    extensions: [
        'Widget',
        'SearchProvider'
    ],
    currentSdkVersions: ['1.0']
};
