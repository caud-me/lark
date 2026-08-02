/**
 * welcomeStep.js
 * First step of Lark OS Setup workflow.
 */
export const welcomeStep = {
    id: 'welcome',
    render: () => `
        <div class="shell-extras-icon-design">
            <i>&#xE9A9;</i>
        </div>
        <h1>Welcome to Lark OS</h1>
        <p>A platform first, browser based operating system.</p>
        <div class="spacer"></div>
        <button type="button" id="btn-install-now">Install now</button>
    `,
    bind: (container, ctx, env) => {
        const btn = container.querySelector('#btn-install-now');
        if (btn) btn.onclick = () => env.next();
    }
};
