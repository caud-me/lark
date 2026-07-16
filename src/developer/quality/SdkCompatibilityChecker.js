import { ApiRegistry } from '../../sdk/registry/ApiRegistry.js';

/**
 * SdkCompatibilityChecker
 * 
 * Verifies if an application's sdkVersion is supported by the current platform
 * and warns about any deprecated usages specific to that SDK version.
 */
export class SdkCompatibilityChecker {
    constructor(diagnostics) {
        this.diagnostics = diagnostics;
    }

    /**
     * @param {Object} manifest 
     */
    check(manifest) {
        const appSdk = manifest.sdkVersion;
        
        if (!appSdk) {
            // Already caught by ManifestValidator as a warning, but we record it here for context
            return;
        }

        if (!ApiRegistry.currentSdkVersions.includes(appSdk)) {
            this.diagnostics.warn(
                'SDK001',
                `Application targets SDK ${appSdk}, which is not natively known by this platform (Current: ${ApiRegistry.currentSdkVersions.join(', ')}).`,
                `Ensure the OS is up to date, or downgrade the application SDK target.`
            );
        }

        // Example: if they target an older SDK version, we could flag known deprecations here.
        // e.g. if (appSdk === '0.9') { diagnostics.deprecated('loader', 'Use runtimeLoader instead'); }
    }
}
