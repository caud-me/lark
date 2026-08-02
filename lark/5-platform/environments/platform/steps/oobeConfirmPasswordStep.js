/**
 * oobeConfirmPasswordStep.js
 * OOBE Step 3: Password verification.
 */
export const oobeConfirmPasswordStep = {
    id: 'oobeConfirmPassword',
    render: () => `
        <div class="shell-extras-icon-design">
            <i>&#xE8D7;</i>
        </div>
        <h1>Confirm your password</h1>
        <p>Re-enter your password to ensure accuracy before completing setup.</p>
        <input type="password" name="passwordConfirm" id="input-password-confirm">
        <div class="layout-h">
            <button type="button" id="btn-confirm-back">Back</button>
            <button type="button" id="btn-confirm-proceed">Proceed</button>
        </div>
    `,
    bind: (container, ctx, env) => {
        const backBtn = container.querySelector('#btn-confirm-back');
        if (backBtn) {
            backBtn.onclick = () => env.jumpToStep('oobePassword');
        }

        const btn = container.querySelector('#btn-confirm-proceed');
        if (btn) {
            btn.onclick = async () => {
                const confirmInput = container.querySelector('#input-password-confirm');
                const confirmVal = confirmInput ? confirmInput.value : '';
                if (confirmVal !== ctx.userAccount.password) {
                    const registry = env.registry;
                    const dialogService = registry ? registry.get('DialogService') : null;
                    if (dialogService) {
                        await dialogService.alert('Passwords do not match. Please re-enter your password.', 'Password Mismatch');
                    } else {
                        alert('Passwords do not match.');
                    }
                    return;
                }
                ctx.userAccount.passwordConfirm = confirmVal;
                env.jumpToStep('oobeHint');
            };
        }
    }
};
