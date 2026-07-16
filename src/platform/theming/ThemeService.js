import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * ThemeService
 *
 * Responsibility:
 * Public API for applying themes to the visual environment.
 * Re-renders the document when the active theme changes.
 *
 * Does NOT:
 * - Load or parse themes (ThemeRepositoryManager)
 * - Persist the active theme (UserSettingsService does this)
 */
export class ThemeService {
    constructor(themeRepositoryManager, registry) {
        this.themeRepositoryManager = themeRepositoryManager;
        this.registry = registry;

        EventBus.on('user.settings.desktop.theme.changed', (payload) => {
            if (payload.value) {
                this.applyTheme(payload.value);
            }
        });
    }

    /**
     * Refreshes metadata from all registered theme sources.
     */
    async refreshAll() {
        const allThemes = [];
        const sources = this.themeRepositoryManager.getSources();
        for (const [sourceId, source] of sources.entries()) {
            try {
                const themes = await source.fetchThemes();
                for (const theme of themes) {
                    theme.repositoryId = sourceId;
                    allThemes.push(theme);
                }
            } catch (e) {
                console.error(`[ThemeService] Failed to fetch themes from ${sourceId}`, e);
            }
        }
        this.themeRepositoryManager.setThemes(allThemes);
    }

    /**
     * Called by UserEnvironmentService to restore the user's theme.
     * @param {string} username 
     */
    async restore(username) {
        const UserSettingsService = this.registry.get('UserSettingsService');
        // Because UserSettingsService was restored right before this, we don't necessarily need username for getting the setting,
        // but passing it maintains the contract. We can just use the global setting getter assuming the session is correct.
        const currentThemeId = UserSettingsService ? UserSettingsService.getSetting('desktop.theme') : 'dark';
        this.applyTheme(currentThemeId || 'dark');
    }

    getAvailableThemes() {
        return this.themeRepositoryManager.getAllThemes();
    }

    getActiveThemeId() {
        const UserSettingsService = this.registry.get('UserSettingsService');
        return UserSettingsService ? UserSettingsService.getSetting('desktop.theme') || 'dark' : 'dark';
    }

    setActiveThemeId(themeId) {
        // Validation
        const theme = this.themeRepositoryManager.getThemeById(themeId);
        if (!theme) {
            EventBus.emit('theme.error', { severity: 'Error', source: 'ThemeService', message: `Cannot set unknown theme '${themeId}'.` });
            return;
        }
        
        const UserSettingsService = this.registry.get('UserSettingsService');
        if (UserSettingsService) {
            UserSettingsService.setSetting('desktop.theme', themeId);
        }
    }

    applyTheme(themeId) {
        const theme = this.themeRepositoryManager.getThemeById(themeId);
        if (!theme) {
            EventBus.emit('theme.error', { severity: 'Error', source: 'ThemeService', message: `Theme '${themeId}' not found.` });
            return;
        }

        if (theme.variables) {
            for (const [key, value] of Object.entries(theme.variables)) {
                document.documentElement.style.setProperty(key, value);
            }
        }

        EventBus.emit('theme.changed', {
            severity: 'Info',
            source: 'ThemeService',
            message: `Applied theme: ${theme.title || themeId}`,
            data: { themeId }
        });
    }
}
