/**
 * ProcessCommands
 * 
 * Responsibility:
 * Provides process and app-related terminal commands (ps, apps, kill, open).
 * 
 * Does NOT:
 * - Implement process lifecycle (uses ProcessService)
 * - Implement application registration (uses AppService)
 */
export function registerProcessCommands(cmdService) {
    cmdService.registerCommand({
        name: 'apps',
        description: 'List installed applications',
        usage: 'apps',
        handler: async (args, context) => {
            const appService = cmdService.registry.get('AppService');
            const apps = appService.getApps();
            let out = `APP ID               NAME                 STATUS\n`;
            out += apps.map(a => `${a.id.padEnd(20)} ${a.name.padEnd(20)} ${a.hidden ? 'Hidden' : 'Visible'}`).join('\n');
            return out;
        }
    });

    cmdService.registerCommand({
        name: 'ps',
        description: 'List running processes',
        usage: 'ps',
        handler: async (args, context) => {
            const ps = cmdService.registry.get('ProcessService');
            const procs = ps.getProcesses();
            let out = `PID   APP ID               NAME                 STATE       WINS\n`;
            out += procs.map(p => `${String(p.pid).padEnd(5)} ${p.appId.padEnd(20)} ${p.name.padEnd(20)} ${p.state.padEnd(11)} ${p.windowCount}`).join('\n');
            return out;
        }
    });

    cmdService.registerCommand({
        name: 'kill',
        description: 'Kill a process by PID',
        usage: 'kill <pid>',
        handler: async (args, context) => {
            if (!args[0]) throw new Error('missing pid');
            const ps = cmdService.registry.get('ProcessService');
            ps.terminateProcess(parseInt(args[0], 10));
            return `Process ${args[0]} terminated.`;
        }
    });

    cmdService.registerCommand({
        name: 'open',
        description: 'Open an application',
        usage: 'open <appId>',
        handler: async (args, context) => {
            if (!args[0]) throw new Error('missing appId');
            const ps = cmdService.registry.get('ProcessService');
            const pid = await ps.startProcess(args[0]);
            if (pid) return `Launched ${args[0]} with PID ${pid}.`;
            return `Failed to launch ${args[0]}`;
        }
    });
}
