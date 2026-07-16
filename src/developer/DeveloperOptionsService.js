import { EventBus } from '../kernel/SystemEventBus.js';

export class DeveloperOptionsService {
    constructor(settingsManager) {
        this.settingsManager = settingsManager;
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'lde-developer-options-style';
        document.head.appendChild(this.styleElement);

        this.fpsCounter = null;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fpsUpdateInterval = null;
        this.animationFrameId = null;

        this.logEventsHandler = this.logEventsHandler.bind(this);
        this.isLoggingEvents = false;

        EventBus.on('settings:changed', (payload) => {
            if (payload.key && payload.key.startsWith('dev.')) {
                this.applySettings();
            }
        });
    }

    initialize() {
        this.applySettings();
    }

    applySettings() {
        const showBounds = this.settingsManager.get('dev.showBounds');
        const disableAnimations = this.settingsManager.get('dev.disableAnimations');
        const showFPS = this.settingsManager.get('dev.showFPS');
        const logEvents = this.settingsManager.get('dev.logEvents');
        const debugLayout = this.settingsManager.get('dev.debugLayout');

        let css = '';
        if (showBounds) {
            css += '* { outline: 1px solid rgba(255, 0, 0, 0.3) !important; }\n';
        }
        if (disableAnimations) {
            css += '* { transition: none !important; animation: none !important; }\n';
        }
        if (debugLayout) {
            css += '* { background: rgba(0, 255, 0, 0.05) !important; }\n';
        }
        this.styleElement.textContent = css;

        this.toggleFPS(showFPS);
        this.toggleEventLogging(logEvents);
    }

    toggleFPS(show) {
        if (show) {
            if (!this.fpsCounter) {
                this.fpsCounter = document.createElement('div');
                this.fpsCounter.style.position = 'fixed';
                this.fpsCounter.style.top = '10px';
                this.fpsCounter.style.right = '10px';
                this.fpsCounter.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                this.fpsCounter.style.color = '#0f0';
                this.fpsCounter.style.padding = '5px 10px';
                this.fpsCounter.style.fontFamily = 'monospace';
                this.fpsCounter.style.fontSize = '14px';
                this.fpsCounter.style.zIndex = '9999999';
                this.fpsCounter.style.borderRadius = '4px';
                this.fpsCounter.style.pointerEvents = 'none';
                document.body.appendChild(this.fpsCounter);

                this.lastFrameTime = performance.now();
                this.frameCount = 0;

                const loop = (timestamp) => {
                    this.frameCount++;
                    if (timestamp - this.lastFrameTime >= 1000) {
                        this.fpsCounter.textContent = `FPS: ${this.frameCount}`;
                        this.frameCount = 0;
                        this.lastFrameTime = timestamp;
                    }
                    this.animationFrameId = requestAnimationFrame(loop);
                };
                this.animationFrameId = requestAnimationFrame(loop);
            }
        } else {
            if (this.fpsCounter) {
                this.fpsCounter.remove();
                this.fpsCounter = null;
                cancelAnimationFrame(this.animationFrameId);
            }
        }
    }

    logEventsHandler(event, payload) {
        console.log(`[EventBus] ${event}`, payload);
    }

    toggleEventLogging(enable) {
        if (enable && !this.isLoggingEvents) {
            // Note: EventBus doesn't have a catch-all listener in our simplified implementation,
            // so we might need to patch the emit method or just listen to known events.
            // A better way is to proxy EventBus.emit for developer logging.
            this.originalEmit = EventBus.emit;
            EventBus.emit = (event, payload) => {
                console.log(`[EventBus] EMIT: ${event}`, payload);
                this.originalEmit.call(EventBus, event, payload);
            };
            this.isLoggingEvents = true;
        } else if (!enable && this.isLoggingEvents) {
            EventBus.emit = this.originalEmit;
            this.isLoggingEvents = false;
        }
    }

    /**
     * Cleans up all developer overlays and restores EventBus to its original state.
     * Called automatically during system shutdown via ShutdownService.
     * Ensures the EventBus monkey-patch is always restored even if the service
     * is destroyed unexpectedly at runtime.
     */
    dispose() {
        this.toggleFPS(false);
        this.toggleEventLogging(false);
        if (this.styleElement && this.styleElement.parentNode) {
            this.styleElement.remove();
            this.styleElement = null;
        }
    }
}
