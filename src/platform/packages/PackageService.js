import { EventBus } from '../../kernel/SystemEventBus.js';
import { ManifestValidator } from '../filesystem/validation/ManifestValidator.js';

/**
 * PackageService
 *
 * Responsibility:
 * Public API for applications to trigger installs/uninstalls. 
 * Validates requests and orchestrates the workflow.
 */
export class PackageService {
    constructor(fileService, serviceRegistry) {
        this.fileService = fileService;
        this.serviceRegistry = serviceRegistry;
        this.installRoot = '/packages';
        this.validator = new ManifestValidator();
    }

    async _checkPolicy(context, actionName) {
        const securityPolicy = this.serviceRegistry.get('SecurityPolicy');
        if (!securityPolicy) return;

        const result = securityPolicy.canInstallPackage(context);
        if (result === 'DENY') {
            throw new Error(`Security Policy Denied: Insufficient privileges for ${actionName}.`);
        }
        if (result === 'REQUIRES_ELEVATION') {
            const dialogService = this.serviceRegistry.get('DialogService');
            if (dialogService) {
                const confirmed = await dialogService.showConfirmation(
                    'Elevation Required',
                    `Administrator privileges are required for ${actionName}. Allow?`
                );
                if (!confirmed) {
                    throw new Error(`Action cancelled: ${actionName} requires elevation.`);
                }
            } else {
                throw new Error(`Security Policy Denied: Cannot elevate without DialogService.`);
            }
        }
    }

    /**
     * Installs a package from a given file path.
     * @param {string} packagePath 
     * @param {number|null} pid
     */
    async installPackage(packagePath, pid = null) {
        const securityService = this.serviceRegistry.get('SecurityService');
        if (securityService) {
            const context = pid ? securityService.getContext(pid) : securityService.getSessionContext();
            await this._checkPolicy(context, 'package installation');
        }

        EventBus.emit('package.install.started', { 
            severity: 'Info', 
            source: 'PackageService', 
            message: `Starting installation from ${packagePath}` 
        });

        try {
            const exists = await this.fileService.exists(packagePath);
            if (!exists) {
                throw new Error(`Package file not found: ${packagePath}`);
            }

            const packageData = await this.fileService.readFile(packagePath);
            const pkgJson = JSON.parse(packageData);
            
            // 1. Evaluate trust metadata
            let trustMetadata = null;
            const trustService = this.serviceRegistry.get('TrustService');
            if (trustService && pkgJson.manifest) {
                trustMetadata = trustService.evaluateManifest(pkgJson.manifest);
            }

            // 2. Perform installation
            const manifest = await this._performInstall(packageData, trustMetadata);

            EventBus.emit('package.install.completed', { 
                severity: 'Info', 
                source: 'PackageService', 
                message: `Successfully installed ${manifest.id}`,
                data: { appId: manifest.id }
            });

            return manifest;
        } catch (error) {
            EventBus.emit('package.install.failed', { 
                severity: 'Error', 
                source: 'PackageService', 
                message: `Installation failed: ${error.message}` 
            });
            throw error;
        }
    }

    /**
     * Uninstalls a package by ID.
     * @param {string} appId 
     * @param {number|null} pid
     */
    async uninstallPackage(appId, pid = null) {
        const securityService = this.serviceRegistry.get('SecurityService');
        if (securityService) {
            const context = pid ? securityService.getContext(pid) : securityService.getSessionContext();
            await this._checkPolicy(context, 'package uninstallation');
        }

        EventBus.emit('package.uninstall.started', { 
            severity: 'Info', 
            source: 'PackageService', 
            message: `Starting uninstallation of ${appId}` 
        });

        try {
            await this._performUninstall(appId);
            EventBus.emit('package.uninstall.completed', { 
                severity: 'Info', 
                source: 'PackageService', 
                message: `Successfully uninstalled ${appId}`,
                data: { appId }
            });
        } catch (error) {
            EventBus.emit('package.uninstall.failed', { 
                severity: 'Error', 
                source: 'PackageService', 
                message: `Uninstallation failed: ${error.message}` 
            });
            throw error;
        }
    }

    async _performInstall(packageData, trustMetadata = null) {
        let pkg;
        try {
            pkg = JSON.parse(packageData);
        } catch (e) {
            throw new Error('PackageService: Invalid package format. Expected JSON.');
        }

        if (!pkg.manifest) {
            throw new Error('PackageService: Package is missing a valid manifest.');
        }

        const diagnostics = this.validator.validate(pkg.manifest);
        if (this.validator.hasErrors(diagnostics)) {
            const errors = diagnostics.filter(d => d.severity === 'error');
            throw new Error(`PackageService: Manifest validation failed with errors: ${errors.map(e => e.message).join(', ')}`);
        }

        // Log warnings
        const warnings = diagnostics.filter(d => d.severity === 'warning');
        if (warnings.length > 0) {
            console.warn(`PackageService: Manifest validation warnings for ${pkg.manifest.id || 'unknown'}:`, warnings);
        }

        const appId = pkg.manifest.id;
        const appDir = `${this.installRoot}/${appId}`;
        const securityService = this.serviceRegistry.get('SecurityService');
        const systemContext = securityService ? securityService.getSystemContext() : null;

        // Ensure root apps directory exists
        if (!await this.fileService.exists(this.installRoot, { context: systemContext })) {
            await this.fileService.createDirectory(this.installRoot, { context: systemContext });
        }

        // Create app directory
        if (!await this.fileService.exists(appDir, { context: systemContext })) {
            await this.fileService.createDirectory(appDir, { context: systemContext });
        }

        // Extract files
        if (pkg.files) {
            for (const [filename, content] of Object.entries(pkg.files)) {
                const filePath = `${appDir}/${filename}`;
                await this.fileService.writeFile(filePath, content, { context: systemContext });
            }
        }

        const manifest = { ...pkg.manifest };
        
        // Inject trust and path metadata into the install manifest
        manifest.install = manifest.install || {};
        if (trustMetadata) {
            manifest.install.trust = trustMetadata;
        }
        manifest.install.path = appDir;

        // Register with database
        const appDbService = this.serviceRegistry.get('ApplicationDatabaseService');
        if (appDbService) {
            await appDbService.registerApp(manifest);
        }
        
        return manifest;
    }

    async _performUninstall(appId) {
        const appDbService = this.serviceRegistry.get('ApplicationDatabaseService');
        if (!appDbService) throw new Error('PackageService: ApplicationDatabaseService not found.');
        
        const app = appDbService.getAppById(appId);
        if (!app) {
            throw new Error(`PackageService: App ${appId} is not installed.`);
        }

        // Prevent uninstallation of built-in system applications
        const trustService = this.serviceRegistry.get('TrustService');
        if (trustService) {
            const trustMeta = trustService.getTrustMetadata(appId);
            if (trustMeta && trustMeta.state === 'BUILT_IN') {
                throw new Error(`PackageService: Cannot uninstall built-in system application ${appId}.`);
            }
        }

        const appDir = `${this.installRoot}/${appId}`;
        const securityService = this.serviceRegistry.get('SecurityService');
        const systemContext = securityService ? securityService.getSystemContext() : null;
        
        // Remove files
        if (await this.fileService.exists(appDir, { context: systemContext })) {
            await this.fileService.delete(appDir, { recursive: true, context: systemContext });
        }

        // Unregister
        await appDbService.unregisterApp(appId);
    }
}
