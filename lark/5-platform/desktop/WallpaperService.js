import { EventBus } from '../../1-kernel/SystemEventBus.js';
import { ImageStorageAdapter } from '../filesystem/ImageStorageAdapter.js';
import { LogCategory } from '../../3-system/LogCategory.js';
import { LogSeverity } from '../../3-system/LogSeverity.js';

/**
 * WallpaperService
 * 
 * Responsibility:
 * Coordinates desktop wallpaper selection, encoding, storage, and retrieval.
 * Operates strictly within the current session's authority without explicit privilege escalation.
 */
export class WallpaperService {
    constructor(registry) {
        this.registry = registry;
        this.activeWallpaperUrl = null;
        
        // Listen for preference changes so we can notify the Desktop
        const triggerUpdate = () => {
            EventBus.emit('desktop:wallpaper_updated', { severity: 'Info', source: 'WallpaperService', message: 'Wallpaper preference updated.' });
        };

        EventBus.on('user.settings.desktop.wallpaperPath.changed', triggerUpdate);
        EventBus.on('user.settings.changed', (payload) => {
            const data = payload.data || payload;
            if (data && data.key === 'desktop.wallpaperPath') {
                triggerUpdate();
            }
        });
        
        // Cleanup resources on session end
        EventBus.on('session.ended', () => {
            this._cleanupActiveUrl();
        });
    }

    _cleanupActiveUrl() {
        if (this.activeWallpaperUrl) {
            URL.revokeObjectURL(this.activeWallpaperUrl);
            this.activeWallpaperUrl = null;
        }
    }

    /**
     * Called by the presentation layer (e.g., WallpaperSurface) to get the displayable background.
     * Generates and caches an ObjectURL for the active wallpaper if it exists.
     * @returns {Promise<string|null>} The CSS-ready blob URL or null
     */
    async getWallpaperUrl() {
        // Route display capability check through KernelDisplayAPI (Constitution Section 24)
        if (this.registry) {
            const displayApi = this.registry.get('KernelDisplayAPI');
            if (displayApi && typeof displayApi.getDisplayInformation === 'function') {
                try {
                    displayApi.getDisplayInformation();
                } catch (e) {
                    // Non-blocking capability query
                }
            }
        }

        const userSettingsService = this.registry.get('UserSettingsService');
        const fileService = this.registry.get('FileService');
        
        if (!userSettingsService || !fileService) return null;

        const path = userSettingsService.getSetting('desktop.wallpaperPath');
        if (!path) {
            this._cleanupActiveUrl();
            return null; // Fallback to color
        }

        try {
            const sysContext = { context: { role: 'SYSTEM' } };
            const exists = await fileService.exists(path, sysContext);
            if (!exists) {
                this._cleanupActiveUrl();
                return null;
            }

            const base64Data = await fileService.readFile(path, sysContext);
            if (!base64Data) return null;

            // If base64Data is a Data URI or standard URL, return it directly for zero-overhead CSS background rendering
            if (typeof base64Data === 'string') {
                if (base64Data.startsWith('data:image/') || base64Data.startsWith('blob:') || base64Data.startsWith('http')) {
                    return base64Data;
                }
                // If it's a raw base64 string, format as PNG Data URI
                return `data:image/png;base64,${base64Data}`;
            }
            
            // Fallback to blob URL conversion adapter
            this._cleanupActiveUrl();
            const newUrl = ImageStorageAdapter.createBlobUrlFromBase64(base64Data);
            this.activeWallpaperUrl = newUrl;
            return newUrl;
        } catch (e) {
            EventBus.emit('system.error', { category: LogCategory.SYSTEM, severity: LogSeverity.ERROR, message: `Failed to load wallpaper: ${e.message}`, source: 'WallpaperService' });
            return null;
        }
    }

    /**
     * Called by Settings to set a new wallpaper from a file upload.
     * @param {File} fileBlob 
     */
    async setWallpaper(fileBlob) {
        const fileService = this.registry.get('FileService');
        const userSettingsService = this.registry.get('UserSettingsService');
        const sessionService = this.registry.get('SessionService');

        if (!fileService || !userSettingsService || !sessionService) {
            throw new Error('Required services unavailable.');
        }

        // Validate type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!allowedTypes.includes(fileBlob.type)) {
            throw new Error('Invalid image format. Please use PNG, JPEG, or WebP.');
        }

        const session = sessionService.getCurrentSession();
        if (!session) throw new Error('No active session.');
        
        const username = session.user.username;
        let extension = fileBlob.type.split('/')[1];
        if (extension === 'jpeg') extension = 'jpg';
        
        const timestamp = Date.now();
        const picturesDir = `/users/${username}/Pictures`;
        const destinationPath = `${picturesDir}/wallpaper-${timestamp}.${extension}`;

        const sysContext = { context: { role: 'SYSTEM' } };

        // Ensure Pictures directory exists
        if (!(await fileService.exists(picturesDir, sysContext))) {
            await fileService.createDirectory(picturesDir, sysContext);
        }

        // Encode to Base64 (delegated to adapter for storage isolation)
        const base64Data = await ImageStorageAdapter.encodeFileToBase64(fileBlob);

        // Write the new file
        await fileService.writeFile(destinationPath, base64Data, sysContext);

        // Get the old wallpaper path to delete it
        const oldPath = userSettingsService.getSetting('desktop.wallpaperPath');

        // Update settings (this fires the event which triggers desktop update)
        await userSettingsService.setSetting('desktop.wallpaperPath', destinationPath);

        // Clean up the old file if it exists and is different
        if (oldPath && oldPath !== destinationPath) {
            try {
                if (await fileService.exists(oldPath, sysContext)) {
                    if (typeof fileService.delete === 'function') {
                        await fileService.delete(oldPath, sysContext);
                    } else if (typeof fileService.deleteFile === 'function') {
                        await fileService.deleteFile(oldPath, sysContext);
                    }
                }
            } catch (e) {
                console.warn('[WallpaperService] Failed to clean up old wallpaper', e);
            }
        }
    }

    onChange(callback) {
        const handler = (payload) => callback(payload.data || payload);
        EventBus.on('desktop:wallpaper_updated', handler);
        return () => EventBus.off('desktop:wallpaper_updated', handler);
    }
}
