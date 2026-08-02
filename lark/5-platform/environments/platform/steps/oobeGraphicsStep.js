/**
 * oobeGraphicsStep.js
 * OOBE Step: Hardware Acceleration & Graphics Performance configuration.
 */
export const oobeGraphicsStep = {
    id: 'oobeGraphics',
    onEnter: async (ctx, env) => {
        const registry = env ? env.registry : null;
        const displayApi = registry ? registry.get('KernelDisplayAPI') : null;
        const graphicsCaps = (displayApi && typeof displayApi.getGraphicsCapabilities === 'function')
            ? displayApi.getGraphicsCapabilities()
            : { supportsHardwareAcceleration: false, supportsBackdropFilter: false };

        ctx.hwAccelDetected = Boolean(graphicsCaps.supportsHardwareAcceleration);
        if (ctx.visualEffectsEnabled === undefined) {
            ctx.visualEffectsEnabled = ctx.hwAccelDetected;
        }
    },
    render: (ctx) => {
        const hwAccelDetected = Boolean(ctx.hwAccelDetected);
        const visualEffectsEnabled = Boolean(ctx.visualEffectsEnabled);

        return `
            <div class="shell-extras-icon-design">
                <i>&#xE7F4;</i>
            </div>
            <h1>Graphics & Performance</h1>
            <p>Configure hardware graphics support and visual effects.</p>

            <h3>Hardware Acceleration</h3>
            <div class="radio">
                <div class="layout-h">
                    <div class="layout-v">
                        <label><strong>${hwAccelDetected ? 'Hardware Acceleration Detected' : 'Hardware Acceleration Not Detected'}</strong></label>
                        <small>${hwAccelDetected 
                            ? 'Hardware acceleration is active in your browser. Visual effects are enabled by default for maximum fluidity.' 
                            : 'Hardware acceleration is not detected in your browser. For optimal performance, you can optionally enable hardware acceleration in your browser settings.'}</small>
                    </div>
                </div>
            </div>

            <h3>Visual Effects</h3>
            <div class="radio">
                <div class="layout-h">
                    ${hwAccelDetected ? `
                        <input type="checkbox" id="oobe-visual-effects-toggle" ${visualEffectsEnabled ? 'checked' : ''}>
                        <div class="layout-v">
                            <label for="oobe-visual-effects-toggle"><strong>Enable Visual Effects</strong></label>
                            <small>Enable window animations and glass translucent blur effects (performance depends on your graphics driver).</small>
                        </div>
                    ` : `
                        <div class="layout-v">
                            <label><strong>Visual Effects</strong></label>
                            <small id="oobe-anim-status-text">${visualEffectsEnabled ? 'Visual effects are currently enabled.' : 'Visual effects are disabled to save GPU/CPU resources.'}</small>
                        </div>
                        <button type="button" id="btn-nothanks" ${!visualEffectsEnabled ? 'disabled' : ''}>${visualEffectsEnabled ? 'No thanks' : 'Visual Effects Disabled'}</button>
                    `}
                </div>
            </div>

            <div class="layout-h">
                <button type="button" id="btn-graphics-back">Back</button>
                <button type="button" id="btn-graphics-proceed">Proceed</button>
            </div>
        `;
    },
    bind: (container, ctx, env) => {
        const backBtn = container.querySelector('#btn-graphics-back');
        if (backBtn) {
            backBtn.onclick = () => env.jumpToStep('oobeHint');
        }

        const proceedBtn = container.querySelector('#btn-graphics-proceed');
        if (proceedBtn) {
            proceedBtn.onclick = () => {
                if (ctx.hwAccelDetected) {
                    const toggle = container.querySelector('#oobe-visual-effects-toggle');
                    if (toggle) {
                        ctx.visualEffectsEnabled = Boolean(toggle.checked);
                    }
                }
                env.jumpToStep('setupComplete');
            };
        }

        if (ctx.hwAccelDetected) {
            const toggle = container.querySelector('#oobe-visual-effects-toggle');
            if (toggle) {
                toggle.onchange = () => {
                    ctx.visualEffectsEnabled = Boolean(toggle.checked);
                };
            }
        } else {
            const noThanksBtn = container.querySelector('#btn-nothanks');
            const statusText = container.querySelector('#oobe-anim-status-text');
            if (noThanksBtn) {
                noThanksBtn.onclick = () => {
                    ctx.visualEffectsEnabled = false;
                    noThanksBtn.textContent = 'Visual Effects Disabled';
                    noThanksBtn.disabled = true;
                    if (statusText) {
                        statusText.textContent = 'Visual effects are disabled to save GPU/CPU resources.';
                    }
                };
            }
        }
    }
};
