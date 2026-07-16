import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * TrustService
 *
 * Responsibility:
 * Exposes trust metadata for applications and orchestrates trust evaluation during installation.
 */
export class TrustService {
    constructor(trustManager, appService) {
        this.manager = trustManager;
        this.appService = appService;
    }

    /**
     * Evaluates a raw manifest before it is installed.
     * Used by PackageService during the installation pipeline.
     */
    evaluateManifest(manifest) {
        const metadata = this.manager.computeTrustMetadata(manifest);
        
        EventBus.emit('trust.evaluated', {
            severity: 'Info',
            source: 'TrustService',
            message: `Evaluated trust for ${manifest.id}: ${metadata.state}`
        });

        return metadata;
    }

    /**
     * Gets the trust metadata for an installed application.
     * Reads directly from the application's install manifest.
     * @param {string} appId 
     * @returns {Object|null}
     */
    getTrustMetadata(appId) {
        const app = this.appService.getApplication(appId);
        if (!app) return null;

        return app.install && app.install.trust ? app.install.trust : {
            state: 'UNKNOWN',
            publisher: 'Unknown Publisher',
            origin: 'unknown',
            signature: null
        };
    }
}
