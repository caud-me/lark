import { ShellComponent } from './ShellComponent.js';
import { CommandPalette } from '../../search/CommandPalette.js';
import { EventBus } from '../../../1-kernel/SystemEventBus.js';

export class SearchSurface extends ShellComponent {
    initialize(registry, environment) {
        super.initialize(registry, environment);

        this.currentSearchAbort = null;
        this.shortcuts = [];
        this._toggleHandler = null;

        this.commandPalette = new CommandPalette({
            onSearch: async (query) => {
                if (this.currentSearchAbort) this.currentSearchAbort.abort();
                const ac = new AbortController();
                this.currentSearchAbort = ac;

                const searchService = this.registry.get('SearchService');
                if (!searchService) return;

                this.commandPalette.update([], true);

                try {
                    for await (const batch of searchService.search(query, { signal: ac.signal })) {
                        if (ac.signal.aborted) break;
                        this.commandPalette.update(batch, false);
                    }
                } catch (e) {
                    if (e.name !== 'AbortError') console.error('[SearchSurface] Search error:', e);
                }
            },
            onSelect: (result) => {
                const searchService = this.registry.get('SearchService');
                if (searchService) searchService.activate(result);
            },
            onClose: () => {
                if (this.currentSearchAbort) this.currentSearchAbort.abort();
            }
        });

        this.element = this.commandPalette.element;
    }

    resume() {
        if (!this._toggleHandler) {
            this._toggleHandler = () => {
                if (this.commandPalette) this.commandPalette.toggle();
            };
            EventBus.on('sys.shell.search.toggle', this._toggleHandler);
        }

        const shortcutService = this.registry.get('ShortcutService');
        if (shortcutService) {
            const cmdShortcut = {
                shortcut: 'Ctrl+Space',
                scope: 'GLOBAL',
                handler: () => {
                    if (this.commandPalette) this.commandPalette.toggle();
                }
            };
            shortcutService.register(cmdShortcut);
            this.shortcuts.push(cmdShortcut);
        }
    }

    suspend() {
        if (this._toggleHandler) {
            EventBus.off('sys.shell.search.toggle', this._toggleHandler);
            this._toggleHandler = null;
        }

        if (this.currentSearchAbort) {
            this.currentSearchAbort.abort();
            this.currentSearchAbort = null;
        }

        const shortcutService = this.registry.get('ShortcutService');
        if (shortcutService && this.shortcuts) {
            this.shortcuts.forEach(s => shortcutService.unregister(s));
            this.shortcuts = [];
        }
    }

    destroy() {
        super.destroy();
    }
}
