/**
 * KeyboardAdapter
 * 
 * Layer: 0-firmware
 * Responsibility:
 * Virtual hardware metadata for the system keyboard controller.
 */

export class KeyboardAdapter {
    static getMetadata() {
        return {
            id: 'dev.input.keyboard',
            name: 'Lark Virtual Keyboard Controller',
            model: 'Lark-KBD-101',
            vendor: 'Lark Technologies Inc.',
            version: '1.0.0',
            type: 'input',
            layout: 'Standard US QWERTY',
            keyboardSupported: typeof window !== 'undefined',
            status: 'ONLINE'
        };
    }
}
