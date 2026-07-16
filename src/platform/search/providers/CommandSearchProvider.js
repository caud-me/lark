export class CommandSearchProvider {
    constructor(registry) {
        this.registry = registry;
        this.metadata = {
            id: 'commands',
            label: 'Commands',
            priority: 50,
            enabled: true
        };
    }

    async search(query, signal) {
        const commandService = this.registry.get('CommandService');
        if (!commandService) return [];

        const q = query.toLowerCase();
        const registryMap = commandService.commands; // Get the map of registered commands
        
        const results = [];
        for (const [cmdName, cmdDef] of registryMap.entries()) {
            if (signal && signal.aborted) break;

            let score = 0;
            const title = cmdName.toLowerCase();
            const desc = (cmdDef.description || '').toLowerCase();
            
            if (title === q) score = 90;
            else if (title.startsWith(q)) score = 70;
            else if (title.includes(q)) score = 50;
            else if (desc.includes(q)) score = 20;

            if (score > 0) {
                results.push({
                    id: `cmd-${cmdName}`,
                    title: cmdName,
                    subtitle: cmdDef.description || 'System Command',
                    icon: '⚡',
                    score,
                    action: { command: cmdName }
                });
            }
        }
        return results;
    }

    activate(result) {
        const commandService = this.registry.get('CommandService');
        const processService = this.registry.get('ProcessService');
        if (commandService && processService && result.action && result.action.command) {
            const intentService = this.registry.get('ApplicationIntentService');
            if (intentService) {
                intentService.launchWithIntent('sys.terminal', { 
                    type: 'terminal.execute', 
                    payload: { command: result.action.command } 
                });
            }
        }
    }
}
