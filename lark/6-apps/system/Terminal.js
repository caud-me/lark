import { SYSTEM_INFO } from '../../3-system/SystemVersion.js';

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
    run: async (registry) => {
        const WindowService = registry.get('WindowService');
        const CommandService = registry.get('CommandService');

        if (!WindowService || !CommandService) {
            console.error('[Terminal] Required services missing.');
            return;
        }

        const SessionService = registry.get('SessionService');
        const currentSession = SessionService ? SessionService.getCurrentSession() : null;
        const username = currentSession ? currentSession.user.username : 'system';
        const sessionId = currentSession ? currentSession.id : null;
        // Simplification for terminal: assume home directory is /users/[username]
        let cwd = username === 'system' ? '/' : `/users/${username}`;

        const win = WindowService.createWindow({
            title: 'Terminal',
            width: 600,
            height: 400
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

        const appendHistoryLine = (promptUser, promptCwd, commandText) => {
            const lineContainer = document.createElement('div');
            
            const promptSpan = document.createElement('span');
            promptSpan.className = 'text-success';
            promptSpan.textContent = `${promptUser}@${SYSTEM_INFO.name.replace(' ', '').toLowerCase()}:${promptCwd}$`;
            
            lineContainer.appendChild(promptSpan);
            
            if (commandText) {
                const spaceText = document.createTextNode(' ');
                lineContainer.appendChild(spaceText);
                
                const commandSpan = document.createElement('span');
                commandSpan.textContent = commandText;
                lineContainer.appendChild(commandSpan);
            } else {
                const spaceText = document.createTextNode(' ');
                lineContainer.appendChild(spaceText);
            }
            
            historyEl.appendChild(lineContainer);
        };

        const appendOutputLine = (outputText) => {
            const lineContainer = document.createElement('div');
            lineContainer.textContent = outputText;
            historyEl.appendChild(lineContainer);
        };

        inputEl.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const cmd = inputEl.value;
                if (!cmd.trim()) {
                    appendHistoryLine(username, cwd, '');
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
                appendHistoryLine(username, cwd, cmd);
                inputEl.value = '';
                
                // Keep input in view
                win.contentElement.scrollTop = win.contentElement.scrollHeight;

                // Execute
                const res = await CommandService.executeCommand(cmd, { cwd, termId: win.id, sessionId });
                if (res.output) {
                    appendOutputLine(res.output);
                }
                
                cwd = res.newCwd;
                promptEl.textContent = `${username}@${SYSTEM_INFO.name.replace(' ', '').toLowerCase()}:${cwd}$`;

                // Scroll to bottom
                win.contentElement.scrollTop = win.contentElement.scrollHeight;
            }
        });

        // Helper to execute intent
        const executeIntent = async (intent) => {
            if (!intent) return;
            
            let cmd = null;
            if (intent.type === 'terminal.execute' && intent.payload && intent.payload.command) {
                cmd = intent.payload.command;
            } else if (intent.action === 'open-file' && intent.path) {
                cmd = `cat ${intent.path}`;
            }
            
            if (cmd) {
                appendHistoryLine(username, cwd, cmd);
                const res = await CommandService.executeCommand(cmd, { cwd, termId: win.id, sessionId });
                if (res.output) {
                    appendOutputLine(res.output);
                }
                cwd = res.newCwd || cwd;
                promptEl.textContent = `${username}@${SYSTEM_INFO.name.replace(' ', '').toLowerCase()}:${cwd}$`;
                win.contentElement.scrollTop = win.contentElement.scrollHeight;
            }
        };

        // Attach intent executor to window for runtime delivery
        win.handleIntent = executeIntent;

        // Execute launch intent if provided
        const launchContext = registry.getLaunchContext();
        if (launchContext && launchContext.intent) {
            await executeIntent(launchContext.intent);
        } else if (launchContext && launchContext.args && launchContext.args.length > 0) {
            // Legacy args fallback
            await executeIntent({ action: 'open-file', path: launchContext.args[0] });
        }
    },

    onIntent: async (registry, intent) => {
        const WindowService = registry.get('WindowService');
        if (!WindowService) return;
        
        const win = WindowService.getOwnWindows()[0];
        if (win && typeof win.handleIntent === 'function') {
            await win.handleIntent(intent);
        }
    }
};
