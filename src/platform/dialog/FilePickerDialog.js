// export async function showFilePickerDialog(dialogService, fileService, options = {}) {
//     const { 
//         title = 'Select File',
//         initialPath = '/users', 
//         extensions = [], 
//         mode = 'open', 
//         defaultName = 'Untitled.txt' 
//     } = options;

//     let currentPath = initialPath;
//     let selectedFile = null;

//     const content = document.createElement('div');
//     content.style.display = 'flex';
//     content.style.flexDirection = 'column';
//     content.style.width = '480px';
//     content.style.height = '320px';
//     content.style.fontFamily = 'system-ui, -apple-system, sans-serif';

//     const header = document.createElement('div');
//     header.style.display = 'flex';
//     header.style.alignItems = 'center';
//     header.style.marginBottom = '8px';
//     header.style.gap = '8px';

//     const upBtn = document.createElement('button');
//     upBtn.textContent = '↑ Up';
//     upBtn.style.padding = '4px 8px';
//     upBtn.style.cursor = 'pointer';
    
//     const pathLabel = document.createElement('div');
//     pathLabel.style.flex = '1';
//     pathLabel.style.fontFamily = 'monospace';
//     pathLabel.style.backgroundColor = 'rgba(0,0,0,0.2)';
//     pathLabel.style.padding = '4px 8px';
//     pathLabel.style.borderRadius = '4px';
//     pathLabel.style.overflow = 'hidden';
//     pathLabel.style.textOverflow = 'ellipsis';
//     pathLabel.style.whiteSpace = 'nowrap';
    
//     header.appendChild(upBtn);
//     header.appendChild(pathLabel);

//     const list = document.createElement('div');
//     list.style.flex = '1';
//     list.style.overflowY = 'auto';
//     list.style.border = '1px solid rgba(255,255,255,0.1)';
//     list.style.borderRadius = '4px';
//     list.style.marginBottom = '8px';
//     list.style.backgroundColor = 'rgba(0,0,0,0.1)';

//     const inputWrapper = document.createElement('div');
//     inputWrapper.style.display = mode === 'save' ? 'flex' : 'none';
//     inputWrapper.style.alignItems = 'center';
//     inputWrapper.style.gap = '8px';

//     const filenameLabel = document.createElement('span');
//     filenameLabel.textContent = 'File name:';
    
//     const filenameInput = document.createElement('input');
//     filenameInput.type = 'text';
//     filenameInput.value = defaultName;
//     filenameInput.style.flex = '1';
//     filenameInput.style.padding = '4px 8px';
//     filenameInput.style.fontFamily = 'inherit';
    
//     inputWrapper.appendChild(filenameLabel);
//     inputWrapper.appendChild(filenameInput);

//     content.appendChild(header);
//     content.appendChild(list);
//     content.appendChild(inputWrapper);

//     const renderList = () => {
//         pathLabel.textContent = currentPath;
//         list.innerHTML = '';
//         selectedFile = null;

//         try {
//             const children = fileService.listDirectory(currentPath, { pid: options.pid });
//             children.forEach(child => {
//                 if (child.type === 'file' && extensions.length > 0) {
//                     const ext = child.name.split('.').pop();
//                     if (!extensions.includes(ext)) return;
//                 }

//                 const item = document.createElement('div');
//                 item.style.display = 'flex';
//                 item.style.alignItems = 'center';
//                 item.style.padding = '6px 8px';
//                 item.style.cursor = 'pointer';
//                 item.style.userSelect = 'none';
//                 item.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

//                 const icon = document.createElement('span');
//                 icon.textContent = child.type === 'directory' ? '📁' : '📄';
//                 icon.style.marginRight = '8px';

//                 const nameSpan = document.createElement('span');
//                 nameSpan.textContent = child.name;

//                 item.appendChild(icon);
//                 item.appendChild(nameSpan);

//                 item.onclick = () => {
//                     Array.from(list.children).forEach(c => c.style.backgroundColor = '');
//                     item.style.backgroundColor = 'rgba(255,255,255,0.1)';
//                     selectedFile = child;
//                     if (child.type === 'file' && mode === 'save') {
//                         filenameInput.value = child.name;
//                     }
//                 };

