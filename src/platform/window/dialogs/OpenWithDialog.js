export async function showOpenWithDialog(dialogService, associationService, path) {
    const apps = associationService.getCompatibleApplications(path);
    
    const content = document.createElement('div');
    content.className = 'lde-open-with-dialog';

    const desc = document.createElement('div');
    desc.className = 'text-secondary';
    desc.textContent = `Choose an application to open ${path.split('/').pop()}:`;
    content.appendChild(desc);

    const select = document.createElement('select');
    select.className = 'lde-input';

    if (apps.length === 0) {
        const opt = document.createElement('option');
        opt.textContent = 'No compatible applications found';
        opt.disabled = true;
        select.appendChild(opt);
    } else {
        apps.forEach(app => {
            const opt = document.createElement('option');
            opt.value = app.id;
            opt.textContent = `${app.title} (${app.id})`;
            select.appendChild(opt);
        });
    }
    
    content.appendChild(select);

    const result = await dialogService.show({
        title: 'Open With...',
        contentElement: content,
        modal: true,
        type: 'custom',
        buttons: [
            { label: 'Cancel', result: null },
            { label: 'Open', result: 'open', primary: true }
        ]
    });

    if (result === 'open' && apps.length > 0) {
        return select.value;
    }
    return null;
}
