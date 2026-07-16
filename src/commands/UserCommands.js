/**
 * UserCommands
 * 
 * Responsibility:
 * Provides user identity and session query commands (whoami, users, session).
 * 
 * Does NOT:
 * - Manage user state or sessions (uses UserService / SessionService)
 */
export function registerUserCommands(cmdService) {
    cmdService.registerCommand({
        name: 'whoami',
        description: 'Print current username',
        usage: 'whoami',
        handler: async (args, context) => {
            const session = cmdService.registry.get('SessionService').getCurrentSession();
            return session ? session.user.username : 'system';
        }
    });

    cmdService.registerCommand({
        name: 'users',
        description: 'List users',
        usage: 'users',
        handler: async (args, context) => {
            const users = cmdService.registry.get('UserService').getAllUsers();
            return users.map(u => u.username).join('\n');
        }
    });

    cmdService.registerCommand({
        name: 'session',
        description: 'Show session info',
        usage: 'session',
        handler: async (args, context) => {
            const session = cmdService.registry.get('SessionService').getCurrentSession();
            if (!session) return 'No active session.';
            return `Session ID: ${session.id}\nUser: ${session.user.username}\nStart Time: ${session.startTime}\nLocked: ${session.locked}`;
        }
    });
}
