import { AudioHandle } from '../handles/AudioHandle.js';

/**
 * KernelAudioAPI
 * 
 * Layer: 1-kernel/api
 * Responsibility:
 * Stable public Kernel API for audio playback requests.
 */

export class KernelAudioAPI {
    constructor(driverManager) {
        this.driverManager = driverManager;
    }

    _getHandle() {
        const driver = this.driverManager ? this.driverManager.getDriver('audio') : null;
        return new AudioHandle(driver);
    }

    playSound(soundId) {
        return this._getHandle().play(soundId);
    }

    stopSound() {
        return this._getHandle().stop();
    }
}
