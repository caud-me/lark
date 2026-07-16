import test from 'node:test';
import assert from 'node:assert/strict';

import { EventBus } from '../src/kernel/SystemEventBus.js';
import { BootLogger } from '../src/system/BootLogger.js';
import { LogManager } from '../src/platform/logging/LogManager.js';
import { LogService } from '../src/platform/logging/LogService.js';

test('flushes buffered boot entries into LogService exactly once', () => {
    EventBus.listeners = new Map();
    EventBus._nextEventId = 1;
    EventBus.eventHistory = [];

    BootLogger.phase('BOOT');
    BootLogger.success('Boot sequence started');

    const logManager = new LogManager();
    const logService = new LogService(logManager);
    BootLogger.flush(logService);
    BootLogger.flush(logService);

    assert.ok(logService);
    assert.equal(logManager.getLogs().length, 2);
    assert.equal(logManager.getLogs()[0].message, 'Initializing phase...');
    assert.equal(logManager.getLogs()[1].message, 'Boot sequence started');
});
