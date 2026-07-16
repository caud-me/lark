export class ThemeRepositoryManager {
    constructor() {
        this.sources = new Map();
        this.themesCache = new Map(); // themeId -> theme object
        this.lastRefresh = null;
    }

    registerSource(sourceId, sourceInstance) {
        this.sources.set(sourceId, sourceInstance);
    }

    getSources() {
        return this.sources;
    }

    setThemes(themes) {
        this.themesCache.clear();
        for (const theme of themes) {
            this.themesCache.set(theme.id, theme);
        }
        this.lastRefresh = new Date();
    }

    getAllThemes() {
        return Array.from(this.themesCache.values());
    }

    getThemeById(themeId) {
        return this.themesCache.get(themeId) || null;
    }
}
