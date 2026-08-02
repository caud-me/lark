import { BaseDriver } from './BaseDriver.js';

/**
 * DisplayGraphicsDriver
 * 
 * Layer: 1-kernel/drivers
 * Responsibility:
 * Probes and reports physical device and browser environment graphics capabilities.
 * Inspects backdrop-filter support, WebGL/hardware acceleration, CSS animation capabilities,
 * and system prefers-reduced-motion state.
 * 
 * Does NOT:
 * - Make user preference or OS effect policy decisions (owned by PresentationEffectsService)
 * - Manipulate DOM elements or render UI components
 */
export class DisplayGraphicsDriver extends BaseDriver {
    constructor() {
        super('Lark Display Graphics Driver', 'display_graphics', 'dev.display.primary', false);
        this.capabilities = {
            supportsBackdropFilter: false,
            supportsCssAnimations: true,
            supportsWebGL: false,
            supportsHardwareAcceleration: false,
            prefersReducedMotion: false
        };
    }

    /**
     * Binds driver to virtual display hardware metadata and probes host browser graphics APIs.
     * @param {Object} deviceMetadata 
     * @returns {Promise<boolean>}
     */
    async initialize(deviceMetadata) {
        this.device = deviceMetadata || { name: 'Virtual Graphics Host' };

        const hasCss = typeof CSS !== 'undefined' && typeof CSS.supports === 'function';
        const backdropSupported = hasCss && (
            CSS.supports('backdrop-filter', 'blur(1px)') || 
            CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
        );

        let webglSupported = false;
        let isHardwareAccelerated = false;
        try {
            if (typeof document !== 'undefined') {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (gl) {
                    webglSupported = true;

                    let rendererString = '';
                    try {
                        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                        if (debugInfo) {
                            rendererString = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
                        }
                    } catch (e) {}

                    if (!rendererString) {
                        try {
                            rendererString = gl.getParameter(gl.RENDERER) || '';
                        } catch (e) {}
                    }

                    const lowerRenderer = String(rendererString).toLowerCase();
                    const isSoftwareRenderer = 
                        lowerRenderer.includes('swiftshader') ||
                        lowerRenderer.includes('software') ||
                        lowerRenderer.includes('llvmpipe') ||
                        lowerRenderer.includes('basic render driver') ||
                        lowerRenderer.includes('mesa offscreen') ||
                        lowerRenderer.includes('subzero');

                    isHardwareAccelerated = !isSoftwareRenderer;
                }
            }
        } catch (e) {
            webglSupported = false;
            isHardwareAccelerated = false;
        }

        let reducedMotion = false;
        try {
            if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
                reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            }
        } catch (e) {
            reducedMotion = false;
        }

        this.capabilities = {
            supportsBackdropFilter: backdropSupported,
            supportsCssAnimations: !reducedMotion,
            supportsWebGL: webglSupported,
            supportsHardwareAcceleration: isHardwareAccelerated,
            prefersReducedMotion: reducedMotion
        };

        this.status = 'LOADED';
        this.error = null;
        console.log(`[Kernel:Driver] ${this.name} probed capabilities:`, this.capabilities);
        return true;
    }

    /**
     * Returns a snapshot of hardware and browser graphics capabilities.
     * @returns {Object}
     */
    getGraphicsCapabilities() {
        return { ...this.capabilities };
    }

    supportsBackdropFilter() {
        return this.capabilities.supportsBackdropFilter;
    }

    supportsCssAnimations() {
        return this.capabilities.supportsCssAnimations;
    }

    supportsWebGL() {
        return this.capabilities.supportsWebGL;
    }

    supportsHardwareAcceleration() {
        return this.capabilities.supportsHardwareAcceleration;
    }

    prefersReducedMotion() {
        return this.capabilities.prefersReducedMotion;
    }
}
