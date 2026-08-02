/**
 * TestHelpers
 * 
 * Provides framework-agnostic mocks and utilities for testing LDE components.
 * Independent of Jest, Mocha, or Vitest.
 */

export class MockWindow {
    constructor(config) {
        this.config = config;
        this.content = document.createElement('div');
        this.content.className = 'mock-window-content';
    }

    setTitle(title) {
        this.config.title = title;
    }

    close() {}
}

export class MockCapabilityService {
    constructor() {
        this.handlers = new Map();
    }

    mock(capability, handler) {
        this.handlers.set(capability, handler);
    }

    async invoke(capability, args) {
        if (this.handlers.has(capability)) {
            return await this.handlers.get(capability)(args);
        }
        return null;
    }
}

export class MockEventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, payload) {
        if (this.listeners.has(event)) {
            for (const cb of this.listeners.get(event)) {
                cb(payload);
            }
        }
    }
}

export class MockExecutionContext {
    constructor() {
        this.window = {
            create: async (config) => new MockWindow(config)
        };
        this.capabilities = new MockCapabilityService();
        this.events = new MockEventBus();
    }
}
