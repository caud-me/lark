/**
 * WorkspaceTabs
 *
 * Release 27.8.14 — Reusable Workspace Tabs Framework (Phase 1)
 *
 * Layer: 9-ui
 * Responsibility:
 * Headless & visual tab manager for multi-document application workspaces.
 * Manages active tab state, tab creation, activation, renaming, dirty indicators,
 * and rendering of the generic Omni tab strip.
 *
 * Does NOT:
 * - Own application content or editor logic
 * - Handle disk persistence or window creation
 */
export class WorkspaceTabs {
    /**
     * @param {Object} options
     * @param {Function} [options.onTabSelect] - Callback when active tab changes: (tab) => void
     * @param {Function} [options.onTabClose] - Callback when tab close requested: (tab) => Promise<boolean>|boolean
     * @param {Function} [options.onTabAdd] - Callback when '+' add tab clicked: () => void
     */
    constructor(options = {}) {
        this.onTabSelect = options.onTabSelect || (() => {});
        this.onTabClose = options.onTabClose || (() => true);
        this.onTabAdd = options.onTabAdd || null;

        this.tabs = [];
        this.activeTabId = null;
        this.element = null;
    }

    /**
     * Adds a new tab to the workspace and activates it.
     * @param {Object} tabData - { id?, title, path?, content?, dirty?, metadata? }
     * @returns {Object} Created tab object
     */
    addTab(tabData = {}) {
        const id = tabData.id || `tab_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const tab = {
            id,
            title: tabData.title || 'Untitled',
            path: tabData.path || null,
            content: tabData.content !== undefined ? tabData.content : '',
            dirty: Boolean(tabData.dirty),
            metadata: tabData.metadata || {}
        };

        this.tabs.push(tab);
        this.activateTab(id);
        this.render();
        return tab;
    }

    /**
     * Activates the tab matching tabId.
     * @param {string} tabId 
     */
    activateTab(tabId) {
        const target = this.tabs.find(t => t.id === tabId);
        if (!target) return;

        this.activeTabId = tabId;
        this.render();
        this.onTabSelect(target);
    }

    /**
     * Closes the tab matching tabId after invoking onTabClose guard.
     * @param {string} tabId 
     */
    async closeTab(tabId) {
        const index = this.tabs.findIndex(t => t.id === tabId);
        if (index === -1) return;

        const targetTab = this.tabs[index];
        const canClose = await this.onTabClose(targetTab);
        if (canClose === false) return;

        this.tabs.splice(index, 1);

        if (this.activeTabId === tabId) {
            if (this.tabs.length > 0) {
                const nextIndex = Math.min(index, this.tabs.length - 1);
                this.activateTab(this.tabs[nextIndex].id);
            } else {
                this.activeTabId = null;
                this.onTabSelect(null);
            }
        }

        this.render();
    }

    /**
     * Updates properties of an existing tab.
     * @param {string} tabId 
     * @param {Object} partialData - { title?, dirty?, path?, content?, metadata? }
     */
    updateTab(tabId, partialData = {}) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;

        if (partialData.title !== undefined) tab.title = partialData.title;
        if (partialData.dirty !== undefined) tab.dirty = Boolean(partialData.dirty);
        if (partialData.path !== undefined) tab.path = partialData.path;
        if (partialData.content !== undefined) tab.content = partialData.content;
        if (partialData.metadata !== undefined) tab.metadata = { ...tab.metadata, ...partialData.metadata };

        this.render();
    }

    /**
     * Returns the currently active tab.
     * @returns {Object|null}
     */
    getActiveTab() {
        return this.tabs.find(t => t.id === this.activeTabId) || null;
    }

    /**
     * Returns a tab matching path.
     * @param {string} path 
     * @returns {Object|null}
     */
    getTabByPath(path) {
        if (!path) return null;
        return this.tabs.find(t => t.path === path) || null;
    }

    /**
     * Renders the tab strip DOM container.
     * @returns {HTMLElement}
     */
    render() {
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.className = 'omni-tab-strip';
        }

        this.element.innerHTML = '';

        const tabsListContainer = document.createElement('div');
        tabsListContainer.className = 'omni-tab-list';

        this.tabs.forEach(tab => {
            const isActive = tab.id === this.activeTabId;
            const btn = document.createElement('div');
            btn.className = `omni-tab-button${isActive ? ' active' : ''}${tab.dirty ? ' dirty' : ''}`;
            btn.dataset.tabId = tab.id;

            const titleSpan = document.createElement('span');
            titleSpan.className = 'omni-tab-title';
            titleSpan.textContent = tab.title;

            const dirtyIndicator = document.createElement('span');
            dirtyIndicator.className = 'omni-tab-dirty-dot';
            dirtyIndicator.textContent = '●';

            const closeBtn = document.createElement('i');
            closeBtn.className = 'omni-tab-close';
            closeBtn.innerHTML = '&#xE711;'; // Segoe Fluent Icons close cross
            closeBtn.title = 'Close Tab';

            closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.closeTab(tab.id);
            };

            btn.onclick = () => {
                if (this.activeTabId !== tab.id) {
                    this.activateTab(tab.id);
                }
            };

            btn.appendChild(titleSpan);
            if (tab.dirty) {
                btn.appendChild(dirtyIndicator);
            }
            btn.appendChild(closeBtn);
            tabsListContainer.appendChild(btn);
        });

        this.element.appendChild(tabsListContainer);

        if (this.onTabAdd) {
            const addBtn = document.createElement('button');
            addBtn.className = 'omni-tab-add';
            addBtn.innerHTML = '&#xE710;'; // Segoe Fluent Icons plus
            addBtn.title = 'New Tab';
            addBtn.onclick = () => this.onTabAdd();
            this.element.appendChild(addBtn);
        }

        return this.element;
    }
}
