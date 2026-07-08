/**
 * EventViewer Application
 *
 * Responsibility:
 * Provides a graphical interface for viewing system logs.
 *
 * Does NOT:
 * - Collect logs or manage log persistence
 */

export default {
    run: async (registry, pid) => {
        console.log('[WindowTest] Starting Window Test App...');

        const WindowService = registry.get('WindowService');
        const ProcessService = registry.get('ProcessService');
        const IPCService = registry.get('IPCService');

        if (!WindowService || !ProcessService || !IPCService) {
            console.error('[WindowTest] Failed to retrieve required services.');
            return;
        }

        const onIpcMessage = (payload) => {
            const out = document.getElementById(`test-output-${win.id}`);
            if(out) out.innerText = `Received IPC: ${payload.message} (from PID ${payload.sourcePid})`;
        };

        // Request a window from the OS
        const win = WindowService.createWindow({
            title: 'Window Test ' + pid,
            width: 300,
            height: 200,
            pid,
            onClose: () => {
                IPCService.unsubscribe(pid, 'test', onIpcMessage);
            }
        });

        // App owns the content inside the window
        win.contentElement.innerHTML = `
            <div class="lde-centered-layout h-full text-center">
                <h3>Window System Foundation</h3>
                <p>This is a test application validating Phase 3.</p>
                <p>Window ID: ${win.id}</p>
                <button id="test-btn-${win.id}" class="lde-btn lde-btn-primary">Click Me!</button>
                <p id="test-output-${win.id}" class="mt-4"></p>
            </div>
        `;

        // Add interactibility to prove DOM events work inside the content container
        const btn = win.contentElement.querySelector(`#test-btn-${win.id}`);
        const out = win.contentElement.querySelector(`#test-output-${win.id}`);
        btn.onclick = () => {
            out.innerText = `Clicked at ${new Date().toLocaleTimeString()}`;
        };

        IPCService.subscribe(pid, 'test', onIpcMessage);

        console.log(`[WindowTest] Running successfully with PID ${pid}`);
    }
};
