/**
 * Recovery Platform Environment
 *
 * Responsibility:
 * Provides a safe mode or system recovery interface.
 */
export default {
    run: async (registry) => {
        return new Promise((resolve) => {
            const container = document.getElementById('platform-host');
            const recoveryEl = document.createElement('div');
            recoveryEl.id = 'recovery-container';
            recoveryEl.style.position = 'absolute';
            recoveryEl.style.top = '0';
            recoveryEl.style.left = '0';
            recoveryEl.style.width = '100%';
            recoveryEl.style.height = '100%';
            recoveryEl.style.zIndex = '9999';
            recoveryEl.style.backgroundColor = '#1a1a1a';
            recoveryEl.style.color = '#ffffff';
            recoveryEl.style.display = 'flex';
            recoveryEl.style.alignItems = 'center';
            recoveryEl.style.justifyContent = 'center';

            container.appendChild(recoveryEl);

            const card = document.createElement('div');
            card.className = `layout-v flex-gap-16 flex-align-start`

            const cleanup = () => {
                recoveryEl.remove();
                resolve();
            };

            const title = document.createElement('h2');
            title.textContent = 'System Recovery';

            const description = document.createElement('p');
            description.textContent = `LRE is still in the making, thanks for checking the project down to it's absolute details.`;

            const rebootBtn = document.createElement('button');
            rebootBtn.textContent = 'Restart this device';
            rebootBtn.onclick = () => {
                window.location.reload();
                cleanup();
            };

            card.appendChild(title);
            card.appendChild(description);
            card.appendChild(rebootBtn);

            recoveryEl.appendChild(card);
        });
    }
};
