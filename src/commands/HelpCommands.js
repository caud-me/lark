/**
 * HelpCommands
 * 
 * Responsibility:
 * Provides terminal help and informational commands (help, clear).
 * 
 * Does NOT:
 * - Implement command execution logic
 */
export function registerHelpCommands(cmdService) {
    cmdService.registerCommand({
        name: 'help',
        description: 'Show available commands',
        usage: 'help [command]',
        handler: async (args, context) => {
            if (args[0]) {
                const cmd = cmdService.commands.get(args[0]);
                if (cmd) {
                    return `${cmd.name} - ${cmd.description}\nUsage: ${cmd.usage}`;
                }
                return `Command not found: ${args[0]}`;
            }
            let output = 'Available commands:\n';
            const cmds = Array.from(cmdService.commands.values()).sort((a, b) => a.name.localeCompare(b.name));
            for (const cmd of cmds) {
                output += `${cmd.name.padEnd(14)} - ${cmd.description}\n`;
            }
            return output.trim();
        }
    });

    cmdService.registerCommand({
        name: 'clear',
        description: 'Clear the terminal screen',
        usage: 'clear',
        handler: async () => {
            // The Terminal UI intercepts 'clear', this just serves as documentation for 'help'
            return '';
        }
    });
}
