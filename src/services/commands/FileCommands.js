/**
 * FileCommands
 * 
 * Responsibility:
 * Provides filesystem-related terminal commands (ls, cd, mkdir, etc.).
 * 
 * Does NOT:
 * - Implement filesystem logic (uses FileService)
 * - Manage command routing or parsing
 */
export function registerFileCommands(cmdService) {
    cmdService.registerCommand({
        name: 'ls',
        description: 'List directory contents',
        usage: 'ls [path]',
        handler: async (args, context) => {
            const fs = cmdService.registry.get('FileService');
            const target = cmdService.resolvePath(context.cwd, args[0] || '');
            if (!fs.exists(target)) {
                throw new Error(`cannot access '${args[0] || target}': No such file or directory`);
            }
            if (fs.getType(target) === 'file') {
                return args[0];
            }
            const items = fs.listDirectory(target);
            return items.map(i => i.type === 'directory' ? `${i.name}/` : i.name).join('  ');
        }
    });

    cmdService.registerCommand({
        name: 'cd',
        description: 'Change working directory',
        usage: 'cd [path]',
        handler: async (args, context) => {
            if (!args[0]) {
                context.newCwd = '/';
                return '';
            }
            const fs = cmdService.registry.get('FileService');
            const target = cmdService.resolvePath(context.cwd, args[0]);
            if (!fs.exists(target) || fs.getType(target) !== 'directory') {
                throw new Error(`${args[0]}: No such directory`);
            }
            context.newCwd = target;
            return '';
        }
    });

    cmdService.registerCommand({
        name: 'mkdir',
        description: 'Make directories',
        usage: 'mkdir <path>',
        handler: async (args, context) => {
            if (!args[0]) throw new Error('missing operand');
            const fs = cmdService.registry.get('FileService');
            fs.createDirectory(cmdService.resolvePath(context.cwd, args[0]));
            return '';
        }
    });

    cmdService.registerCommand({
        name: 'touch',
        description: 'Change file timestamps (or create empty file)',
        usage: 'touch <file>',
        handler: async (args, context) => {
            if (!args[0]) throw new Error('missing file operand');
            const fs = cmdService.registry.get('FileService');
            fs.writeFile(cmdService.resolvePath(context.cwd, args[0]), '');
            return '';
        }
    });

    cmdService.registerCommand({
        name: 'rm',
        description: 'Remove files or directories',
        usage: 'rm <path>',
        handler: async (args, context) => {
            if (!args[0]) throw new Error('missing operand');
            const fs = cmdService.registry.get('FileService');
            fs.delete(cmdService.resolvePath(context.cwd, args[0]));
            return '';
        }
    });
}
