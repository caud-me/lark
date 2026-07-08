/**
 * NotificationCommands
 * 
 * Responsibility:
 * Provides terminal commands for triggering notifications.
 * 
 * Does NOT:
 * - Handle UI rendering of notifications
 */
export function registerNotificationCommands(cmdService) {
    cmdService.registerCommand({
        name: 'notify',
        description: 'Trigger a notification',
        usage: 'notify [info|warning|error] "message"',
        handler: async (args, context) => {
            if (args.length === 0) throw new Error('missing message');
            const ns = cmdService.registry.get('NotificationService');
            let type = 'info';
            let msg = '';
            
            if (['info', 'warning', 'error'].includes(args[0])) {
                type = args[0];
                msg = args.slice(1).join(' ').replace(/^"|"$/g, '');
            } else {
                msg = args.join(' ').replace(/^"|"$/g, '');
            }
            
            ns.notify('Terminal', msg, type);
            return 'Notification sent.';
        }
    });
}
