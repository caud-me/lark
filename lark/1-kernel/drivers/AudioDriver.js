import { BaseDriver } from './BaseDriver.js';

/**
 * AudioDriver
 * 
 * Layer: 1-kernel/drivers
 * Responsibility:
 * Kernel driver for virtual high definition audio synthesizer (dev.audio.primary).
 * Optional driver: Failure to initialize degrades gracefully without blocking OS startup.
 */

export class AudioDriver extends BaseDriver {
    constructor() {
        super('Lark Virtual HD Audio Driver', 'audio', 'dev.audio.primary', false);
    }

    async initialize(deviceMetadata) {
        if (!deviceMetadata || !deviceMetadata.webAudioSupported) {
            this.status = 'DISABLED';
            this.error = 'Web Audio API context unavailable on host environment.';
            return false;
        }

        this.device = deviceMetadata;
        this.status = 'LOADED';
        this.error = null;
        console.log(`[Kernel:Driver] ${this.name} successfully bound to ${deviceMetadata.name}`);
        return true;
    }

    isEnabled() {
        return this.isLoaded() && this.status === 'LOADED';
    }

    play(soundId) {
        if (!this.isEnabled()) return false;
        return true;
    }

    stop() {
        if (!this.isEnabled()) return false;
        return true;
    }
}
