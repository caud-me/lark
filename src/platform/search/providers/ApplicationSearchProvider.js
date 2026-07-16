export class ApplicationSearchProvider {
    constructor(registry) {
        this.registry = registry;
        this.metadata = {
            id: 'applications',
            label: 'Applications',
            priority: 100, // High priority
            enabled: true
        };
    }

    async search(query, signal) {
        const appService = this.registry.get('ApplicationService');
        if (!appService) return [];

        const q = query.toLowerCase();
        const apps = appService.getInstalledApplications().filter(a => !a.hidden);
        
        const results = [];
        for (const app of apps) {
            if (signal && signal.aborted) break;

            let score = 0;
            const title = (app.title || app.name || '').toLowerCase();
            const desc = (app.description || '').toLowerCase();
            
            if (title === q) score = 100;
            else if (title.startsWith(q)) score = 80;
            else if (title.includes(q)) score = 60;
            else if (desc.includes(q)) score = 30;
            else if ((app.keywords || []).some(k => k.toLowerCase().includes(q))) score = 40;

            if (score > 0) {
                results.push({
                    id: app.id,
                    title: app.title || app.name,
                    subtitle: 'Application',
                    icon: app.icon || '📦',
                    score,
                    action: { appId: app.id }
                });
            }
        }
        return results;
    }

    activate(result) {
        const processService = this.registry.get('ProcessService');
        const sessionService = this.registry.get('SessionService');
        const session = sessionService ? sessionService.getCurrentSession() : null;

        if (processService && result.action && result.action.appId) {
            processService.startProcess(
                result.action.appId, 
                session ? { sessionId: session.id } : {}
            );
        }
    }
}
