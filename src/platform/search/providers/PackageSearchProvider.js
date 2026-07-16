export class PackageSearchProvider {
    constructor(serviceRegistry) {
        this.registry = serviceRegistry;
        this.metadata = {
            id: 'packages',
            label: 'Available Software',
            priority: 50,
            enabled: true
        };
    }

    async search(query, signal) {
        if (!query || query.length < 2) return [];

        const repoService = this.registry.get('RepositoryService');
        const appService = this.registry.get('ApplicationService');
        if (!repoService || !appService) return [];

        const availablePackages = repoService.searchPackages(query);
        const installedApps = appService.getInstalledApplications();
        const installedIds = new Set(installedApps.map(a => a.id));

        const results = [];
        for (const pkg of availablePackages) {
            if (signal && signal.aborted) break;

            // Only return if not already installed (ApplicationSearchProvider will find installed apps)
            if (!installedIds.has(pkg.id)) {
                results.push({
                    id: `pkg-${pkg.id}`,
                    title: pkg.title,
                    subtitle: `Available in ${pkg.repositoryId || 'Repository'} - v${pkg.version}`,
                    icon: '📦',
                    score: 0.8, // Slightly lower than installed apps
                    action: { packageId: pkg.id }
                });
            }
        }
        return results;
    }

    activate(result) {
        const processService = this.registry.get('ProcessService');
        if (processService) {
            // Launch Software Center when clicked
            processService.startProcess('sys.softwarecenter');
        }
    }
}
