import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * BootSplash
 *
 * Responsibility:
 * Renders the initial LDE boot screen and fade transitions.
 * Observes the SystemEventBus for lifecycle events.
 *
 * Does NOT:
 * - Execute initialization logic
 * - Dictate boot order
 * - Depend on Runtime Services
 */
export class BootSplash {
    constructor() {
        this.element = document.createElement('div');
        this.element.id = 'lde-boot-splash';
        
        // Fullscreen black overlay container using standard CSS style declarations
        this.element.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            background-color: #000000;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            font-family: system-ui, -apple-system, sans-serif;
            transition: opacity 0.8s, visibility 0.8s;
            user-select: none;
        `;

        // Direct layout injection of your simplified vertical tree
        this.element.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                <img src="./assets/icons/icon.svg" style="width: 64px; height: 64px;" alt="Lark OS Logo">
                <small id="lde-boot-text" style="color: rgba(255, 255, 255, 0.5); transition: opacity 0.15s;">Power On</small>
                <div style="width: 120px; height: 4px; background-color: rgba(255, 255, 255, 0.15); border-radius: 2px; overflow: hidden;">
                    <div id="lde-boot-progress-bar" style="width: 0%; height: 100%; background-color: #ffffff; transition: width 0.3s ease-out;"></div>
                </div>
            </div>
        `;

        this.statusText = this.element.querySelector('#lde-boot-text');
        this.progressBar = this.element.querySelector('#lde-boot-progress-bar');
        this.progress = 0;

        this.setupListeners();
    }

    updateStatus(text, progressIncrement = 15) {
        // Smoothly fade out text, update it, and fade back in
        this.statusText.style.opacity = '0';
        
        this.progress = Math.min(this.progress + progressIncrement, 95);
        this.progressBar.style.width = `${this.progress}%`;

        setTimeout(() => {
            this.statusText.innerText = text;
            this.statusText.style.opacity = '1';
        }, 150);
    }

    setupListeners() {
        // Generic Lifecycle Observers
        EventBus.on('boot.completed', () => {
            this.updateStatus('Kernel Initialized');
        });

        const updateFromPayload = (payload) => {
            if (payload && payload.message) {
                this.updateStatus(payload.message);
            }
        };

        // Listen to generic boot events
        EventBus.on('kernel:boot', updateFromPayload);
        EventBus.on('kernel:firstBoot', updateFromPayload);
        EventBus.on('kernel:login', updateFromPayload);
        
        EventBus.on('kernel:recovery', () => {
            this.updateStatus('Entering Recovery Environment...');
        });

        const finishSplash = (message) => {
            if (message) {
                this.updateStatus(message, 100);
            }
            this.progressBar.style.width = '100%';
            
            // Fade out the splash screen element
            setTimeout(() => {
                this.element.style.opacity = '0';
                this.element.style.visibility = 'hidden';
                this.element.style.pointerEvents = 'none';
                
                // Completely unmount after animation completes
                setTimeout(() => {
                    this.unmount();
                }, 1000);
            }, 600);
        };

        // The final handoff to user space (either the login environment or directly to desktop)
        EventBus.on('platform.ready', () => {
            finishSplash('Ready');
        });
    }

    mount() {
        document.body.appendChild(this.element);
        
        // Start the progress bar slightly to show it's alive
        setTimeout(() => {
            if (this.progressBar) {
                this.progressBar.style.width = '5%';
            }
        }, 100);
    }

    unmount() {
        if (this.element && this.element.parentElement) {
            this.element.parentElement.removeChild(this.element);
        }
    }
}