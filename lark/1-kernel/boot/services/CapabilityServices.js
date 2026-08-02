import { CapabilityRegistry } from '../../../5-platform/capabilities/CapabilityRegistry.js';
import { CapabilityService } from '../../../5-platform/capabilities/CapabilityService.js';
import { NetworkCapabilityProvider } from '../../../5-platform/capabilities/providers/NetworkCapabilityProvider.js';
import { DialogCapabilityProvider } from '../../../5-platform/capabilities/providers/DialogCapabilityProvider.js';
import { NotificationCapabilityProvider } from '../../../5-platform/capabilities/providers/NotificationCapabilityProvider.js';
import { ClipboardCapabilityProvider } from '../../../5-platform/capabilities/providers/ClipboardCapabilityProvider.js';
import { ProcessCapabilityProvider } from '../../../5-platform/capabilities/providers/ProcessCapabilityProvider.js';

/**
 * CapabilityServices
 * 
 * Layer: 1-kernel/boot/services
 * Responsibility:
 * Instantiates CapabilityRegistry and capability providers (network, dialogs, notifications, clipboard, processes).
 */
export class CapabilityServices {
    static async run(ctx) {
        const capabilityRegistry = new CapabilityRegistry();
        capabilityRegistry.register('network', new NetworkCapabilityProvider(ctx.serviceRegistry.get('NetworkService'), ctx.serviceRegistry.get('DownloadService')));
        capabilityRegistry.register('dialogs', new DialogCapabilityProvider(ctx.serviceRegistry.get('DialogService')));
        capabilityRegistry.register('notifications', new NotificationCapabilityProvider(ctx.serviceRegistry));
        capabilityRegistry.register('clipboard', new ClipboardCapabilityProvider(ctx.serviceRegistry.get('ClipboardService')));
        capabilityRegistry.register('processes', new ProcessCapabilityProvider(ctx.serviceRegistry.get('ProcessService'), ctx.serviceRegistry.get('SecurityService')));

        const capabilityService = new CapabilityService(capabilityRegistry);
        ctx.serviceRegistry.register('CapabilityService', capabilityService);
    }
}
