/**
 * CommandPalette
 * 
 * Responsibility:
 * Pure UI component. Renders the command palette search input and results.
 * Handles keyboard navigation and incremental result rendering.
 */
export class CommandPalette {
    constructor(callbacks = {}) {
        this.callbacks = {
            onSearch: callbacks.onSearch || (() => {}),
            onSelect: callbacks.onSelect || (() => {}),
            onClose: callbacks.onClose || (() => {})
        };

        this.element = document.createElement('div');
        this.element.className = 'lde-command-palette-overlay';
        this.element.style.display = 'none';

        this.container = document.createElement('div');
        this.container.className = 'lde-command-palette-container';

        this.inputWrapper = document.createElement('div');
        this.inputWrapper.className = 'lde-command-palette-input-wrapper';
        this.inputWrapper.style.position = 'relative';

        this.ghostElement = document.createElement('div');
        this.ghostElement.className = 'lde-command-palette-ghost';

        this.searchInput = document.createElement('input');
        this.searchInput.className = 'lde-command-palette-input';
        this.searchInput.placeholder = 'Search Lark OS';
        this.searchInput.setAttribute('aria-label', 'Spotlight Search');
        this.searchInput.style.position = 'relative';
        this.searchInput.style.zIndex = '1';

        this.inputWrapper.appendChild(this.ghostElement);
        this.inputWrapper.appendChild(this.searchInput);

        this.resultsContainer = document.createElement('div');
        this.resultsContainer.className = 'lde-command-palette-results';

        this.container.appendChild(this.inputWrapper);
        this.container.appendChild(this.resultsContainer);
        this.element.appendChild(this.container);

        this.results = [];
        this.selectedIndex = -1;
        this.query = '';
        this.isBackspace = false;

        this._bindEvents();
    }

