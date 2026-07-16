const assert = require('assert');
// Let's just mock the flow manually to see where the bug is
const systemContext = { identity: 'system', role: 'SYSTEM' };
const options = { ownerOverride: 'ME', context: systemContext };

function _resolveContext(opts) {
    if (opts.context) return opts.context;
    return { identity: 'ME', role: 'USER' };
}
function _getSessionUsername(opts) {
    const ctx = _resolveContext(opts);
    return ctx ? ctx.identity : 'system';
}
function _getMetadata(ownerOverride = null, opts = {}) {
    const currentUser = _getSessionUsername(opts);
    const owner = (ownerOverride && currentUser === 'system') ? ownerOverride : currentUser;
    return { owner, permissions: { read: true, write: true } };
}

console.log('Metadata during creation:', _getMetadata('ME', options));
console.log('Metadata during normal write:', _getMetadata(null, {}));
