import { DesktopEnvironmentService } from '../../../5-platform/desktop/DesktopEnvironmentService.js';
import { StartupApplicationOrchestrator } from '../../../5-platform/desktop/StartupApplicationOrchestrator.js';
import { WallpaperService } from '../../../5-platform/desktop/WallpaperService.js';
import { WidgetRegistry } from '../../../5-platform/widgets/WidgetRegistry.js';
import { SearchService } from '../../../5-platform/search/SearchService.js';
import { ShutdownOrchestrator } from '../../../5-platform/boot/ShutdownOrchestrator.js';
import { InputPolicy } from '../../../4-policies/InputPolicy.js';
import { PresentationEffectsService } from '../../../5-platform/graphics/PresentationEffectsService.js';

/**
 * DesktopServices
 * 
 * Layer: 1-kernel/boot/services
 * Responsibility:
 * Instantiates desktop environment, wallpaper, presentation effects, widget registry, search, and input policy services.
 */
export class DesktopServices {
    static async run(ctx) {
        ctx.serviceRegistry.register('WidgetRegistry', new WidgetRegistry());

        const presentationEffectsService = new PresentationEffectsService(ctx.serviceRegistry);
        ctx.serviceRegistry.register('PresentationEffectsService', presentationEffectsService);
        ctx.serviceRegistry.register('sys.presentationeffects', presentationEffectsService);

        const desktopEnvService = new DesktopEnvironmentService(ctx.serviceRegistry);
        ctx.serviceRegistry.register('DesktopEnvironmentService', desktopEnvService);

        ctx.serviceRegistry.register('ShutdownOrchestrator', new ShutdownOrchestrator(ctx.serviceRegistry));
        ctx.serviceRegistry.register('StartupApplicationOrchestrator', new StartupApplicationOrchestrator(ctx.serviceRegistry));
        ctx.serviceRegistry.register('WallpaperService', new WallpaperService(ctx.serviceRegistry));

        const searchService = new SearchService(ctx.serviceRegistry.get('ExtensionService'), ctx.serviceRegistry);
        ctx.serviceRegistry.register('SearchService', searchService);
        searchService.loadProviders();

        // Install input routing policy
        new InputPolicy(ctx.serviceRegistry);
    }
}
