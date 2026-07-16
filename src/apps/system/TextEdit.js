import { EventBus } from '../../kernel/SystemEventBus.js';
import { omni_button } from '../../platform/settings/SettingsComponents.js';

/**
 * Notepad Application
 *
 * Responsibility:
 * Provides a text editor with New, Open, Save, and Save As capabilities.
 * Integrates directly with FileService for disk persistence and DialogService
 * for user safety confirmations.
 */
export default {
    run: async (registry, pid, options = {}) => {
        // Retrieve essential platform services
        const WindowService = registry.get('WindowService');
        const FileService = registry.get('FileService');
        const DialogService = registry.get('DialogService');
        const SecurityService = registry.get('SecurityService');

        if (!WindowService || !FileService || !DialogService) {
            console.error('[Notepad] Required services missing.');
            return;
        }

        // Initialize Window Frame
        const win = WindowService.createWindow({
            title: 'Notepad - Untitled',
            width: 600,
            height: 450,
            pid
        });

        // Application State
        let currentFilePath = null;
        let hasUnsavedChanges = false;

        // ========================================
        // UI Layout Rendering
        // ========================================
        const renderInterface = () => {
            win.contentElement.innerHTML = '';

            const container = document.createElement('div');
            container.className = 'omni-layout-row';
            container.style.height = '100%';
            container.style.flexDirection = 'column';

            // 1. Unified Utility Action Bar (Standardized buttons)
            const actionMenuBar = document.createElement('div');
            actionMenuBar.className = 'layout-h flex-gap-8';
            actionMenuBar.style.padding = '8px 12px';
            actionMenuBar.style.borderBottom = '1px solid #1c1c1c';
            actionMenuBar.style.background = '#101010';

            // Render buttons utilizing standard Omni design formats
            const newButtonHtml = omni_button(`np-new-${win.id}`, '&#xE109;', 'New', '', 'small');
            const openButtonHtml = omni_button(`np-open-${win.id}`, '&#xE188;', 'Open', '', 'small');
            const saveButtonHtml = omni_button(`np-save-${win.id}`, '&#xE105;', 'Save', '', 'small');
            const saveAsButtonHtml = omni_button(`np-saveas-${win.id}`, '&#xE17C;', 'Save As', '', 'small');

            actionMenuBar.innerHTML = newButtonHtml + openButtonHtml + saveButtonHtml + saveAsButtonHtml;

            // 2. Monospace Writing Canvas
            const editorBody = document.createElement('div');
            editorBody.className = 'flex-1';
            editorBody.style.position = 'relative';

            const textarea = document.createElement('textarea');
            textarea.id = `np-textarea-${win.id}`;
            textarea.placeholder = 'Start writing...';
            
            // Layout styling without complex overrides
            textarea.style.width = '100%';
            textarea.style.height = '100%';
            textarea.style.border = 'none';
            textarea.style.outline = 'none';
            textarea.style.resize = 'none';
            textarea.style.padding = '16px';
            textarea.style.boxSizing = 'border-box';
            textarea.style.background = 'transparent';
            textarea.style.color = 'var(--lde-text-primary, #ffffff)';
            textarea.style.fontFamily = 'Consolas, "Courier New", monospace';
            textarea.style.fontSize = '13px';
            textarea.style.lineHeight = '1.6';

            editorBody.appendChild(textarea);
            container.appendChild(actionMenuBar);
            container.appendChild(editorBody);
            win.contentElement.appendChild(container);

            bindUserActions(actionMenuBar, textarea);
        };

        // ========================================
        // Document Operation Utilities
        // ========================================
        const updateWindowTitle = () => {
            const documentName = currentFilePath ? currentFilePath.split('/').pop() : 'Untitled';
            const dirtyMarker = hasUnsavedChanges ? '*' : '';
            win.setTitle(`Notepad - ${documentName}${dirtyMarker}`);
        };

        const handleDirtyCheck = async () => {
            if (hasUnsavedChanges) {
                const confirmed = await DialogService.confirm(
                    'You have unsaved changes. Do you want to discard them?',
                    'Unsaved Changes'
                );
                return confirmed; // Returns true if the user chooses to proceed anyway
            }
            return true; 
        };

        const saveDocument = async (forceSaveAs = false) => {
            const textarea = win.contentElement.querySelector(`#np-textarea-${win.id}`);
            if (!textarea) return false;

            const textContent = textarea.value;

            // Trigger path selection if first-time save or Save As requested
            if (!currentFilePath || forceSaveAs) {
                const defaultPath = currentFilePath || '/documents/untitled.txt';
                const chosenPath = await DialogService.prompt(
                    'Enter a file path to save your document:',
                    'Save File',
                    defaultPath
                );

                if (chosenPath === null || chosenPath.trim() === '') {
                    return false; // User cancelled saving
                }
                currentFilePath = chosenPath;
            }

            try {
                const systemContext = SecurityService ? SecurityService.getSystemContext() : null;
                await FileService.writeFile(currentFilePath, textContent, { context: systemContext });
                
                hasUnsavedChanges = false;
                updateWindowTitle();
                return true;
            } catch (error) {
                await DialogService.alert(`Failed to save file: ${error.message}`, 'Save Error');
                return false;
            }
        };

        const openDocument = async () => {
            const canProceed = await handleDirtyCheck();
            if (!canProceed) return;

            const targetPath = await DialogService.prompt(
                'Enter the path of the file you want to open:',
                'Open File',
                '/documents/'
            );

            if (targetPath === null || targetPath.trim() === '') {
                return;
            }

            try {
                const systemContext = SecurityService ? SecurityService.getSystemContext() : null;
                const fileExists = await FileService.exists(targetPath, { context: systemContext });

                if (!fileExists) {
                    await DialogService.alert('The file at the specified path does not exist.', 'File Not Found');
                    return;
                }

                const fileContent = await FileService.readFile(targetPath, { context: systemContext });
                const textarea = win.contentElement.querySelector(`#np-textarea-${win.id}`);
                
                if (textarea) {
                    textarea.value = fileContent || '';
                    currentFilePath = targetPath;
                    hasUnsavedChanges = false;
                    updateWindowTitle();
                }
            } catch (error) {
                await DialogService.alert(`Failed to open file: ${error.message}`, 'Open Error');
            }
        };

        const executeIntent = async (intent) => {
            if (intent && (intent.type === 'textedit.open' || intent.action === 'open-file') && (intent.payload?.path || intent.path)) {
                const targetPath = intent.payload?.path || intent.path;
                try {
                    const systemContext = SecurityService ? SecurityService.getSystemContext() : null;
                    const fileContent = await FileService.readFile(targetPath, { context: systemContext });
                    const textarea = win.contentElement.querySelector(`#np-textarea-${win.id}`);
                    if (textarea) {
                        textarea.value = fileContent || '';
                        currentFilePath = targetPath;
                        hasUnsavedChanges = false;
                        updateWindowTitle();
                    }
                } catch (e) {
                    console.error('[Notepad] Failed to open intent path', e);
                }
            }
        };

        const createNewDocument = async () => {
            const canProceed = await handleDirtyCheck();
            if (!canProceed) return;

            const textarea = win.contentElement.querySelector(`#np-textarea-${win.id}`);
            if (textarea) {
                textarea.value = '';
                currentFilePath = null;
                hasUnsavedChanges = false;
                updateWindowTitle();
            }
        };

        // ========================================
        // Event Binding Configuration
        // ========================================
        const bindUserActions = (menuBar, textarea) => {
            // Document write state change monitor
            textarea.addEventListener('input', () => {
                if (!hasUnsavedChanges) {
                    hasUnsavedChanges = true;
                    updateWindowTitle();
                }
            });

            // Action: New Document
            const btnNew = menuBar.querySelector(`#np-new-${win.id}`);
            if (btnNew) {
                btnNew.onclick = createNewDocument;
            }

            // Action: Open Document
            const btnOpen = menuBar.querySelector(`#np-open-${win.id}`);
            if (btnOpen) {
                btnOpen.onclick = openDocument;
            }

            // Action: Save File
            const btnSave = menuBar.querySelector(`#np-save-${win.id}`);
            if (btnSave) {
                btnSave.onclick = () => saveDocument(false);
            }

            // Action: Save File As...
            const btnSaveAs = menuBar.querySelector(`#np-saveas-${win.id}`);
            if (btnSaveAs) {
                btnSaveAs.onclick = () => saveDocument(true);
            }
        };

        // Render base shell UI
        renderInterface();

        // Safety close intercepts
        win.onClose = async () => {
            const canClose = await handleDirtyCheck();
            return canClose; // If false, aborts window closure sequence
        };
    }
};