import { ShellComponent } from './ShellComponent.js';
import { EventBus } from '../../../1-kernel/SystemEventBus.js';

/**
 * PresentationEffectsBridge
 * 
 * Layer: 5-platform/desktop/shell
 * Responsibility:
 * Browser renderer adapter that synchronizes platform presentation policy into browser CSS custom properties.
 * Listens to presentation.policy.* and presentation.blur.* / presentation.motion.* events emitted strictly
 * by PresentationEffectsService and declaratively updates document.documentElement custom properties
 * (--lde-glass-backdrop-filter, --lde-window-transition-duration, --lde-motion-enabled).
 * 
 * Part of the Capability (Layer 1) -> Policy (Layer 5) -> Bridge (Renderer Adapter) -> Surface Pipeline.
 * 
 * Does NOT:
 * - Make policy evaluations or read user settings directly (delegated to PresentationEffectsService)
 * - Own window z-order or geometry state machine (delegated to WindowManager)
 */
export class PresentationEffectsBridge extends ShellComponent {
    initialize(registry, environment) {
        super.initialize(registry, environment);

        this.effectsService = registry ? registry.get('PresentationEffectsService') : null;
        this._handlers = new Map();

        this.resume();

        // Initial synchronization
        this.syncAll();
    }

    /**
     * Resumes component and registers EventBus subscriptions.
     */
    resume() {
        if (this._handlers.size > 0) return;

        const policyHandler = (payload) => this.syncPolicyToBrowser(payload ? payload.data : null);
        const blurHandler = (payload) => this.syncBlurPolicyToBrowser(payload ? payload.data : null);
        const motionHandler = (payload) => this.syncMotionPolicyToBrowser(payload ? payload.data : null);

        this._subscribe('presentation.policy.changed', policyHandler);
        this._subscribe('presentation.blur.changed', blurHandler);
        this._subscribe('presentation.motion.changed', motionHandler);
    }

    /**
     * Internal helper to subscribe and track event handler.
     * @private
     */
    _subscribe(eventName, handler) {
        EventBus.on(eventName, handler);
        this._handlers.set(eventName, handler);
    }

    /**
     * Suspends component and detaches EventBus subscriptions to prevent memory leaks.
     */
    suspend() {
        for (const [eventName, handler] of this._handlers.entries()) {
            EventBus.off(eventName, handler);
        }
        this._handlers.clear();
    }

    /**
     * Destroys component, removing DOM references and clearing event subscriptions.
     */
    destroy() {
        this.suspend();
        super.destroy();
    }

    /**
     * Performs initial policy synchronization from PresentationEffectsService to DOM root.
     */
    syncAll() {
        if (!this.effectsService) return;

        const blurPolicy = this.effectsService.getBlurPolicy();
        const motionPolicy = this.effectsService.getMotionPolicy('general');

        this.syncBlurPolicyToBrowser({ blur: blurPolicy });
        this.syncMotionPolicyToBrowser({ motion: motionPolicy });
    }

    /**
     * Synchronizes full policy snapshot to document.documentElement.
     * @param {Object} data 
     */
    syncPolicyToBrowser(data) {
        if (!data) return;
        if (data.blur) this.syncBlurPolicyToBrowser(data);
        if (data.motion) this.syncMotionPolicyToBrowser(data);
    }

    /**
     * Updates glass backdrop-filter root CSS variables.
     * @param {Object} data 
     */
    syncBlurPolicyToBrowser(data) {
        if (!data || typeof document === 'undefined') return;

        const blurPolicy = data.blur || data;
        if (!blurPolicy) return;

        const root = document.documentElement;
        if (!root) return;

        if (blurPolicy.enabled) {
            root.style.setProperty('--lde-glass-backdrop-filter', blurPolicy.backdropFilter || 'blur(12px) saturate(180%)');
            root.style.setProperty('--lde-glass-bg', '#80808020');
            root.classList.remove('lde-blur-disabled');
        } else {
            root.style.setProperty('--lde-glass-backdrop-filter', 'none');
            root.style.setProperty('--lde-glass-bg', '#151515');
            root.classList.add('lde-blur-disabled');
        }
    }

    /**
     * Updates window motion duration root CSS variables.
     * @param {Object} data 
     */
    syncMotionPolicyToBrowser(data) {
        if (!data || typeof document === 'undefined') return;

        const motionData = data.motion || data;
        if (!motionData) return;

        const motionPolicy = motionData.general || motionData;

        const root = document.documentElement;
        if (!root) return;

        if (motionPolicy.enabled) {
            root.style.setProperty('--lde-window-transition-duration', `${motionPolicy.duration}ms`);
            root.style.setProperty('--lde-motion-enabled', '1');
            root.classList.remove('lde-motion-disabled');
        } else {
            root.style.setProperty('--lde-window-transition-duration', '0ms');
            root.style.setProperty('--lde-motion-enabled', '0');
            root.classList.add('lde-motion-disabled');
        }
    }
}
