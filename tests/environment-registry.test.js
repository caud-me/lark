import test from 'node:test';
import assert from 'node:assert/strict';

import { PlatformEnvironmentRegistry } from '../src/platform/environments/platform/PlatformEnvironmentRegistry.js';
import { DesktopEnvironmentRegistry } from '../src/platform/environments/desktop/DesktopEnvironmentRegistry.js';

test('platform and desktop environment registries resolve to existing modules', async () => {
    const platformRegistry = new PlatformEnvironmentRegistry();
    const desktopRegistry = new DesktopEnvironmentRegistry();

    const loginEnv = platformRegistry.getEnvironment('sys.login');
    assert.ok(loginEnv, 'login environment should exist');
    const loginModule = await import(loginEnv.entryPoint);
    assert.ok(loginModule.default, 'login environment module should export a default export');

    const desktopEnv = desktopRegistry.getEnvironment('sys.desktop');
    assert.ok(desktopEnv, 'desktop environment should exist');
    const desktopModule = await import(desktopEnv.entryPoint);
    assert.ok(desktopModule.default, 'desktop environment module should export a default export');
});
