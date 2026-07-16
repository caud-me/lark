import { EventBus } from '../../kernel/SystemEventBus.js';
import { ApplicationSearchProvider } from './providers/ApplicationSearchProvider.js';
import { SessionSearchProvider } from './providers/SessionSearchProvider.js';
import { IntentSearchProvider } from './providers/IntentSearchProvider.js';

/**
 * SearchService
 *
 * Responsibility:
 * Orchestrates system-wide search. Acts as a registry for Search Providers
 * and exposes an async iterator to stream results back to the caller.
 *
 * Does NOT:
 * - Implement UI rendering
 * - Perform domain-specific search logic
 */
export class SearchService {
    constructor(extensionService, serviceRegistry) {
        this.providers = [];
        this.extensionService = extensionService;
        this.serviceRegistry = serviceRegistry;

        EventBus.on('extensions.changed', () => this.loadProviders());
    }

    /**
     * Dynamically loads search providers from the ExtensionService.
     */
    async loadProviders() {
        const extensions = this.extensionService.getExtensions('search-provider');
        this.providers = []; // clear old providers
        this.registerProvider(new ApplicationSearchProvider(this.serviceRegistry));
        this.registerProvider(new SessionSearchProvider(this.serviceRegistry));
        this.registerProvider(new IntentSearchProvider(this.serviceRegistry));

        for (const ext of extensions) {
            try {
                // Dynamically import the entryPoint
                let entryPoint = ext.entryPoint;
                if (entryPoint.startsWith('/')) {
                    entryPoint = entryPoint.substring(1);
                }
                const url = new URL(entryPoint, window.LDE_BASE_URL).href;
                const module = await import(url);
                
                // Assuming the provider is exported by name (e.g. ApplicationSearchProvider)
                // or as default. We'll search for the first exported class.
                let ProviderClass = module.default;
                if (!ProviderClass) {
                    for (const key of Object.keys(module)) {
                        if (typeof module[key] === 'function') {
                            ProviderClass = module[key];
                            break;
                        }
                    }
                }

                if (ProviderClass) {
                    const provider = new ProviderClass(this.serviceRegistry);
                    this.registerProvider(provider);
                }
            } catch (e) {
                console.error(`[SearchService] Failed to load provider from ${ext.entryPoint}`, e);
            }
        }
    }

    /**
     * Registers a new Search Provider.
     * @param {SearchProvider} provider
     */
    registerProvider(provider) {
        if (!provider || !provider.metadata || typeof provider.search !== 'function') {
            console.warn('[SearchService] Attempted to register invalid provider.');
            return;
        }
        this.providers.push(provider);
        this.providers.sort((a, b) => (b.metadata.priority || 0) - (a.metadata.priority || 0));
    }

    /**
     * Executes a search across all enabled providers.
     * Yields batches of results as they become available.
     * 
     * @param {string} query - The search query
     * @param {object} options - Search options { signal: AbortSignal }
     * @returns {AsyncGenerator<Array>} - Yields arrays of PaletteResults
     */
    async *search(query, options = {}) {
        if (!query || query.trim() === '') return;
        const signal = options.signal || { aborted: false };

        EventBus.emit('search.started', {
            severity: 'Info',
            source: 'SearchService',
            message: `Search started: "${query}"`
        });

        const activeProviders = this.providers.filter(p => p.metadata.enabled !== false);
        if (activeProviders.length === 0) {
            EventBus.emit('search.completed', {
                severity: 'Info',
                source: 'SearchService',
                message: `Search completed: "${query}" (no providers)`
            });
            return;
        }

        // Start all provider searches concurrently
        const pending = activeProviders.map(provider => {
            return Promise.resolve()
                .then(() => provider.search(query, signal))
                .then(results => ({ provider, results: results || [] }))
                .catch(err => {
                    console.error(`[SearchService] Provider ${provider.metadata.id} failed:`, err);
                    return { provider, results: [] };
                });
        });

        const inProgress = new Set(pending);

        try {
            while (inProgress.size > 0) {
                if (signal.aborted) break;

                // Wait for the next provider to finish
                const nextResult = await Promise.race(
                    Array.from(inProgress).map(p => p.then(res => ({ promise: p, result: res })))
                );

                inProgress.delete(nextResult.promise);

                if (signal.aborted) break;

                if (nextResult.result.results.length > 0) {
                    // Normalize results by injecting the providerId so the caller
                    // knows which provider generated each result
                    const normalized = nextResult.result.results.map(r => ({
                        ...r,
                        providerId: nextResult.result.provider.metadata.id
                    }));
                    yield normalized;
                }
            }
        } finally {
            // Always emit search.completed, even if aborted or an error occurs
            EventBus.emit('search.completed', {
                severity: 'Info',
                source: 'SearchService',
                message: `Search completed: "${query}"`
            });
        }
    }

    /**
     * Delegates activation to the provider that generated the result.
     * @param {PaletteResult} result 
     */
    activate(result) {
        if (!result || !result.providerId) return;
        const provider = this.providers.find(p => p.metadata.id === result.providerId);
        if (provider && typeof provider.activate === 'function') {
            provider.activate(result);
        } else {
            console.warn(`[SearchService] Cannot activate result: Provider ${result.providerId} not found or missing activate()`);
        }
    }
}
