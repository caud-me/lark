/**
 * SystemCommands
 * 
 * Responsibility:
 * Provides general system diagnostics, settings, and logs (logs, settings, about, ldefetch).
 * 
 * Does NOT:
 * - Direct OS state changes
 */
import { EventBus } from '../../kernel/SystemEventBus.js';
import { SYSTEM_INFO } from '../../system/SystemVersion.js';

export function registerSystemCommands(cmdService) {
    cmdService.registerCommand({
        name: 'logs',
        description: 'View system logs',
        usage: 'logs [count]',
        handler: async (args, context) => {
            const sysLog = cmdService.registry.get('LogService'); // Note: Will be renamed to LogService soon
            if (!sysLog) return 'Log service unavailable.';
            const count = args[0] ? parseInt(args[0], 10) : 10;
            const logs = sysLog.getLogs().slice(-count);
            return logs.map(l => `[${l.severity}] ${l.source}: ${l.message}`).join('\n');
        }
    });

    cmdService.registerCommand({
        name: 'settings',
        description: 'List system settings',
        usage: 'settings',
        handler: async (args, context) => {
            const sets = cmdService.registry.get('SettingsService');
            const all = sets.getAllSettings();
            return Object.entries(all).map(([k, v]) => `${k} = ${v}`).join('\n');
        }
    });

    cmdService.registerCommand({
        name: 'about',
        description: 'Show OS information',
        usage: 'about',
        handler: async (args, context) => {
            return `${SYSTEM_INFO.name}\nVersion: ${SYSTEM_INFO.version}\nCodename: ${SYSTEM_INFO.codename}\nArchitecture: ${SYSTEM_INFO.architecture}`;
        }
    });

    cmdService.registerCommand({
        name: 'ldefetch',
        description: 'Show system information (neofetch style)',
        usage: 'ldefetch',
        handler: async (args, context) => {
            const session = cmdService.registry.get('SessionService').getCurrentSession();
            const user = session ? session.user.username : 'system';
            
            let uptimeStr = 'Unknown';
            if (session) {
                const diff = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
                const mins = Math.floor(diff / 60);
                const secs = diff % 60;
                uptimeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
            }

            const appsCount = cmdService.registry.get('AppService').getApps().length;
            
            const fs = cmdService.registry.get('FileService');
            const usage = fs.getUsage();
            const cap = fs.getCapacity();
            const diskStr = `${(usage/1024).toFixed(2)} KB / ${(cap/1024).toFixed(2)} KB`;

            const resStr = `${window.innerWidth}x${window.innerHeight}`;

            const ascii = [
                "                                         @@@@@@@@@@@@@@@@@@@                                        ",
                "                                    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@                                   ",
                "                                 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                                ",
                "                               @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                             ",
                "                            @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                           ",
                "                           @@@@@@@@@@@@@@@@@@@@@@@@              @@@@@@@@@@                @@@@@    ",
                "                         @@@@@@@@@@@@@@@@@@@@@                        @@@@@@                 @@@@@  ",
                "                        @@@@@@@@@@@@@@@@@@@                             @@@@@@                @@@@@ ",
                "                       @@@@@@@@@@@@@@@@@@                                  @@@@               @@@@@@",
                "                      @@@@@@@@@@@@@@@@@                                      @@@              @@@@@@",
                "                     @@@@@@@@@@@@@@@@                                         @@@            @@@@@@@",
                "                    @@@@@@@@@@@@@@@@                                           @@          @@@@@@@@@",
                "                    @@@@@@@@@@@@@@@                                                       @@@@@@@@@ ",
                "                   @@@@@@@@@@@@@@@                                                      @@@@@@@@@@  ",
                "                   @@@@@@@@@@@@@@                                                    @@@@@@@@@@@@   ",
                "                   @@@@@@@@@@@@@@                                                  @@@@@@@@@@@@     ",
                "                   @@@@@@@@@@@@@@                                               @@@@@@@@@@@@@       ",
                "                   @@@@@@@@@@@@@                                             @@@@@@@@@@@@@@         ",
                "                   @@@@@@@@@@@@@                                          @@@@@@@@@@@@@@@           ",
                "                   @@@@@@@@@@@@@@                                     @@@@@@@@@@@@@@@@              ",
                "  @@               @@@@@@@@@@@@@@                                 @@@@@@@@@@@@@@@@@@                ",
                " @@@                @@@@@@@@@@@@@                            @@@@@@@@@@@@@@@@@@@@                   ",
                "@@@@                @@@@@@@@@@@@@@                       @@@@@@@@@@@@@@@@@@@@                       ",
                "@@@@@                                              @@@@@@@@@@@@@@@@@@@@@@                           ",
                "@@@@@@@                                    @@@@@@@@@@@@@@@@@@@@@@@@@@                               ",
                "@@@@@@@@@@@@                      @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                                   ",
                " @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                                        ",
                "  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                                              ",
                "    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                                                    ",
                "         @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                                                       ",
                "                              @@@@@@@@@@@@@@@@@@                   @@                               ",
                "                                 @@@@@@@@@@@@@@@@@@@@@    @@@@@@@@@@@                               ",
                "                                    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                                  ",
                "                                         @@@@@@@@@@@@@@@@@@@@                                       "
            ];

            const info = [
                `${user}@${SYSTEM_INFO.name.replace(' ', '').toLowerCase()}`,
                `${'-'.repeat(user.length + 7)}`,
                `OS: ${SYSTEM_INFO.name}`,
                `Kernel: Browser Native`,
                `Uptime: ${uptimeStr}`,
                `Packages: ${appsCount}`,
                `Shell: LDE Shell`,
                `Resolution: ${resStr}`,
                `Disk: ${diskStr}`
            ];

            const linesCount = Math.max(ascii.length, info.length);
            let out = '';
            
            const startInfoIdx = Math.floor((ascii.length - info.length) / 2);
            
            for (let i = 0; i < linesCount; i++) {
                const left = ascii[i] || " ".repeat(100);
                let right = "";
                if (i >= startInfoIdx && i < startInfoIdx + info.length) {
                    right = info[i - startInfoIdx];
                }
                out += left + "   " + right + "\n";
            }

            return out.replace(/\n$/, '');
        }
    });
}
