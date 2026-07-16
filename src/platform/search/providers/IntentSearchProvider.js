export class IntentSearchProvider {
    constructor(registry) {
        this.registry = registry;
        this.metadata = {
            id: 'intents',
            label: 'Quick Actions',
            priority: 90, // Slightly below applications
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

            const intents = app.searchableIntents || [];
            
            for (const intentInfo of intents) {
                let score = 0;
                const title = (intentInfo.title || '').toLowerCase();
                
                if (title === q) score = 100;
                else if (title.startsWith(q)) score = 80;
                else if (title.includes(q)) score = 60;
                else if ((intentInfo.keywords || []).some(k => k.toLowerCase().includes(q))) score = 50;

                if (score > 0) {
                    results.push({
                        id: `intent-${app.id}-${intentInfo.title.replace(/\s+/g, '-').toLowerCase()}`,
                        title: intentInfo.title,
                        subtitle: `${app.title || app.name} Quick Action`,
                        icon: intentInfo.icon || app.icon || '⚡',
                        score,
                        action: { appId: app.id, intent: intentInfo.intent }
                    });
                }
            }
        }
        
        return results;
    }

    activate(result) {
        const intentService = this.registry.get('ApplicationIntentService');
        if (intentService && result.action && result.action.appId && result.action.intent) {
            intentService.launchWithIntent(result.action.appId, result.action.intent).catch(e => {
                console.error('[IntentSearchProvider] Failed to dispatch intent:', e);
            });
        }
    }
}
