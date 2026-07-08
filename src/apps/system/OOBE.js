import { SYSTEM_INFO } from '../../system/SystemVersion.js';

/**
 * OOBE (Out of Box Experience) Application
 *
 * Responsibility:
 * Guides the user through initial system setup.
 *
 * Does NOT:
 * - Run on subsequent boots
 */
export default {
    run: async (registry, pid) => {
        return new Promise(async (resolve) => {
            const WindowService = registry.get('WindowService');
            const ProcessService = registry.get('ProcessService');
            const FileService = registry.get('FileService');
            const UserService = registry.get('UserService');
            const DialogService = registry.get('DialogService');

            const win = WindowService.createWindow({ 
                title: `${SYSTEM_INFO.name} Setup`, 
                width: 600, 
                height: 450,
                pid,
                closable: false,
                resizable: false
            });

            win.contentElement.className = 'lde-app-container';
            win.contentElement.style.display = 'flex';
            win.contentElement.style.flexDirection = 'row';
            win.contentElement.style.backgroundColor = 'var(--lde-bg-base)';

            let currentStep = 0;
            const steps = [
                { id: 'welcome', label: 'Welcome' },
                { id: 'account', label: 'User Account' },
                { id: 'personalize', label: 'Personalization' },
                { id: 'summary', label: 'Summary' },
                { id: 'finish', label: 'Finish' }
            ];

            const renderWizard = () => {
                const sidebar = `
                    <div style="width: 200px; background: var(--lde-bg-surface-elevated); border-right: 1px solid var(--lde-border); padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                        <div style="font-size: 2rem; margin-bottom: 24px;">🌌</div>
                        ${steps.map((s, i) => `
                            <div style="color: ${i === currentStep ? 'var(--lde-text-primary)' : 'var(--lde-text-tertiary)'}; font-weight: ${i === currentStep ? '600' : '400'};">
                                ${i + 1}. ${s.label}
                            </div>
                        `).join('')}
                    </div>
                `;

                let content = '';
                if (currentStep === 0) { // Welcome
                    content = `
                        <h2>Welcome to ${SYSTEM_INFO.name}</h2>
                        <p class="text-secondary mt-12 mb-24">Version ${SYSTEM_INFO.version} (Codename: ${SYSTEM_INFO.codename})</p>
                        <p>This wizard will guide you through setting up your new Lark Desktop Environment.</p>
                        <div style="flex-grow:1;"></div>
                        <div style="display:flex; justify-content:flex-end;">
                            <button id="oobe-next" class="lde-btn lde-btn-primary">Next</button>
                        </div>
                    `;
                } else if (currentStep === 1) { // User Account
                    content = `
                        <h2>Create your account</h2>
                        <p class="text-secondary mt-12 mb-24">Who is going to use this computer?</p>
                        <input type="text" id="oobe-username" class="lde-input w-full" placeholder="Username" style="max-width:300px;"/>
                        <div style="flex-grow:1;"></div>
                        <div style="display:flex; justify-content:space-between;">
                            <button id="oobe-back" class="lde-btn">Back</button>
                            <button id="oobe-next" class="lde-btn lde-btn-primary">Next</button>
                        </div>
                    `;
                } else if (currentStep === 2) { // Personalization
                    content = `
                        <h2>Personalization</h2>
                        <p class="text-secondary mt-12 mb-24">Choose how your system looks.</p>
                        <div class="p-16 border rounded bg-surface-elevated mb-12">
                            <label class="wrapper-horizontal-inline" style="gap:12px;">
                                <input type="radio" name="theme" checked> Dark Mode (Recommended)
                            </label>
                        </div>
                        <p class="text-secondary font-13">More themes will be available in Series 2.</p>
                        <div style="flex-grow:1;"></div>
                        <div style="display:flex; justify-content:space-between;">
                            <button id="oobe-back" class="lde-btn">Back</button>
                            <button id="oobe-next" class="lde-btn lde-btn-primary">Next</button>
                        </div>
                    `;
                } else if (currentStep === 3) { // Summary
                    content = `
                        <h2>Summary</h2>
                        <p class="text-secondary mt-12 mb-24">Review your settings before finishing.</p>
                        <ul style="list-style: none; padding: 0; line-height: 2;">
                            <li><strong>OS:</strong> ${SYSTEM_INFO.name} ${SYSTEM_INFO.version}</li>
                            <li><strong>Codename:</strong> ${SYSTEM_INFO.codename}</li>
                            <li><strong>Account:</strong> Local User</li>
                            <li><strong>Theme:</strong> Dark Mode</li>
                        </ul>
                        <div style="flex-grow:1;"></div>
                        <div style="display:flex; justify-content:space-between;">
                            <button id="oobe-back" class="lde-btn">Back</button>
                            <button id="oobe-next" class="lde-btn lde-btn-primary">Next</button>
                        </div>
                    `;
                } else if (currentStep === 4) { // Finish
                    content = `
                        <h2>All done!</h2>
                        <p class="text-secondary mt-12 mb-24">Setting up system files and directories...</p>
                        <div id="oobe-log" class="font-mono font-13 p-12 bg-surface-elevated rounded border text-secondary" style="height: 150px; overflow-y:auto; white-space: pre-wrap;"></div>
                    `;
                }

                win.contentElement.innerHTML = `
                <div style="display: flex; flex-direction: row; height: 100%; width: 100%;">
                    ${sidebar}
                    <div style="flex: 1; padding: 32px; display: flex; flex-direction: column; overflow-y: auto;">
                        ${content}
                    </div>
                </div>
                `;

                // Bindings
                const nextBtn = win.contentElement.querySelector('#oobe-next');
                const backBtn = win.contentElement.querySelector('#oobe-back');
                
                if (backBtn) {
                    backBtn.onclick = () => {
                        currentStep--;
                        renderWizard();
                    };
                }

                if (nextBtn) {
                    nextBtn.onclick = async () => {
                        if (currentStep === 1) {
                            const input = win.contentElement.querySelector('#oobe-username');
                            const val = input.value.trim();
                            if (!val) {
                                await DialogService.alert('Please enter a username', 'Setup Error');
                                return;
                            }
                            // Store temporarily, create at the end
                            win.dataset = win.dataset || {};
                            win.dataset.setupUser = val;
                        }
                        currentStep++;
                        renderWizard();
                        
                        if (currentStep === 4) {
                            runInstall();
                        }
                    };
                }
            };

            const runInstall = async () => {
                const logEl = win.contentElement.querySelector('#oobe-log');
                const log = (msg) => {
                    logEl.innerText += `> ${msg}\n`;
                    logEl.scrollTop = logEl.scrollHeight;
                };

                log('Initializing Lark File System (LRFS)...');
                await new Promise(r => setTimeout(r, 400));

                log('Creating system directories (/system, /users, /documents)...');
                FileService.createDirectory('/system');
                FileService.createDirectory('/users');
                FileService.createDirectory('/documents');
                await new Promise(r => setTimeout(r, 400));

                log('Generating required system files...');
                FileService.writeFile('/system/installed.json', JSON.stringify({
                    installedAt: new Date().toISOString(),
                    version: SYSTEM_INFO.version
                }));
                
                if (win.dataset && win.dataset.setupUser) {
                    log(`Creating user account: ${win.dataset.setupUser}...`);
                    UserService.createUser(win.dataset.setupUser, win.dataset.setupUser);
                }

                log('Installation complete! Handing off to login manager...');
                await new Promise(r => setTimeout(r, 1000));

                WindowService.closeWindow(win.id);
                ProcessService.endProcess(pid);
                resolve();
            };

            renderWizard();
        });
    }
};
