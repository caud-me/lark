/**
 * PackageService
 *
 * Responsibility:
 * Public API for applications to trigger installs/uninstalls.
 * Delegates the actual workflow to PackageInstallOrchestrator.
 */
export class PackageService {
    constructor(packageInstallOrchestrator) {
        this.orchestrator = packageInstallOrchestrator;
    }

    /**
     * Installs a package from a given file path.
     * @param {string} packagePath 
     * @param {number|null} pid
     */
    async installPackage(packagePath, pid = null) {
        return this.orchestrator.installPackage(packagePath, pid);
    }

    /**
     * Uninstalls a package by ID.
     * @param {string} appId 
     * @param {number|null} pid
     */
    async uninstallPackage(appId, pid = null) {
        return this.orchestrator.uninstallPackage(appId, pid);
    }
}