//                 item.ondblclick = () => {
//                     if (child.type === 'directory') {
//                         currentPath = currentPath === '/' ? `/${child.name}` : `${currentPath}/${child.name}`;
//                         renderList();
//                     } else if (mode === 'open') {
//                         // In a real implementation, we could trigger the dialog confirm here
//                         item.onclick();
//                     }
//                 };

//                 list.appendChild(item);
//             });

//             if (children.length === 0) {
//                 const empty = document.createElement('div');
//                 empty.textContent = 'Empty Directory';
//                 empty.style.padding = '16px';
//                 empty.style.color = 'rgba(255,255,255,0.3)';
//                 empty.style.textAlign = 'center';
//                 list.appendChild(empty);
//             }

//         } catch (err) {
//             list.innerHTML = `<div style="color: #ff4d4d; padding: 16px; text-align: center;">Error reading directory: ${err.message}</div>`;
//         }
//     };

//     upBtn.onclick = () => {
//         if (currentPath === '/') return;
//         const parts = currentPath.split('/');
//         parts.pop();
//         currentPath = parts.join('/') || '/';
//         renderList();
//     };

//     renderList();

//     return new Promise(async (resolve) => {
//         const result = await dialogService.show({
//             title: title,
//             contentElement: content,
//             width: '480px',
//             modal: true,
//             type: 'custom',
//             buttons: [
//                 { label: 'Cancel', result: null },
//                 { label: mode === 'save' ? 'Save' : 'Open', result: 'confirm', primary: true }
//             ]
//         });

//         if (result === 'confirm') {
//             if (mode === 'save') {
//                 const name = filenameInput.value.trim();
//                 if (name) {
//                     resolve({ path: currentPath === '/' ? `/${name}` : `${currentPath}/${name}` });
//                 } else {
//                     resolve(null);
//                 }
//             } else {
//                 if (selectedFile && selectedFile.type === 'file') {
//                     resolve({ path: currentPath === '/' ? `/${selectedFile.name}` : `${currentPath}/${selectedFile.name}` });
//                 } else {
//                     resolve(null);
//                 }
//             }
//         } else {
//             resolve(null);
//         }
//     });
// }

/**
 * Injects the core file dialog style architecture blocks into the document head safely.
 */
