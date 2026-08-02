/**
 * IPCCommands
 * 
 * Responsibility:
 * Provides terminal commands for inter-process communication (ipc).
 * 
 * Does NOT:
 * - Implement IPC routing or delivery (uses IPCService)
 */
export function registerIPCCommands(cmdService) {
    cmdService.registerCommand({
        name: 'ipc',
        description: 'Interact with IPC Manager',
        usage: 'ipc send <target> <message> | ipc broadcast <channel> <message>',
        handler: async (args, context) => {
            if (args.length < 3) throw new Error('missing arguments');
            const action = args[0];
            const ipc = cmdService.registry.get('IPCService');
            const ps = cmdService.registry.get('ProcessService');
            
            // Try to resolve the current terminal's PID
            let sourcePid = 0;
            if (context.termId) {
                const procs = ps.getProcesses();
                for (const p of procs) {
                    if (p.appId === 'sys.terminal') {
                        const winService = cmdService.registry.get('WindowService');
                        const winState = winService.windowManager.windows.get(context.termId);
                        if (winState && winState.pid === p.pid) sourcePid = p.pid;
                    }
                }
            }
            
            if (action === 'send') {
                const target = args[1];
                const msg = args.slice(2).join(' ');
                const sent = ipc.send(sourcePid, target, msg);
                return sent ? `Message delivered to ${target}.` : `Failed to deliver to ${target}.`;
            } else if (action === 'broadcast') {
                const channel = args[1];
                const msg = args.slice(2).join(' ');
                const count = ipc.broadcast(sourcePid, channel, msg);
                return `Broadcast sent to ${count} subscribers on channel '${channel}'.`;
            } else {
                throw new Error('invalid action. Use send or broadcast.');
            }
        }
    });
}
