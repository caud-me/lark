import { EventBus } from '../kernel/SystemEventBus.js';

import { registerHelpCommands } from './commands/HelpCommands.js';
import { registerFileCommands } from './commands/FileCommands.js';
import { registerProcessCommands } from './commands/ProcessCommands.js';
import { registerPowerCommands } from './commands/PowerCommands.js';
import { registerUserCommands } from './commands/UserCommands.js';
import { registerDiskCommands } from './commands/DiskCommands.js';
import { registerIPCCommands } from './commands/IPCCommands.js';
import { registerNotificationCommands } from './commands/NotificationCommands.js';
import { registerSystemCommands } from './commands/SystemCommands.js';

/**
 * CommandService
 * 
 * Responsibility:
 * Exposes a public API for command parsing, routing, and path resolution.
 * Orchestrates the registration of domain-specific commands.
 * 
 * Does NOT:
 * - Implement command business logic (handled by domain command modules)
 * - Directly mutate OS state without going through other Services
 */
export class CommandService {
    constructor(registry) {
        this.registry = registry;
        this.commands = new Map();
        this._registerCommands();
    }

    _registerCommands() {
        registerHelpCommands(this);
        registerFileCommands(this);
        registerProcessCommands(this);
        registerPowerCommands(this);
        registerUserCommands(this);
        registerDiskCommands(this);
        registerIPCCommands(this);
        registerNotificationCommands(this);
        registerSystemCommands(this);
    }

    registerCommand(cmdDef) {
        this.commands.set(cmdDef.name, cmdDef);
    }

    resolvePath(cwd, p) {
        if (!p) return cwd;
        const parts = (p.startsWith('/') ? p : `${cwd}/${p}`).split('/');
        const stack = [];
        for (const part of parts) {
            if (!part || part === '.') continue;
            if (part === '..') stack.pop();
            else stack.push(part);
        }
        let finalPath = '/' + stack.join('/');
        return finalPath.replace(/\/\/+/g, '/');
    }

    /**
     * Executes a command string.
     * @param {string} commandStr 
     * @param {Object} context { cwd, termId }
     * @returns {Promise<Object>} { output, newCwd }
     */
    async executeCommand(commandStr, context) {
        const args = commandStr.trim().split(/\s+/).filter(Boolean);
        if (args.length === 0) return { output: '', newCwd: context.cwd };

        const cmdName = args.shift();
        const cmd = this.commands.get(cmdName);

        const execContext = { ...context, newCwd: context.cwd };
        let output = '';
        let status = 'SUCCESS';

        if (!cmd) {
            output = `Command not found: ${cmdName}`;
            status = 'ERROR';
        } else {
            try {
                output = await cmd.handler(args, execContext);
            } catch (e) {
                output = `${cmdName}: ${e.message}`;
                status = 'ERROR';
            }
        }

        EventBus.emit('command.executed', {
            severity: status === 'SUCCESS' ? 'Info' : 'Warning',
            source: 'CommandService',
            message: `Executed: ${commandStr}`,
            data: {
                command: cmdName,
                cwd: context.cwd,
                timestamp: new Date().toISOString(),
                status
            }
        });

        return { output, newCwd: execContext.newCwd };
    }
}
