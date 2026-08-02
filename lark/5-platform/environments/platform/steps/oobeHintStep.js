/**
 * oobeHintStep.js
 * OOBE Step 4: Password hint entry.
 */
export const oobeHintStep = {
    id: 'oobeHint',
    render: () => `
        <div class="shell-extras-icon-design">
            <i>&#xE890;</i>
        </div>
        <h1>Provide a hint so you don't forget it.</h1>
        <p>Add an optional clue to help recover access if you forget your password.</p>
        <input type="text" name="hint" id="input-hint" placeholder="Entirely optional">
        <div class="layout-h">
            <button type="button" id="btn-hint-back">Back</button>
            <button type="button" id="btn-hint-proceed">Proceed</button>
        </div>
    `,
    bind: (container, ctx, env) => {
        const backBtn = container.querySelector('#btn-hint-back');
        if (backBtn) {
            backBtn.onclick = () => env.jumpToStep('oobeConfirmPassword');
        }

        const btn = container.querySelector('#btn-hint-proceed');
        if (btn) {
            btn.onclick = () => {
                const hintInput = container.querySelector('#input-hint');
                ctx.userAccount.hint = hintInput ? hintInput.value.trim() : '';
                env.jumpToStep('oobeGraphics');
            };
        }
    }
};
