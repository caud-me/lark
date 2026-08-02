/**
 * oobeNameStep.js
 * OOBE Step 1: User full name entry.
 */
export const oobeNameStep = {
    id: 'oobeName',
    render: (ctx) => `
        <div class="shell-extras-icon-design">
            <i>&#xE77B;</i>
        </div>
        <h1>What's your name?</h1>
        <p>Enter your full name to personalize your Lark OS user profile.</p>
        <input type="text" name="name" id="input-username" placeholder="Johnny Appleseed" value="${ctx.userAccount.name || ''}">
        <div class="layout-h">
            <button type="button" id="btn-name-back">Back</button>
            <button type="button" id="btn-name-proceed">Proceed</button>
        </div>
    `,
    bind: (container, ctx, env) => {
        const backBtn = container.querySelector('#btn-name-back');
        if (backBtn) {
            backBtn.onclick = () => env.jumpToStep('installedConfirmation');
        }

        const btn = container.querySelector('#btn-name-proceed');
        if (btn) {
            btn.onclick = () => {
                const nameInput = container.querySelector('#input-username');
                ctx.userAccount.name = nameInput ? nameInput.value.trim() || 'Johnny Appleseed' : 'Johnny Appleseed';
                env.jumpToStep('oobePassword');
            };
        }
    }
};
