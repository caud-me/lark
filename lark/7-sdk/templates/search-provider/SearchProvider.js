export default class SearchProvider {
    constructor(context) {
        this.context = context;
        this.data = [
            { id: '1', title: 'Example Result 1', description: 'Description 1' },
            { id: '2', title: 'Example Result 2', description: 'Description 2' }
        ];
    }

    async search(query) {
        if (!query) return [];
        
        const q = query.toLowerCase();
        const results = this.data.filter(item => 
            item.title.toLowerCase().includes(q) || 
            item.description.toLowerCase().includes(q)
        );

        return results.map(item => ({
            id: `example-${item.id}`,
            title: item.title,
            description: item.description,
            icon: 'icon-search',
            action: () => {
                this.context.capabilities.invoke('dialog:show', {
                    title: 'Search Result',
                    message: `You selected: ${item.title}`
                });
            }
        }));
    }
}
