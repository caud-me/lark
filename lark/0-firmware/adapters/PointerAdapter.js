/**
 * PointerAdapter
 * 
 * Layer: 0-firmware
 * Responsibility:
 * Virtual hardware metadata for the precision pointer controller.
 */

export class PointerAdapter {
    static getMetadata() {
        const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        return {
            id: 'dev.input.pointer',
            name: 'Lark Precision Pointer Device',
            model: 'Lark-PTR-HD',
            vendor: 'Lark Technologies Inc.',
            version: '1.2.0',
            type: 'input',
            touchSupported: touch,
            status: 'ONLINE'
        };
    }
}
