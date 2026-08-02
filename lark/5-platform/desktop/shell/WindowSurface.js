import { ShellComponent } from './ShellComponent.js';
import { WindowFrame } from '../../window/WindowFrame.js';
import { EventBus } from '../../../1-kernel/SystemEventBus.js';

/**
 * WindowSurface
 *
 * Responsibility:
 * Owns the creation, DOM mounting, and visual frame lifecycle of WindowFrame instances.
 * Subscribes strictly to presentation.motion.window intent events and decouples WindowManager from visual transitions.
 * 
 * Part of the Capability (Layer 1) -> Policy (Layer 5) -> Bridge -> Surface Pipeline.
 */
export class WindowSurface extends ShellComponent {
    initialize(registry, environment) {
        super.initialize(registry, environment);
        this.motionTimers = new Map();
        this._motionHandler = null;

        this.resume();
    }

    /**
     * Resumes component and registers EventBus subscriptions.
     */
    resume() {
        if (this._motionHandler) return;

        this._motionHandler = (payload) => this._handleMotionIntent(payload ? payload.data : null);
        EventBus.on('presentation.motion.window', this._motionHandler);
    }

    /**
     * Suspends component and detaches EventBus subscriptions to prevent memory leaks.
     */
    suspend() {
        if (this._motionHandler) {
            EventBus.off('presentation.motion.window', this._motionHandler);
            this._motionHandler = null;
        }

        for (const timer of this.motionTimers.values()) {
            clearTimeout(timer);
        }
        this.motionTimers.clear();
    }

    /**
     * Destroys component, removing DOM references and clearing event subscriptions.
     */
    destroy() {
        this.suspend();
        super.destroy();
    }

    /**
     * Applies declarative CSS motion classes to the target window frame element upon presentation intent.
     * Dumb view renderer: renders strictly based on animationIntent and policy provided in the payload.
     * @param {Object} data - Presentation intent payload ({ animationIntent, targetId, policy, transition })
     */
    _handleMotionIntent(data) {
        if (!data || !data.targetId || !data.policy) return;

        const targetId = data.targetId;
        const policy = data.policy;
        const animationIntent = data.animationIntent || data.action || 'general';
        const frameElement = document.getElementById(targetId);

        if (!frameElement) return;

        // Clear existing motion timer if pending
        if (this.motionTimers.has(targetId)) {
            clearTimeout(this.motionTimers.get(targetId));
            this.motionTimers.delete(targetId);
        }

        if (policy.enabled && animationIntent !== 'none') {
            if (animationIntent === 'minimize') {
                frameElement.classList.remove('opened', 'restoring', 'animating-motion');
                frameElement.classList.add('minimizing');

                const finishMinimize = () => {
                    frameElement.style.display = 'none';
                    frameElement.classList.remove('minimizing');
                    this.motionTimers.delete(targetId);
                };

                const onAnimEnd = (e) => {
                    if (e.animationName === 'ldeFluidMinimize') {
                        frameElement.removeEventListener('animationend', onAnimEnd);
                        finishMinimize();
                    }
                };

                frameElement.addEventListener('animationend', onAnimEnd);
                const timer = setTimeout(finishMinimize, 260);
                this.motionTimers.set(targetId, timer);
            } else if (animationIntent === 'restore') {
                frameElement.style.display = '';
                frameElement.classList.remove('opened', 'minimizing', 'animating-motion');
                frameElement.classList.add('restoring');

                const finishRestore = () => {
                    frameElement.classList.remove('restoring');
                    frameElement.classList.add('opened');
                    this.motionTimers.delete(targetId);
                };

                const onAnimEnd = (e) => {
                    if (e.animationName === 'ldeFluidRestore') {
                        frameElement.removeEventListener('animationend', onAnimEnd);
                        finishRestore();
                    }
                };

                frameElement.addEventListener('animationend', onAnimEnd);
                const timer = setTimeout(finishRestore, 260);
                this.motionTimers.set(targetId, timer);
            } else {
                frameElement.classList.remove('minimizing', 'restoring');
                frameElement.classList.add('animating-motion');
                const timer = setTimeout(() => {
                    frameElement.classList.remove('animating-motion');
                    frameElement.classList.add('opened');
                    this.motionTimers.delete(targetId);
                }, (policy.duration || 220) + 50);
                this.motionTimers.set(targetId, timer);
            }
        } else {
            frameElement.classList.remove('animating-motion', 'minimizing', 'restoring');
            if (animationIntent === 'minimize') {
                frameElement.style.display = 'none';
            } else {
                frameElement.style.display = '';
                frameElement.classList.add('opened');
            }
        }
    }

    /**
     * Constructs a WindowFrame visual element and mounts it to the window host.
     * @param {string} id - Window ID
     * @param {string} title - Window title
     * @param {Object} options - Window options
     * @param {Object} callbacks - Interactive callbacks (onClose, onFocus, onDrag, onResize, onMinimize, onMaximize)
     * @returns {WindowFrame}
     */
    createFrame(id, title, options, callbacks) {
        const frame = new WindowFrame(title, callbacks, options);
        frame.element.id = id;

        let host = options.host;
        if (!host && this.environment && typeof this.environment.getWindowHost === 'function') {
            host = this.environment.getWindowHost();
        }
        if (!host) {
            host = document.getElementById('window-host');
        }

        if (host) {
            host.appendChild(frame.element);
        }

        return frame;
    }
}
