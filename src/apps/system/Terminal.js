import { SYSTEM_INFO } from '../../system/SystemVersion.js';

/**
 * Terminal Application
 *
 * Responsibility:
 * Wraps xterm.js into a system window and hooks up the CommandService.
 *
 * Does NOT:
 * - Parse commands or execute command logic directly
 */
export default {
    run: async (registry, pid) => {
        const WindowService = registry.get('WindowService');
        const CommandService = registry.get('CommandService');
        const ProcessService = registry.get('ProcessService');

        if (!WindowService || !CommandService || !ProcessService) {
            console.error('[Terminal] Required services missing.');
            return;
        }

        const proc = ProcessService.getProcess(pid);
        const username = proc ? proc.ownerUsername : 'system';
        // Simplification for terminal: assume home directory is /users/[username]
        let cwd = username === 'system' ? '/' : `/users/${username}`;

        const win = WindowService.createWindow({
            title: 'Terminal',
            width: 600,
            height: 400,
            pid
        });

        win.contentElement.className = 'lde-content bg-base text-primary font-mono p-12 overflow-y-auto v-layout';

        const historyEl = document.createElement('div');
        historyEl.className = 'whitespace-pre-wrap flex-grow-1';

        const inputRow = document.createElement('div');
        inputRow.className = 'wrapper-horizontal-inline mt-4';

        const promptEl = document.createElement('div');
        promptEl.className = 'text-success mr-8';
        promptEl.textContent = `${username}@${SYSTEM_INFO.name.replace(' ', '').toLowerCase()}:${cwd}$`;

        const inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.className = 'flex-grow-1 bg-transparent text-primary border-none outline-none font-mono font-14';
        inputEl.autocomplete = 'off';
        inputEl.spellcheck = false;

        inputRow.appendChild(promptEl);
        inputRow.appendChild(inputEl);
        
        win.contentElement.appendChild(historyEl);
        win.contentElement.appendChild(inputRow);

        win.contentElement.onclick = () => inputEl.focus();
        setTimeout(() => inputEl.focus(), 100);

        inputEl.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const cmd = inputEl.value;
                if (!cmd.trim()) {
                    historyEl.innerHTML += `<div><span class="text-success">${username}@${SYSTEM_INFO.name.replace(' ', '').toLowerCase()}:${cwd}$</span> </div>`;
                    win.contentElement.scrollTop = win.contentElement.scrollHeight;
                    inputEl.value = '';
                    return;
                }

                if (cmd.trim() === 'clear') {
                    historyEl.innerHTML = '';
                    inputEl.value = '';
                    return;
                }

                // Print command
                historyEl.innerHTML += `<div><span class="text-success">${username}@${SYSTEM_INFO.name.replace(' ', '').toLowerCase()}:${cwd}$</span> ${cmd}</div>`;
                inputEl.value = '';
                
                // Keep input in view
                win.contentElement.scrollTop = win.contentElement.scrollHeight;

                // Execute
                const res = await CommandService.executeCommand(cmd, { cwd, termId: win.id });
                if (res.output) {
                    historyEl.innerHTML += `<div>${res.output}</div>`;
                }
                
                cwd = res.newCwd;
                promptEl.textContent = `${username}@${SYSTEM_INFO.name.replace(' ', '').toLowerCase()}:${cwd}$`;

                // Scroll to bottom
                win.contentElement.scrollTop = win.contentElement.scrollHeight;
            }
        });
    }
};
