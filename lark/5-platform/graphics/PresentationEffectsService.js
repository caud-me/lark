import { EventBus } from '../../1-kernel/SystemEventBus.js';
import { ObjectUtils } from '../../1-kernel/utils/ObjectUtils.js';

/**
 * PresentationEffectsService
 * 
 * Layer: 5-platform/graphics
 * Responsibility:
 * Single architectural owner of presentation effect policies (window motion, glass blur, reduced motion).
 * Evaluates host graphics driver capabilities alongside persisted user settings.
 * Translates kernel state events into semantic presentation window motion events (presentation.motion.window).
 * Emits canonical namespaced presentation policy events:
 * - presentation.policy.changed
 * - presentation.motion.changed
 * - presentation.blur.changed
 * 
 * Constitutional Invariant:
 * Presentation policy is evaluated once and consumed many times. Consumers must never recompute presentation policy independently.
 * 
 * Event Ownership Law:
 * PresentationEffectsService is the sole owner and emitter of presentation.* events.
 * 
 * Canonical Source of Truth Invariant:
 * getResolvedPolicy() is the canonical policy authority. All convenience helpers (isMotionEnabled(), isBlurEnabled(), getMotionPolicy(), getBlurPolicy()) derive directly from getResolvedPolicy().
 */
export class PresentationEffectsService {
    constructor(registry) {
        this.registry = registry;
        this._policyVersion = 0;
        this._lastUpdated = null;
        this._lastReason = 'boot';
        this._policyHash = '';
        this._cachedResolvedPolicy = null;

        // Active EventBus Subscriptions Map (eventName -> handler)
        this._subscriptions = new Map();

        // Perform initial policy evaluation & caching
        this._reevaluatePolicy('boot');

        // Subsystem Event Listeners
        this._setupSettingsListeners();
        this._subscribeToPlatformEvents();
    }

