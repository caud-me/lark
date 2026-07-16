export class FileSearchProvider {
    constructor(registry) {
        this.registry = registry;
        this.metadata = {
            id: 'files',
            label: 'Files',
            priority: 40,
            enabled: true
        };
    }

    async search(query, signal) {
        const fileService = this.registry.get('FileService');
        if (!fileService) return [];

        const q = query.toLowerCase();
        
        // This is a naive deep search for demonstration.
        // A true FileSearchProvider would likely rely on an indexed database.
        const results = [];
        
        const traverse = (path) => {
            if (signal && signal.aborted) return;
            if (!fileService.exists(path)) return;
            if (!fileService.canAccess(path, 'read')) return;

            const name = path === '/' ? 'root' : path.split('/').pop();
            const lowerName = name.toLowerCase();
            let score = 0;
            if (lowerName === q) score = 85;
            else if (lowerName.startsWith(q)) score = 65;
            else if (lowerName.includes(q)) score = 45;

            const isDir = fileService.isDirectory(path);
            const type = isDir ? 'directory' : 'file';
            const extMatch = !isDir ? name.match(/\.[^/.]+$/) : null;
            const extension = extMatch ? extMatch[0].toLowerCase() : null;
            
            // Get last modified if available (mocked if not supported by LRFS yet)
            let lastModified = null;
            try {
                const meta = fileService.lrfs.getMetadata(path);
                if (meta && meta.lastModified) lastModified = meta.lastModified;
            } catch(e) {}

            if (score > 0) {
                results.push({
                    id: path,
                    title: name,
                    subtitle: path,
                    icon: isDir ? '📁' : '📄',
                    score,
                    type,
                    extension,
                    lastModified,
                    searchable: true,
                    action: { path }
                });
            }

            // Limit depth/count to prevent freezing on huge filesystems
            if (results.length > 50) return;

            if (isDir) {
                try {
                    const children = fileService.listDirectory(path);
                    for (const child of children) {
                        if (signal && signal.aborted) return;
                        const childName = typeof child === 'string' ? child : child.name;
                        traverse(`${path === '/' ? '' : path}/${childName}`);
                    }
                } catch(e) {}
            }
        };

        try {
            traverse('/');
        } catch (e) {
            console.warn('[FileSearchProvider] Error during traversal', e);
        }

        return results;
    }

    async activate(result) {
        const fileService = this.registry.get('FileService');
        if (fileService && result.action && result.action.path) {
            try {
                await fileService.open(result.action.path);
            } catch (e) {
                const dialogService = this.registry.get('DialogService');
                if (dialogService) {
                    dialogService.alert(`Cannot open "${result.title}":\n${e.message}`, 'No Application Found');
                } else {
                    console.warn('[FileSearchProvider]', e.message);
                }
            }
        }
    }
}