function injectFileDialogStyles() {
    const styleId = 'lde-shell-file-dialog-styles';
    if (document.getElementById(styleId)) return;

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
        .shell-fd-button {
            border: none;
            background-color: #80808020;
            padding: 6px 8px;
            border-radius: 4px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 8px;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.15s ease;
        }

        .shell-fd-button:hover {
            background-color: #80808040;
        }

        .shell-fd-button:disabled {
            background-color: #80808010;
            color: #80808080;
            cursor: default;
        }

        .flex-align-center {
            align-items: center;
        }

        .flex-align-start {
            align-items: start;
        }

        .flex-space-between {
            justify-content: space-between;
        }

        .padding-8 {
            padding: 8px;
        }

        .layout-h {
            display: flex;
            flex-direction: row;
        }

        .layout-v {
            display: flex;
            flex-direction: column;
        }

        .flex-gap-2 {
            gap: 2px;
        }

        .flex-gap-8 {
            gap: 8px;
        }

        .flex-gap-16 {
            gap: 16px;
        }

        .shell-fd-small-text {
            display: block;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 11px;
            color: #aaa;
        }

        .shell-fd-small-text.er {
            font-size: 9px;
            color: #80808080;
            font-weight: 600;
        }

        .shell-fd-icon {
            all: initial;
            font-family: 'sfi';
            font-size: 14px;
            color: #aaa;
            display: inline-block;
        }

        .shell-fd-item-row {
            transition: background-color 0.1s ease;
        }

        .shell-fd-item-row:hover {
            background-color: #80808010;
        }

        .shell-fd-input {
            background-color: #80808010;
            border: 1px solid #80808020;
            border-radius: 4px;
            color: #ffffff;
            padding: 6px 8px;
            font-size: 12px;
            outline: none;
            transition: border-color 0.15s ease;
        }

        .shell-fd-input:focus {
            border-color: #80808080;
        }

        h1, h2, h3, h4, h5, h6 {
            color: #fff;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-weight: 500;
            line-height: 2;
            margin-block-start: .5em;
        }

        p {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #fff;
        }
    `;
    document.head.appendChild(styleElement);
}

export async function showFilePickerDialog(dialogService, fileService, options = {}) {
    // Inject custom styling runtime layer immediately
    injectFileDialogStyles();

    const { 
        title = 'Select File',
        initialPath = '/users', 
        extensions = [], 
        mode = 'open', 
        defaultName = 'Untitled.txt' 
    } = options;

    let currentPath = initialPath;
    let selectedFile = null;

    // Root Modal Content Frame Container
    const content = document.createElement('div');
    content.className = 'layout-v flex-gap-8';
    content.style.height = '320px';
    content.style.boxSizing = 'border-box';

    // Instruction Header
    const instructionHeader = document.createElement('h3');
    instructionHeader.textContent = 'Select a file';
    content.appendChild(instructionHeader);

    // Header Address/Navigation Strip
    const header = document.createElement('div');
    header.className = 'layout-h flex-gap-8 flex-align-center';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'shell-fd-button';
    upBtn.innerHTML = '<i class="shell-fd-icon">&#xE110;</i>'; // Navigation Up Vector Glyph
    
    const pathLabel = document.createElement('div');
    pathLabel.className = 'shell-fd-input';
    pathLabel.style.flex = '1';
    pathLabel.style.fontFamily = 'monospace';
    pathLabel.style.overflow = 'hidden';
    pathLabel.style.textOverflow = 'ellipsis';
    pathLabel.style.whiteSpace = 'nowrap';
    pathLabel.style.background = '#80808010';
    pathLabel.style.border = '1px solid #80808020';
    
    header.appendChild(upBtn);
    header.appendChild(pathLabel);

    // Main Directory Viewer Scroller Window
    const list = document.createElement('div');
    list.className = 'layout-v';
    list.style.flex = '1';
    list.style.overflowY = 'auto';
    list.style.border = '1px solid #80808020';
    list.style.borderRadius = '4px';
    list.style.backgroundColor = '#80808010';

    // Lower Interactive Save File Input Wrapper
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'layout-h flex-gap-8 flex-align-center';
    inputWrapper.style.display = mode === 'save' ? 'flex' : 'none';

    const filenameLabel = document.createElement('span');
    filenameLabel.className = 'shell-fd-small-text';
    filenameLabel.textContent = 'File name:';
    
    const filenameInput = document.createElement('input');
    filenameInput.type = 'text';
    filenameInput.className = 'shell-fd-input';
    filenameInput.value = defaultName;
    filenameInput.style.flex = '1';
    filenameInput.style.fontFamily = 'inherit';
    
    inputWrapper.appendChild(filenameLabel);
    inputWrapper.appendChild(filenameInput);

    content.appendChild(header);
    content.appendChild(list);
    content.appendChild(inputWrapper);

    // Real-Time Procedural Grid Redraw Execution Engine
    const renderList = () => {
        pathLabel.textContent = currentPath;
        list.innerHTML = '';
        selectedFile = null;

        // Sync visual activity rules to Up directory trigger button controls
        upBtn.disabled = currentPath === '/';

        const updatePrimaryButtonState = () => {
            const overlayBox = content.closest('.lde-dialog-overlay');
            if (overlayBox) {
                const primaryConfirmButton = overlayBox.querySelector('.primary-action');
                if (primaryConfirmButton) {
                    if (mode === 'open' && (!selectedFile || selectedFile.type !== 'file')) {
                        primaryConfirmButton.disabled = true;
                        primaryConfirmButton.style.opacity = '0.5';
                        primaryConfirmButton.style.cursor = 'not-allowed';
                    } else {
                        primaryConfirmButton.disabled = false;
                        primaryConfirmButton.style.opacity = '1';
                        primaryConfirmButton.style.cursor = 'pointer';
                    }
                }
            }
        };

        try {
            const children = fileService.listDirectory(currentPath, { pid: options.pid }) || [];
            
            // Loop natively to populate files dynamically safely
            for (let i = 0; i < children.length; i++) {
                const child = children[i];

                if (child.type === 'file' && extensions.length > 0) {
                    const ext = child.name.split('.').pop();
                    let matchesExtension = false;
                    for (let j = 0; j < extensions.length; j++) {
                        if (extensions[j] === ext) {
                            matchesExtension = true;
                            break;
                        }
                    }
                    if (!matchesExtension) continue;
                }

                const item = document.createElement('div');
                item.className = 'layout-h flex-align-center shell-fd-item-row padding-8';
                item.style.cursor = 'pointer';
                item.style.userSelect = 'none';
                item.style.borderBottom = '1px solid #80808010';

                // Determine appropriate high-contrast monochrome font vector index glyph
                const iconNode = document.createElement('i');
                iconNode.className = 'shell-fd-icon';
                iconNode.style.marginRight = '8px';
                iconNode.innerHTML = child.type === 'directory' ? '&#xE8B7;' : '&#xE160;';

                const nameSpan = document.createElement('span');
                nameSpan.style.fontFamily = "'Segoe UI', sans-serif";
                nameSpan.style.fontSize = '12px';
                nameSpan.style.color = '#ffffff';
                nameSpan.textContent = child.name;

                item.appendChild(iconNode);
                item.appendChild(nameSpan);

                // Row Selection Routine
                item.onclick = () => {
                    const allRows = list.children;
                    for (let k = 0; k < allRows.length; k++) {
                        allRows[k].style.backgroundColor = '';
                    }
                    item.style.backgroundColor = '#80808040'; // High priority monochrome highlight selection rule
                    selectedFile = child;
                    
                    if (child.type === 'file' && mode === 'save') {
                        filenameInput.value = child.name;
                    }
                    updatePrimaryButtonState();
                };

                // Double Click Execution Target Routine
                item.ondblclick = () => {
                    if (child.type === 'directory') {
                        currentPath = currentPath === '/' ? `/${child.name}` : `${currentPath}/${child.name}`;
                        renderList();
                    }
                };

                list.appendChild(item);
            }

            // Fallback render rules for completely vacant folder objects
            if (list.children.length === 0) {
                const emptyContainer = document.createElement('div');
                emptyContainer.className = 'shell-fd-small-text padding-8';
                emptyContainer.textContent = 'Empty Directory';
                emptyContainer.style.textAlign = 'center';
                emptyContainer.style.marginTop = '32px';
                emptyContainer.style.color = '#80808080';
                list.appendChild(emptyContainer);
            }

        } catch (err) {
            list.innerHTML = `<div class="shell-fd-small-text" style="color: #ff4d4d; padding: 16px; text-align: center;">Error reading directory: ${err.message}</div>`;
        }
        
        // Update initially after render if DOM is mounted
        if (content.parentElement) {
            updatePrimaryButtonState();
        }
    };

    // Ascend Parent Folder Directory Click Rule
    upBtn.onclick = () => {
        if (currentPath === '/') return;
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        currentPath = '/' + parts.join('/');
        renderList();
    };

    renderList();

    return new Promise(async (resolve) => {
        const dialogPromise = dialogService.show({
            title: title,
            contentElement: content,
            modal: true,
            type: 'custom',
            buttons: [
                { label: 'Cancel', result: null },
                { label: mode === 'save' ? 'Save' : 'Open', result: 'confirm', primary: true }
            ]
        });

        // The dialog DOM is now mounted synchronously, so we can run initial state sync
        // Need to wait for the next tick to ensure the overlayBox is attached
        setTimeout(() => {
            renderList(); // Re-render to trigger updatePrimaryButtonState now that DOM is ready
        }, 0);

        const result = await dialogPromise;

        if (result === 'confirm') {
            if (mode === 'save') {
                const name = filenameInput.value.trim();
                if (name) {
                    resolve({ path: currentPath === '/' ? `/${name}` : `${currentPath}/${name}` });
                } else {
                    resolve(null);
                }
            } else {
                if (selectedFile && selectedFile.type === 'file') {
                    resolve({ path: currentPath === '/' ? `/${selectedFile.name}` : `${currentPath}/${selectedFile.name}` });
                } else {
                    resolve(null);
                }
            }
        } else {
            resolve(null);
        }
    });
}