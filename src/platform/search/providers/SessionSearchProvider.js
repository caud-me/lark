export class SessionSearchProvider {
    constructor(registry) {
        this.registry = registry;
        this.metadata = {
            id: 'session',
            label: 'Recent Applications',
            priority: 90,
            enabled: true
        };
    }

    async search(query, signal) {
        // If there is a query, we skip recent apps (since the Application provider handles searching)
        if (query && query.trim() !== '') return [];

        const sessionService = this.registry.get('SessionService');
        const appService = this.registry.get('ApplicationService');
        if (!sessionService || !appService) return [];

        const session = sessionService.getCurrentSession();
        if (!session || !session.recentlyLaunchedApps) return [];

        const results = [];
        let score = 90;
        for (const appId of session.recentlyLaunchedApps) {
            if (signal && signal.aborted) break;

            const app = appService.getApplication(appId);
            if (app && !app.hidden) {
                results.push({
                    id: `recent-${app.id}`,
                    title: app.title || app.name,
                    subtitle: 'Recently used',
                    icon: app.icon || '📦',
                    score: score--,
                    action: { appId: app.id }
                });
            }
        }
        return results;
    }

    activate(result) {
        const processService = this.registry.get('ProcessService');
        if (processService && result.action && result.action.appId) {
            processService.startProcess(result.action.appId);
        }
    }
}
