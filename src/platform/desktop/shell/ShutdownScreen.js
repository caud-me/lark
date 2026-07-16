/**
 * ShutdownScreen Presentation Component
 * 
 * Responsibility:
 * Renders the shutdown diagnostics in real-time, consuming logs
 * matching the shutdown namespace.
 * Fades to a pure black screen on completion and cleans up all DOM resources.
 */
export class ShutdownScreen {
    constructor() {
        this.container = null;
        this.consoleEl = null;
        this.styleEl = null;
        this.logService = null;
        this.onNewLog = this.handleNewLog.bind(this);
    }

    /**
     * Mounts the shutdown elements into the target shell.
     * @param {HTMLElement} container 
     * @param {ServiceRegistry} registry
     */
    mount(container, registry) {
        this.container = container;

        this.styleEl = document.createElement('style');
        this.styleEl.id = 'shutdown-screen-style';
        this.styleEl.textContent = `
            .shutdown-console {
                background: #000000;
                color: #ffffff;
                font-family: monospace;
                font-size: 14px;
                line-height: 1.4;
                padding: 20px;
                box-sizing: border-box;
                width: 100vw;
                height: 100vh;
                overflow-y: auto;
                overflow-x: hidden;
                white-space: pre-wrap;
                word-break: break-all;
                opacity: 1;
                transition: opacity 1s ease-in-out;
            }
            .shutdown-line {
                margin-bottom: 4px;
            }
        `;
        document.head.appendChild(this.styleEl);

        const consoleEl = document.createElement('div');
        consoleEl.className = 'shutdown-console';
        this.container.appendChild(consoleEl);
        this.consoleEl = consoleEl;

        // Fetch LogService and subscribe to live log events
        this.logService = registry.get('LogService');
        if (this.logService) {
            this.logService.subscribe(this.onNewLog);
        }
    }

    /**
     * Live log handler that filters for system halting logs.
     * @param {Object} l 
     */
    handleNewLog(l) {
        // Log ONLY system halting process events (e.g. shutdown. started/completed)
        if (l.event && l.event.startsWith('shutdown.')) {
            const lineText = `[${l.source}] ${l.message}`;
            this.appendLine(lineText);
        }
    }

    /**
     * Appends a diagnostics line to the terminal screen.
     * @param {string} text 
     */
    appendLine(text) {
        if (!this.consoleEl) return;
        const line = document.createElement('div');
        line.className = 'shutdown-line';
        line.textContent = text;
        this.consoleEl.appendChild(line);
        this.consoleEl.scrollTop = this.consoleEl.scrollHeight;
    }

    /**
     * Appends final halt line, then fades out and destroys DOM resources.
     */
    async complete() {
        if (this.logService) {
            this.logService.unsubscribe(this.onNewLog);
        }

        this.appendLine('[SYSTEM] Runtime halted.');
        
        // Add 0.5s delay before starting the fade-to-black transition
        await new Promise(resolve => setTimeout(resolve, 500));

        if (this.consoleEl) {
            this.consoleEl.style.opacity = '0';
            // Wait 1s for CSS fade-out opacity transition to finish
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.consoleEl.remove();
        }

        if (this.styleEl) {
            this.styleEl.remove();
        }

        // Clean up references
        this.container = null;
        this.consoleEl = null;
        this.styleEl = null;
        this.logService = null;
    }
}

export default ShutdownScreen;
