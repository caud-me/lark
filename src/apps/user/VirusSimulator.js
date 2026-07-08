import { coreKernel } from '../../kernel/kernel.js';

export default {
    run: async (registry, pid) => {
        const WindowService = registry.get('WindowService');
        if (!WindowService) return;

        const win = WindowService.createWindow({
            title: 'System Optimizer Pro',
            width: 450,
            height: 350,
            pid
        });

        win.contentElement.innerHTML = `
            <div class="lde-app-container lde-centered-layout" style="height: 100%; justify-content: center; background: var(--lde-bg-base);">
                <div style="font-size: 4rem; margin-bottom: 16px;">🚀</div>
                <h2 style="margin-bottom: 16px; color: var(--lde-text-primary);">System Optimizer Pro</h2>
                <p style="text-align: center; margin-bottom: 32px; max-width: 80%; line-height: 1.5;" class="text-secondary">
                    Your system is running slower than usual. Scan for performance issues, malware, and registry errors to speed up your computer instantly.
                </p>
                <button id="virus-scan-btn-${win.id}" class="lde-btn lde-btn-primary" style="padding: 12px 24px; font-size: 1.1rem; border-radius: 24px;">Start Full Scan</button>
            </div>
        `;

        win.contentElement.querySelector(`#virus-scan-btn-${win.id}`).onclick = () => {
            const btn = win.contentElement.querySelector(`#virus-scan-btn-${win.id}`);
            btn.innerText = "Scanning...";
            btn.classList.add('lde-btn-danger');
            btn.classList.remove('lde-btn-primary');
            btn.disabled = true;

            const errors = [
                "panic(cpu 0 caller 0xffffff8000213456): Kernel trap at 0xffffff80006789ab, type 14=page fault",
                "panic(cpu 2 caller 0xffffff8001111111): nvme: \"Fatal error occurred. NVMe status: 0x40040003\"",
                "panic(cpu 1 caller 0xffffff8000abcdef): Memory corruption detected in zone: kalloc.128",
                "panic(cpu 3 caller 0xffffff8000123456): Process 1 (sys.login) crashed: segmentation fault",
                "panic(cpu 0 caller 0xffffff8000999999): Watchdog timeout: no checkins from window server in 120 seconds"
            ];

            // Spawn a few annoying windows
            let spawnCount = 0;
            const spawnInterval = setInterval(() => {
                if (spawnCount > 100) {
                    clearInterval(spawnInterval);
                    return;
                }
                const popup = WindowService.createWindow({
                    title: 'CRITICAL WARNING',
                    width: 300,
                    height: 150,
                    pid
                });

                popup.contentElement.innerHTML = `
                    <div style="color: #ff4444; font-weight: bold; font-size: 1.2rem; padding: 20px; text-align: center; height: 100%; display: flex; align-items: center; justify-content: center; background: #222;">
                        SYSTEM COMPROMISED
                    </div>
                `;
                spawnCount++;
            }, 50);

            // Trigger panic after a delay
            setTimeout(() => {
                const randomError = errors[Math.floor(Math.random() * errors.length)];
                coreKernel.panic(new Error(randomError));
            }, 1000);
        };
    }
};
