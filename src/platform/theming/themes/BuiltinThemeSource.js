export class BuiltinThemeSource {
    constructor() {
        this.builtinThemes = [
            'dark',
            'light'
        ];
    }

    async fetchThemes() {
        const themes = [];
        for (const id of this.builtinThemes) {
            try {
                // Since this runs in a browser ES module environment (like Vite or standard server),
                // we can fetch the JSON assets directly from the repository.
                const res = await fetch(new URL(`src/platform/theming/themes/${id}.ldetheme`, window.LDE_BASE_URL).href);
                if (res.ok) {
                    const themeData = await res.json();
                    themes.push(themeData);
                }
            } catch (e) {
                console.error(`Failed to load builtin theme: ${id}`, e);
            }
        }
        return themes;
    }
}
