export async function showPropertiesDialog(dialogService, metadata) {
    const content = document.createElement('div');
    content.className = 'lde-properties-dialog';

    const addRow = (label, value) => {
        const row = document.createElement('div');
        row.className = 'lde-properties-row';
        
        const lbl = document.createElement('span');
        lbl.className = 'lde-properties-label';
        lbl.textContent = label + ':';
        
        const val = document.createElement('span');
        val.className = 'lde-properties-value';
        val.textContent = value;
        
        row.appendChild(lbl);
        row.appendChild(val);
        content.appendChild(row);
    };

    addRow('Name', metadata.name || '--');
    addRow('Type', metadata.type === 'directory' ? 'Folder' : 'File');
    if (metadata.type === 'file') {
        addRow('Size', (metadata.size || 0) + ' bytes');
    }
    addRow('Owner', metadata.owner || 'system');
    if (metadata.permissions) {
        addRow('Permissions', `Read: ${metadata.permissions.read ? 'Yes' : 'No'}, Write: ${metadata.permissions.write ? 'Yes' : 'No'}`);
    }

    return dialogService.show({
        title: `${metadata.name || 'Item'} Properties`,
        contentElement: content,
        modal: true,
        type: 'custom',
        buttons: [{ label: 'Close', result: true, primary: true }]
    });
}
