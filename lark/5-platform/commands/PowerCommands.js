/**
 * PowerCommands
 * 
 * Responsibility:
 * Provides power and session control commands (shutdown, reboot, lock, logout).
 * 
 * Does NOT:
 * - Implement power actions (uses PowerService)
 */
export function registerPowerCommands(cmdService) {
    cmdService.registerCommand({
        name: 'shutdown',
        description: 'Halt the system',
        usage: 'shutdown',
        handler: async (args, context) => {
            cmdService.registry.get('PowerService').shutdown();
            return 'Shutting down...';
        }
    });

    cmdService.registerCommand({
        name: 'reboot',
        description: 'Reboot the system',
        usage: 'reboot',
        handler: async (args, context) => {
            cmdService.registry.get('PowerService').reboot();
            return 'Rebooting...';
        }
    });

/*
    cmdService.registerCommand({
        name: 'lock',
        description: 'Lock the session',
        usage: 'lock',
        handler: async (args, context) => {
            cmdService.registry.get('PowerService').lock();
            return 'Session locked.';
        }
    });
*/

    cmdService.registerCommand({
        name: 'logout',
        description: 'Logout current user',
        usage: 'logout',
        handler: async (args, context) => {
            cmdService.registry.get('PowerService').logout();
            return 'Logging out...';
        }
    });
}
