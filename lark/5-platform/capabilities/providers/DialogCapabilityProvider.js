import { CapabilityProvider } from './CapabilityProvider.js';

/**
 * DialogCapabilityProvider
 *
 * Responsibility:
 * Adapts the internal DialogService for public OS consumption.
 */
export class DialogCapabilityProvider extends CapabilityProvider {
    constructor(dialogService) {
        super();
        this.dialogService = dialogService;
    }

    getName() {
        return 'DialogCapabilityProvider';
    }

    async alert(message, title = 'Alert') {
        return this.dialogService.alert(message, title);
    }

    async confirm(message, title = 'Confirm') {
        return this.dialogService.confirm(message, title);
    }
    
    async prompt(message, title = 'Prompt', defaultValue = '') {
        return this.dialogService.prompt(message, defaultValue, title);
    }

    async openFile(options = {}) {
        return this.dialogService.openFile(options);
    }

    async saveFile(options = {}) {
        return this.dialogService.saveFile(options);
    }
}
