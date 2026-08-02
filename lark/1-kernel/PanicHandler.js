import { EventBus } from './SystemEventBus.js';
import { ServiceRegistry } from './ServiceRegistry.js';
import { SYSTEM_INFO } from '../3-system/SystemVersion.js';

/**
 * PanicHandler
 * 
 * Layer: 1-kernel
 * Responsibility:
 * Dedicated renderer for Kernel Panic screen. Formats error stack, syslog events,
 * and structured panic metadata headers.
 * 
 * Does NOT:
 * - Mutate OS runtime state
 */
export class PanicHandler {
    static render(error) {
        console.error('[Kernel Panic] Fatal OS Error:', error);
        EventBus.emit('kernel:panic', { severity: 'Error', source: 'Kernel', message: `KERNEL PANIC: ${error.stack || error}` });

        let eventData = [];
        try {
            if (ServiceRegistry.has('LogService')) {
                const syslogService = ServiceRegistry.get('LogService');
                if (syslogService) {
                    const logs = syslogService.getLogs();
                    eventData = logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.severity} [${l.source}]: ${l.message}`);
                }
            }
        } catch (e) {
            console.error('[PanicHandler] LogService snapshot unavailable during panic:', e.message);
        }

        const errorStack = (error.stack || error.toString()).split('\n');
        const panicPayload = error && error.panicPayload ? error.panicPayload : {
            stopCode: 'LARK_KERNEL_BOOT_FAILURE',
            component: 'Kernel Bootstrap',
            device: 'N/A',
            recovery: 'Recovery Environment Available',
            timestamp: Date.now()
        };

        const panicLines = [
            `================================================================================`,
            `  KERNEL PANIC`,
            `================================================================================`,
            `STOP CODE:  ${panicPayload.stopCode}`,
            `COMPONENT:  ${panicPayload.component}`,
            `DEVICE:     ${panicPayload.device}`,
            `RECOVERY:   ${panicPayload.recovery}`,
            `TIMESTAMP:  ${new Date(panicPayload.timestamp).toISOString()}`,
            `================================================================================`,
            ``,
            `CR0: 0x0000000080010033, CR2: 0x00000000ff5ea1fd, CR3: 0x000000000c4e9000`,
            `Fault CR2: 0x00000000ff5ea1fd, Error code: 0x0000000000000000, Fault CPU: 0x0, PL: 0, VF: 5`,
            ``,
            `Panicked task 0xffffff9d921cb290: 20 threads: pid 0:`,
            `Backtrace (CPU 0), panicked thread: 0xffffff98c54000c0, Frame : Return Address`,
            ...errorStack,
            ``,
            `Process name corresponding to current thread (0xffffff98c54000c8): Unknown`,
            `Boot args: -v debug=0x100 keepsyms=1 -lgfxblt -wegnoegpu -vi2c-force-polling`,
            ``,
            ``,
            `Kernel version:`,
            `LDE Kernel Version ${SYSTEM_INFO.version} (${SYSTEM_INFO.codename}): ${new Date().toUTCString()}; root:xnu-12377.41.6-2/RELEASE_X86_64`,
            `Kernel UUID: 375EF211-CCBA-3A63-9670-924A3BF74221`,
            `roots installed: 0`,
            `KernelCache slide: 0x0000000006a00000`,
            `KernelCache base:  0xffffff8006c00000`,
            `System shutdown begun: NO`,
            `Panic diags file unavailable, panic occurred prior to initialization`,
            `Hibernation exit count: 0`,
            ``,
            `System uptime in nanoseconds: ${Math.floor(performance.now() * 1000000)}`,
            `Last Sleep:           absolute           base_tsc          base_nano`,
            `  Uptime  : 0x0000000030c203b1`,
            `  Sleep   : 0x0000000000000000 0x0000000000000000 0x0000000000000000`,
            `  Wake    : 0x0000000000000000 0x00000018f4bfdd9a 0x0000000000000000`,
            ``,
            `Event Viewer Logs (LDE Syslog):`,
            ...eventData,
            ``,
            `** In Memory Panic Stackshot Succeeded ** Bytes Traced 4380 (Uncompressed 9360) **`,
            ``,
            `Please go to https://panic.lde27.com to report this panic`
        ];

        document.body.innerHTML = `
            <div id="panic-screen" style="background-color: #000; color: #fff; height: 100dvh; width: 100dvw; font-family: monospace; font-size: 14px; font-weight: bold; position: absolute; top: 0; left: 0; z-index: 999999; overflow-y: auto; overflow-x: hidden; padding: 20px; box-sizing: border-box; line-height: 0.9; white-space: pre-wrap; word-break: break-all;">
            </div>
        `;

        const container = document.getElementById('panic-screen');
        let currentLine = 0;

        const interval = setInterval(() => {
            if (currentLine >= panicLines.length) {
                clearInterval(interval);
                return;
            }

            const line = document.createElement('div');
            line.textContent = panicLines[currentLine];
            if (panicLines[currentLine] === '') {
                line.style.minHeight = '1em';
            }
            container.appendChild(line);

            container.scrollTop = container.scrollHeight;
            currentLine++;
        }, 15);
    }
}
