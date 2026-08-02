/**
 * AudioHandle
 * 
 * Layer: 1-kernel/handles
 * Responsibility:
 * Abstract kernel device handle representing an audio synthesizer contract.
 */

export class AudioHandle {
    constructor(driver) {
        this.driver = driver;
        this.handleId = `hnd.audio.${Date.now().toString(36)}`;
    }

    play(soundId) {
        return this.driver ? this.driver.play(soundId) : false;
    }

    stop() {
        return this.driver ? this.driver.stop() : false;
    }
}
