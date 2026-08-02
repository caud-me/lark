/**
 * DisplayAdapter
 * 
 * Layer: 0-firmware
 * Responsibility:
 * Virtual hardware metadata and POST probing for the display controller.
 */

export class DisplayAdapter {
    static getMetadata() {
        return {
            id: 'dev.display.primary',
            name: 'Lark Virtual Graphics Array (VGA-v2)',
            model: 'Lark-VGA-2000',
            vendor: 'Lark Technologies Inc.',
            version: '2.4.0',
            type: 'display',
            width: window.innerWidth || 1920,
            height: window.innerHeight || 1080,
            pixelRatio: window.devicePixelRatio || 1,
            colorDepth: 24,
            canvasSupported: !!document.createElement('canvas').getContext,
            status: 'ONLINE'
        };
    }
}
