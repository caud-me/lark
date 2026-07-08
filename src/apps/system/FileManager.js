/**
 * Phase 5: File Manager System Application
 * 
 * Responsibility: Browse and manage files via FileService.
 * Intentionally simple UI for validation purposes.
 */
import { EventBus } from '../../kernel/SystemEventBus.js';

export default {
    run: async (registry, pid) => {
        const WindowService = registry.get('WindowService');
        const FileService = registry.get('FileService');
        const ProcessService = registry.get('ProcessService');
        const DialogService = registry.get('DialogService');

        if (!WindowService || !FileService || !ProcessService || !DialogService) {
            console.error('[FileManager] Required services missing.');
            return;
        }

        const proc = ProcessService.getProcess(pid);
        const username = proc ? proc.ownerUsername : 'system';
        const homeDirectory = username === 'system' ? '/' : `/users/${username}`;

        let currentPath = homeDirectory;

        EventBus.emit('fileManager:start', { severity: 'Info', source: 'FileManager', message: 'Started File Manager.' });

        const win = WindowService.createWindow({
            title: 'File Manager',
            width: 600,
            height: 400,
            pid
        });

            const doRender = async () => {
                let items = [];
                try {
                    items = FileService.listDirectory(currentPath);
                } catch (e) {
                    await DialogService.alert(e.message, 'File Manager Error');
                    if (currentPath !== '/') {
                        currentPath = '/';
                        return doRender();
                    }
                }

            // Sort: directories first, then files
            items.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'directory' ? -1 : 1;
            });

            let html = `
                <div class="lde-app-container">
                    <div class="lde-header wrapper-horizontal-inline flex-gap-12">
                        <button id="fm-up-${win.id}" class="lde-btn" ${currentPath === '/' ? 'disabled' : ''}>Up</button>
                        <span class="flex-grow-1 font-mono">${currentPath}</span>
                        <button id="fm-new-folder-${win.id}" class="lde-btn">New Folder</button>
                        <button id="fm-new-file-${win.id}" class="lde-btn">New File</button>
                    </div>
                    <div class="lde-content p-0">
                        <table class="lde-table">
                            <thead>
                                <tr>
                                    <th style="width: 40px;"></th>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Size</th>
                                    <th style="text-align: right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.length === 0 ? '<tr><td colspan="5" class="text-secondary text-center mt-24">Empty directory</td></tr>' : ''}
                                ${items.map(item => `
                                    <tr class="fm-item ${item.type === 'directory' ? 'cursor-pointer' : 'cursor-default'}" data-path="${item.path}" data-type="${item.type}">
                                        <td style="text-align: center;"><span class="fm-icon grayscale-20">${item.type === 'directory' ? '📁' : '📄'}</span></td>
                                        <td class="font-bold" style="color: var(--lde-text-primary);">${item.name}</td>
                                        <td>${item.type === 'directory' ? 'Folder' : 'File'}</td>
                                        <td>${item.type === 'file' ? item.size + ' B' : '--'}</td>
                                        <td style="text-align: right;">
                                            <button class="lde-btn fm-rename" data-path="${item.path}" data-name="${item.name}">Rename</button>
                                            <button class="lde-btn lde-btn-danger fm-delete" data-path="${item.path}">Delete</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            win.contentElement.innerHTML = html;

            // Bind events
            const upBtn = win.contentElement.querySelector(`#fm-up-${win.id}`);
            if (upBtn) {
                upBtn.onclick = () => {
                    if (currentPath === '/') return;
                    const parts = currentPath.split('/');
                    parts.pop();
                    currentPath = parts.join('/') || '/';
                    doRender();
                };
            }

            win.contentElement.querySelector(`#fm-new-folder-${win.id}`).onclick = async () => {
                const name = await DialogService.prompt('Folder name:', '', 'New Folder');
                if (name && !name.includes('/')) {
                    try {
                        const target = (currentPath === '/' ? '/' : currentPath + '/') + name;
                        FileService.createDirectory(target);
                        doRender();
                    } catch (e) { await DialogService.alert(e.message, 'Error'); }
                } else if (name) {
                    await DialogService.alert('Invalid name.', 'Error');
                }
            };

            win.contentElement.querySelector(`#fm-new-file-${win.id}`).onclick = async () => {
                const name = await DialogService.prompt('File name:', '', 'New File');
                if (name && !name.includes('/')) {
                    try {
                        const target = (currentPath === '/' ? '/' : currentPath + '/') + name;
                        FileService.createFile(target, 'Hello World'); // Empty or basic content
                        doRender();
                    } catch (e) { await DialogService.alert(e.message, 'Error'); }
                } else if (name) {
                    await DialogService.alert('Invalid name.', 'Error');
                }
            };

            win.contentElement.querySelectorAll('.fm-item').forEach(el => {
                el.onclick = () => {
                    if (el.dataset.type === 'directory') {
                        currentPath = el.dataset.path;
                        doRender();
                    }
                };
            });

            win.contentElement.querySelectorAll('.fm-rename').forEach(el => {
                el.onclick = async (e) => {
                    e.stopPropagation();
                    const newName = await DialogService.prompt('New name:', el.dataset.name, 'Rename');
                    if (newName && newName !== el.dataset.name) {
                        try {
                            FileService.rename(el.dataset.path, newName);
                            doRender();
                        } catch (err) { await DialogService.alert(err.message, 'Error'); }
                    }
                };
            });

            win.contentElement.querySelectorAll('.fm-delete').forEach(el => {
                el.onclick = async (e) => {
                    e.stopPropagation();
                    const confirmDel = await DialogService.confirm(`Delete ${el.dataset.path}?`, 'Confirm Deletion');
                    if (confirmDel) {
                        try {
                            FileService.delete(el.dataset.path);
                            doRender();
                        } catch (err) { await DialogService.alert(err.message, 'Error'); }
                    }
                };
            });
        };

        doRender();
    }
};
