/**
 * AudioAdapter
 * 
 * Layer: 0-firmware
 * Responsibility:
 * Virtual hardware metadata for the virtual audio synthesizer controller.
 */

export class AudioAdapter {
    static getMetadata() {
        const audioSupported = typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined';
        return {
            id: 'dev.audio.primary',
            name: 'Lark Virtual High Definition Audio Synthesizer',
            model: 'Lark-AUD-HD',
            vendor: 'Lark Technologies Inc.',
            version: '1.0.0',
            type: 'audio',
            webAudioSupported: audioSupported,
            status: audioSupported ? 'ONLINE' : 'DEGRADED'
        };
    }
}