    /**
     * Internal helper to compute a deterministic hash of the resolved policy string.
     * @private
     * @param {Object} policyRaw 
     * @returns {string} Hash string
     */
    _computePolicyHash(policyRaw) {
        const str = JSON.stringify(policyRaw);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16).toUpperCase();
    }

    /**
     * Internal helper to register and track EventBus subscriptions for clean teardown.
     * @private
     */
    _subscribe(eventName, handler) {
        EventBus.on(eventName, handler);
        this._subscriptions.set(eventName, handler);
    }

    /**
     * Internal raw evaluator for motion capability and preference.
     * @private
     * @returns {boolean}
     */
    _evaluateMotionEnabled() {
        const capabilities = this._getGraphicsCapabilities();
        if (!capabilities.supportsHardwareAcceleration || !capabilities.supportsCssAnimations || capabilities.prefersReducedMotion) {
            return false;
        }
        const visualEffectsPref = this._getVisualEffectsSetting();
        return visualEffectsPref !== false;
    }

    /**
     * Internal raw evaluator for blur capability and preference.
     * @private
     * @returns {boolean}
     */
    _evaluateBlurEnabled() {
        const capabilities = this._getGraphicsCapabilities();
        if (!capabilities.supportsHardwareAcceleration || !capabilities.supportsBackdropFilter) {
            return false;
        }
        const visualEffectsPref = this._getVisualEffectsSetting();
        return visualEffectsPref !== false;
    }

    /**
     * Reevaluates policy based on explicit triggers ('boot', 'user.settings.changed', 'display.capabilities.changed').
     * @private
     * @param {string} reason 
     */
    _reevaluatePolicy(reason = 'boot') {
        const motionEnabled = this._evaluateMotionEnabled();
        const blurEnabled = this._evaluateBlurEnabled();
        const reducedMotion = !!this._getGraphicsCapabilities().prefersReducedMotion;

        const motionPolicies = {
            maximize: { action: 'maximize', enabled: motionEnabled, duration: motionEnabled ? 240 : 0, easing: motionEnabled ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'linear', delay: 0, fillMode: 'both' },
            restore: { action: 'restore', enabled: motionEnabled, duration: motionEnabled ? 240 : 0, easing: motionEnabled ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'linear', delay: 0, fillMode: 'both' },
            restoreFromMaximize: { action: 'restoreFromMaximize', enabled: motionEnabled, duration: motionEnabled ? 240 : 0, easing: motionEnabled ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'linear', delay: 0, fillMode: 'both' },
            minimize: { action: 'minimize', enabled: motionEnabled, duration: motionEnabled ? 240 : 0, easing: motionEnabled ? 'cubic-bezier(0.7, 0, 0.84, 0)' : 'linear', delay: 0, fillMode: 'both' },
            snap: { action: 'snap', enabled: motionEnabled, duration: motionEnabled ? 180 : 0, easing: motionEnabled ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'linear', delay: 0, fillMode: 'both' },
            center: { action: 'center', enabled: motionEnabled, duration: motionEnabled ? 220 : 0, easing: motionEnabled ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'linear', delay: 0, fillMode: 'both' },
            open: { action: 'open', enabled: motionEnabled, duration: motionEnabled ? 220 : 0, easing: motionEnabled ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'linear', delay: 0, fillMode: 'both' },
            close: { action: 'close', enabled: motionEnabled, duration: motionEnabled ? 220 : 0, easing: motionEnabled ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'linear', delay: 0, fillMode: 'both' },
            none: { action: 'none', enabled: false, duration: 0, easing: 'linear', delay: 0, fillMode: 'both' },
            general: { action: 'general', enabled: motionEnabled, duration: motionEnabled ? 220 : 0, easing: motionEnabled ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'linear', delay: 0, fillMode: 'both' }
        };

        const blurPolicy = {
            enabled: blurEnabled,
            filter: blurEnabled ? 'blur(12px) saturate(180%)' : 'none',
            backdropFilter: blurEnabled ? 'blur(12px) saturate(180%)' : 'none'
        };

        const rawPolicy = {
            motion: motionPolicies,
            blur: blurPolicy,
            profile: 'default', // Passive profile reservation for future extension
            reducedMotion
        };

        this._policyVersion += 1;
        this._lastUpdated = new Date().toISOString();
        this._lastReason = reason;
        this._policyHash = this._computePolicyHash(rawPolicy);

        const fullSnapshot = {
            ...rawPolicy,
            policyVersion: this._policyVersion,
            policyHash: this._policyHash,
            lastUpdated: this._lastUpdated,
            reason
        };

        this._cachedResolvedPolicy = ObjectUtils.deepFreeze(fullSnapshot);
    }

    /**
     * Listens for user settings and display capability changes to invalidate policy cache.
     * @private
     */
    _setupSettingsListeners() {
        const settingsHandler = (payload) => {
            const key = payload ? (payload.data ? payload.data.key : payload.key) : null;
            if (!key || key.startsWith('appearance.')) {
                this.notifyPolicyChanged('user.settings.changed');
            }
        };

        const visualEffectsHandler = () => this.notifyPolicyChanged('user.settings.changed');
        const capabilitiesHandler = () => this.notifyPolicyChanged('display.capabilities.changed');

        this._subscribe('user.settings.changed', settingsHandler);
        this._subscribe('user.settings.appearance.visualEffectsEnabled.changed', visualEffectsHandler);
        this._subscribe('display.capabilities.changed', capabilitiesHandler);
    }

    /**
     * Subscribes to platform lifecycle events to automatically trigger policy invalidations.
     * @private
     */
    _subscribeToPlatformEvents() {
        const TRANSITION_MAP = Object.freeze({
            maximizeButton: 'maximize',
            restoreButton: 'restoreFromMaximize',
            minimizeButton: 'minimize',
            taskbarRestore: 'restore',
            titlebarDrag: 'none',
            snapShortcut: 'snap',
            snapDrag: 'snap',
            centerCommand: 'center',
            sessionRestore: 'none',
            workspaceRestore: 'none',
            windowOpen: 'open',
            windowClose: 'close'
        });

        const transitionHandler = (payload) => {
            const transition = payload.data || payload;
            if (!transition || !transition.windowId) return;

            let animationIntent = TRANSITION_MAP[transition.transitionReason];
            if (!animationIntent) {
                EventBus.emit('sys.warn', {
                    severity: 'Warn',
                    source: 'PresentationEffectsService',
                    message: `Unknown transitionReason '${transition.transitionReason}' for window ${transition.windowId}. Falling back to animationIntent 'none'.`
                });
                animationIntent = 'none';
            }

            const policy = this.getMotionPolicy(animationIntent);
            const eventPayload = ObjectUtils.deepFreeze({
                severity: 'Info',
                source: 'PresentationEffectsService',
                message: `Presentation motion resolved: window ${transition.windowId} -> ${animationIntent} (#${transition.transitionId})`,
                data: {
                    targetId: transition.windowId,
                    animationIntent,
                    policy,
                    transition,
                    resolvedAt: new Date().toISOString()
                }
            });

            EventBus.emit('presentation.motion.window', eventPayload);
        };

        this._subscribe('window.transition', transitionHandler);
    }

    /**
     * Invalidates cached policy and broadcasts canonical namespaced policy updates across EventBus.
     * Valid trigger reasons: 'boot', 'user.settings.changed', 'display.capabilities.changed'
     * @param {string} reason 
     */
    notifyPolicyChanged(reason = 'user.settings.changed') {
        this._reevaluatePolicy(reason);

        const resolved = this.getResolvedPolicy();

        EventBus.emit('presentation.motion.changed', ObjectUtils.deepFreeze({
            severity: 'Info',
            source: 'PresentationEffectsService',
            message: 'Presentation motion policy updated',
            data: {
                motion: resolved.motion,
                policyVersion: resolved.policyVersion,
                policyHash: resolved.policyHash,
                reason
            }
        }));

        EventBus.emit('presentation.blur.changed', ObjectUtils.deepFreeze({
            severity: 'Info',
            source: 'PresentationEffectsService',
            message: 'Presentation blur policy updated',
            data: {
                blur: resolved.blur,
                policyVersion: resolved.policyVersion,
                policyHash: resolved.policyHash,
                reason
            }
        }));

        EventBus.emit('presentation.policy.changed', ObjectUtils.deepFreeze({
            severity: 'Info',
            source: 'PresentationEffectsService',
            message: 'Presentation policy updated',
            data: resolved
        }));
    }

    /**
     * Evaluates hardware capabilities via KernelDisplayAPI.
     * @private
     * @returns {Object}
     */
    _getGraphicsCapabilities() {
        if (!this.registry) {
            return {
                supportsBackdropFilter: false,
                supportsCssAnimations: true,
                supportsWebGL: false,
                supportsHardwareAcceleration: false,
                prefersReducedMotion: false
            };
        }
        const api = this.registry.get('KernelDisplayAPI');
        return api && typeof api.getGraphicsCapabilities === 'function' 
            ? api.getGraphicsCapabilities() 
            : {
                supportsBackdropFilter: false,
                supportsCssAnimations: true,
                supportsWebGL: false,
                supportsHardwareAcceleration: false,
                prefersReducedMotion: false
            };
    }

    /**
     * Retrieves visual effects setting value from UserSettingsService.
     * @private
     * @returns {boolean|null}
     */
    _getVisualEffectsSetting() {
        if (!this.registry) return null;
        const userSettingsService = this.registry.get('UserSettingsService');
        return userSettingsService ? userSettingsService.getSetting('appearance.visualEffectsEnabled') : null;
    }

    /**
     * Returns the cached, deeply frozen resolved presentation policy snapshot.
     * CANONICAL SOURCE OF TRUTH.
     * @returns {Object} Immutable resolved policy
     */
    getResolvedPolicy() {
        return this._cachedResolvedPolicy;
    }

    /**
     * Convenience helper: derived strictly from canonical getResolvedPolicy().
     * @returns {boolean}
     */
    isMotionEnabled() {
        return !!(this.getResolvedPolicy() && this.getResolvedPolicy().motion.general.enabled);
    }

    /**
     * Convenience helper: derived strictly from canonical getResolvedPolicy().
     * @returns {boolean}
     */
    isBlurEnabled() {
        return !!(this.getResolvedPolicy() && this.getResolvedPolicy().blur.enabled);
    }

    /**
     * Convenience helper: derived strictly from canonical getResolvedPolicy().
     * @returns {boolean}
     */
    prefersReducedMotion() {
        return !!(this.getResolvedPolicy() && this.getResolvedPolicy().reducedMotion);
    }

    /**
     * Convenience helper: derived strictly from canonical getResolvedPolicy().
     * @param {string} action - 'maximize', 'restore', 'snap', 'general'
     * @returns {Object} Immutable policy object
     */
    getMotionPolicy(action = 'general') {
        const resolved = this.getResolvedPolicy();
        return (resolved && resolved.motion) ? (resolved.motion[action] || resolved.motion.general) : null;
    }

    /**
     * Convenience helper: derived strictly from canonical getResolvedPolicy().
     * @returns {Object} Immutable policy object
     */
    getBlurPolicy() {
        const resolved = this.getResolvedPolicy();
        return resolved ? resolved.blur : null;
    }

    /**
     * Returns a read-only diagnostic snapshot for developer and audit tooling.
     * 
     * IMPORTANT:
     * This snapshot is intended exclusively for:
     * - developer tools
     * - audit tooling
     * - debugging / HealthReporter
     * Applications MUST NOT rely on diagnostics for runtime application logic.
     * 
     * @returns {Object} Deeply frozen diagnostics snapshot
     */
    getDiagnosticsSnapshot() {
        return ObjectUtils.deepFreeze({
            serviceVersion: '27.9.3',
            policyVersion: this._policyVersion,
            policyHash: this._policyHash,
            lastUpdated: this._lastUpdated,
            lastReason: this._lastReason,
            subscriptions: Array.from(this._subscriptions.keys()).map(name => ({ event: name, active: true })),
            capabilities: this._getGraphicsCapabilities(),
            userSettings: {
                visualEffectsEnabled: this._getVisualEffectsSetting()
            },
            resolvedPolicy: this.getResolvedPolicy()
        });
    }

    /**
     * Disposes the service and detaches all active EventBus subscriptions to prevent memory leaks.
     */
    dispose() {
        for (const [eventName, handler] of this._subscriptions.entries()) {
            EventBus.off(eventName, handler);
        }
        this._subscriptions.clear();
    }
}