    _bindEvents() {
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) this.close();
        });

        this.searchInput.addEventListener('input', (e) => {
            this.query = e.target.value;
            this.isBackspace = e.inputType === 'insertText' ? false : (e.inputType === 'deleteContentBackward' || this.isBackspace);
            this.callbacks.onSearch(this.query);
        });

        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                this.isBackspace = true;
            }
            if (e.key === 'ArrowRight' || e.key === 'Tab') {
                // Accept ghost autofill if it exists
                if (this.ghostElement.textContent && this.ghostElement.textContent.length > this.searchInput.value.length) {
                    e.preventDefault();
                    this.searchInput.value = this.ghostElement.textContent;
                    this.query = this.searchInput.value;
                    this.ghostElement.textContent = '';
                    this.callbacks.onSearch(this.query);
                }
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                this.close();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this._moveSelection(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this._moveSelection(-1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this._selectCurrent();
            }
        });
    }

    open() {
        this.element.style.display = 'flex';
        this.searchInput.value = '';
        this.query = '';
        this.results = [];
        this.displayResults = [];
        this.selectedIndex = -1;
        this.ghostElement.textContent = '';
        this._renderResults();
        
        // Timeout ensures the element is visible before focusing
        setTimeout(() => this.searchInput.focus(), 10);
        this.callbacks.onSearch(''); // Trigger default search (e.g., Session items)
    }

    close() {
        this.element.style.display = 'none';
        this.callbacks.onClose();
    }

    toggle() {
        if (this.element.style.display === 'none') {
            this.open();
        } else {
            this.close();
        }
    }

    /**
     * Incrementally updates the results list.
     * @param {Array} newResults 
     * @param {boolean} clear - If true, clears existing results.
     */
    update(newResults, clear = false) {
        if (clear) {
            this.results = [...newResults];
        } else {
            // Append and re-sort by score
            this.results = [...this.results, ...newResults];
            this.results.sort((a, b) => b.score - a.score);
        }

        // Grouping logic for display order
        const groups = {};
        this.results.forEach(r => {
            if (!groups[r.providerId]) groups[r.providerId] = [];
            groups[r.providerId].push(r);
        });

        // Flatten grouped results to maintain a consistent 1D array for selection
        this.displayResults = [];
        for (const [providerId, items] of Object.entries(groups)) {
            this.displayResults.push(...items);
        }
        
        if (this.selectedIndex >= this.displayResults.length) {
            this.selectedIndex = this.displayResults.length > 0 ? 0 : -1;
        } else if (this.selectedIndex === -1 && this.displayResults.length > 0) {
            this.selectedIndex = 0;
        }

        this._renderResults();

        // Autofill logic (Ghost Text)
        this.ghostElement.textContent = '';
        if (!this.isBackspace && this.displayResults.length > 0 && this.query.trim().length > 0) {
            const firstTitle = this.displayResults[0].title;
            const isUnmodified = this.searchInput.value.toLowerCase() === this.query.toLowerCase();
            
            if (firstTitle.toLowerCase().startsWith(this.query.toLowerCase()) && isUnmodified) {
                // Preserve the exact casing typed by the user, append the rest
                const originalLength = this.query.length;
                this.ghostElement.textContent = this.searchInput.value + firstTitle.substring(originalLength);
            }
        }
    }

    _moveSelection(delta) {
        if (this.displayResults.length === 0) return;
        this.selectedIndex += delta;
        if (this.selectedIndex < 0) this.selectedIndex = 0;
        if (this.selectedIndex >= this.displayResults.length) this.selectedIndex = this.displayResults.length - 1;
        this._updateSelectionUI();
    }

    _selectCurrent() {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.displayResults.length) {
            const selected = this.displayResults[this.selectedIndex];
            this.callbacks.onSelect(selected);
            this.close();
        }
    }

    _updateSelectionUI() {
        const items = this.resultsContainer.querySelectorAll('.lde-command-palette-item');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    _renderResults() {
        this.resultsContainer.innerHTML = '';
        
        if (this.displayResults.length === 0) {
            if (this.query.trim() !== '') {
                const empty = document.createElement('div');
                empty.className = 'lde-command-palette-empty';
                empty.textContent = 'No results found.';
                this.resultsContainer.appendChild(empty);
            }
            return;
        }

        // displayResults is already ordered by provider (see update()).
        // We render a section header whenever the provider changes.
        let currentProviderId = null;

        for (let i = 0; i < this.displayResults.length; i++) {
            const item = this.displayResults[i];

            // Render a new section header when we cross into a different provider's results
            if (item.providerId !== currentProviderId) {
                currentProviderId = item.providerId;
                const header = document.createElement('div');
                header.className = 'lde-command-palette-header';
                header.textContent = item.providerId.charAt(0).toUpperCase() + item.providerId.slice(1);
                this.resultsContainer.appendChild(header);
            }

            const itemEl = document.createElement('div');
            itemEl.className = 'lde-command-palette-item';
            if (i === this.selectedIndex) {
                itemEl.classList.add('selected');
                setTimeout(() => itemEl.scrollIntoView({ block: 'nearest' }), 0);
            }

            const content = document.createElement('div');
            content.className = 'lde-command-palette-item-content';

            const title = document.createElement('div');
            title.className = 'lde-command-palette-item-title';
            title.textContent = item.title;

            content.appendChild(title);

            if (item.subtitle) {
                const subtitle = document.createElement('div');
                subtitle.className = 'lde-command-palette-item-subtitle';
                subtitle.textContent = item.subtitle;
                content.appendChild(subtitle);
            }

            itemEl.appendChild(content);

            // Capture the index so the closures below refer to the correct item
            const capturedIndex = i;
            itemEl.addEventListener('mouseenter', () => {
                this.selectedIndex = capturedIndex;
                this._updateSelectionUI();
            });

            itemEl.addEventListener('click', () => {
                this.callbacks.onSelect(item);
                this.close();
            });

            this.resultsContainer.appendChild(itemEl);
        }
    }
}
