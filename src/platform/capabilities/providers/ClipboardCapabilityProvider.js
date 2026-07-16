import { CapabilityProvider } from './CapabilityProvider.js';

/**
 * ClipboardCapabilityProvider
 *
 * Responsibility:
 * Adapts the internal ClipboardService for public OS consumption.
 */
export class ClipboardCapabilityProvider extends CapabilityProvider {
    constructor(clipboardService) {
        super();
        this.clipboardService = clipboardService;
    }

    getName() {
        return 'ClipboardCapabilityProvider';
    }

    async readText() {
        return this.clipboardService.readText();
    }

    async writeText(text) {
        return this.clipboardService.writeText(text);
    }
}
