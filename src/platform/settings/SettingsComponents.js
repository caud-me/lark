/**
 * SettingsComponents
 * 
 * Responsibility:
 * Provides reusable UI primitives for the Settings application.
 */

export function createSettingSection(title, description, contentHtml) {
    return `
        <div class="settings-section" style="margin-bottom: 32px; display: flex; flex-direction: column; gap: 8px;">
            <h3>${title}</h3>
            ${description ? `<p>${description}</p>` : ''}
            ${contentHtml}
        </div>
    `;
}

export function createSettingGroup(itemsHtml) {
    return `
        <div style="display: flex; flex-direction: column; gap: 16px;">
            ${itemsHtml}
        </div>
    `;
}

export function createSettingRow(label, description, controlHtml, isLast = false) {
    const borderBottom = isLast ? '' : 'border-bottom: 1px solid var(--lde-border);';
    return `
        <div class="layout-h flex-align-center flex-gap-16">
            <div class="layout-v flex-1 flex-gap-2">
                <p>${label}</p>
                ${description ? `<small>${description}</small>` : ''}
            </div>
            <div>
                ${controlHtml}
            </div>
        </div>
    `;
}

export function createSettingInfoCard(icon, title, subtitle) {
    return `
            <div class="layout-v flex-1 flex-gap-2">
                <p>${icon}</p>
                ${title ? `<small>${title}</small>` : ''}
                ${subtitle ? `<small class="er">${subtitle}</small>` : ''}
            </div>
    `;
}

export function createSettingButton(id, label, variant = 'secondary') {
    const btnClass = variant === 'primary' ? 'lde-btn-primary' : (variant === 'danger' ? 'lde-btn-danger' : '');
    return `<button id="${id}" class="lde-btn ${btnClass}">${label}</button>`;
}

export function createSettingInput(id, value, disabled = false, type = "text") {
    return `<input type="${type}" id="${id}" class="lde-input" value="${value}" ${disabled ? 'disabled' : ''} />`;
}

// omni update

/**
 * SettingsComponents (Omni API)
 * 
 * Responsibility:
 * Provides reusable UI primitives for Omni-compatible applications.
 */

export function omni_card(omni_components) {
    return `
        <div class="comp-card">
            ${omni_components}
        </div>
    `;
}

export function omni_preferenceItem(text_primary, text_secondary, text_tertiary, actions) {
    return `
        <div class="layout-h flex-align-center flex-gap-16">
            <div class="layout-v flex-1 flex-gap-2">
                <p>${text_primary}</p>
                ${text_secondary ? `<small>${text_secondary}</small>` : ''}
                ${text_tertiary ? `<small class="er">${text_tertiary}</small>` : ''}
            </div>
            <div>
                ${actions}
            </div>
        </div>
    `;
}

export function omni_imagelistItem(src, text_primary, text_secondary, text_tertiary, omni_components) {
    return `
        <div class="layout-h flex-align-center flex-gap-16">
            <img src=${src} alt="" srcset="">
            <div class="layout-v flex-1 flex-gap-2">
                <p>${text_primary}</p>
                ${text_secondary ? `<small>${text_secondary}</small>` : ''}
                ${text_tertiary ? `<small class="er">${text_tertiary}</small>` : ''}
                ${omni_components ? `${omni_components}` : ''}
            </div>
        </div>
    `;
}

export function omni_listItem(text_primary, text_secondary, text_tertiary, omni_components) {
    return `
        <div class="layout-v flex-1 flex-gap-2">
            <p>${text_primary}</p>
            ${text_secondary ? `<small>${text_secondary}</small>` : ''}
            ${text_tertiary ? `<small class="er">${text_tertiary}</small>` : ''}
            ${omni_components ? `${omni_components}` : ''}
        </div>
    `;
}

export function omni_searchbar(id, placeholder = 'Search...') {
    return `
        <div class="comp-searchbar">
            <i>&#xE721;</i>
            <input type="text" id="${id}" placeholder="${placeholder}">
        </div>
    `;
}

export function omni_selectbox(id, optionsHtml, disabled = false) {
    return `
        <div class="comp-selectbox">
            <select id="${id}" ${disabled ? 'disabled' : ''}>
                ${optionsHtml}
            </select>
            <i>&#xE972;</i>
        </div>
    `;
}

export function omni_input(id, value = '', disabled = false, placeholder = '', type = 'text') {
    return `
        <div class="comp-typebar">
            <input type="${type}" id="${id}" class="comp-input" value="${value}" ${disabled ? 'disabled' : ''} placeholder="${placeholder}">
        </div>
    `;
}

export function omni_sidebarTab(id, isActive, icon, label) {
    return `
        <a class="comp-sidebartab ${isActive ? 'active' : ''}" data-id="${id}">
            <i>${icon}</i>
            <p>${label}</p>
        </a>
    `;
}

export function omni_button(id, icon, label, variant = '', extraClass = '', disabled = false) {
    const variantClass = variant ? `comp-btn-${variant}` : '';
    const disabledAttr = disabled ? 'disabled' : '';
    return `
        <button id="${id}" class="comp-btn ${variantClass} ${extraClass}" ${disabledAttr}>
            <i>${icon}</i>${label}
        </button>
    `;
}

export function omni_group(label, omni_components, id = '', extraClass = '') {
    const labelHtml = label ? `<small>${label}</small>` : '';
    const idAttr = id ? `id="${id}"` : '';
    return `
        ${labelHtml}
        <div ${idAttr} class="comp-group ${extraClass}">
            ${omni_components}
        </div>
    `;
}

export function omni_badge(text, variant = 'info') {
    // Expected variants: 'success', 'warning', 'danger', 'info', 'secondary'
    const variantClass = variant ? `tag ${variant}` : 'tag';
    return `
        <span class="${variantClass}">
            ${text}
        </span>
    `;
}

// deferred
// export function omni_progress(value, max = 100) {
//     return `
//         <div class="comp-progress-container">
//             <progress class="comp-progress" value="${value}" max="${max}"></progress>
//         </div>
//     `;
// }

export function omni_toolbar(omni_components, extraClass = '') {
    return `
        <div class="comp-toolbar layout-h flex-align-center flex-gap-8 padding-8 ${extraClass}">
            ${omni_components}
        </div>
    `;
}