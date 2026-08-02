/**
 * oobePasswordStep.js
 * OOBE Step 2: User password entry.
 */
export const oobePasswordStep = {
    id: 'oobePassword',
    render: () => `
        <div class="shell-extras-icon-design">
            <i>&#xE8D7;</i>
        </div>
        <h1>Next, enter your password</h1>
        <p>Create a secure password to protect your account and personal files.</p>
        <input type="password" name="password" id="input-password" placeholder="Recommended 8 characters and above">
        <div class="layout-h">
            <button type="button" id="btn-pass-back">Back</button>
            <button type="button" id="btn-pass-proceed">Proceed</button>
        </div>
    `,
    bind: (container, ctx, env) => {
        const backBtn = container.querySelector('#btn-pass-back');
        if (backBtn) {
            backBtn.onclick = () => env.jumpToStep('oobeName');
        }

        const btn = container.querySelector('#btn-pass-proceed');
        if (btn) {
            btn.onclick = () => {
                const passInput = container.querySelector('#input-password');
                ctx.userAccount.password = passInput ? passInput.value : '';
                env.jumpToStep('oobeConfirmPassword');
            };
        }
    }
};
