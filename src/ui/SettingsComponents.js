/**
 * SettingsComponents
 * 
 * Responsibility:
 * Provides reusable UI primitives for the Settings application.
 */

export function createSettingSection(title, description, contentHtml) {
    return `
        <div class="settings-section" style="margin-bottom: 32px;">
            <h3 style="font-size: 1.25rem; margin-bottom: 4px; color: var(--lde-text-primary); font-weight: 600;">${title}</h3>
            ${description ? `<p class="text-secondary" style="margin-bottom: 16px; font-size: 0.875rem;">${description}</p>` : ''}
            <div class="v-layout flex-gap-12">
                ${contentHtml}
            </div>
        </div>
    `;
}

export function createSettingGroup(itemsHtml) {
    return `
        <div style="background: var(--lde-bg-surface-elevated); border: 1px solid var(--lde-border); border-radius: var(--lde-radius-md); overflow: hidden;">
            ${itemsHtml}
        </div>
    `;
}

export function createSettingRow(label, description, controlHtml, isLast = false) {
    const borderBottom = isLast ? '' : 'border-bottom: 1px solid var(--lde-border);';
    return `
        <div class="wrapper-horizontal-spaced-between" style="padding: 16px; ${borderBottom}">
            <div>
                <div style="font-weight: 500; color: var(--lde-text-primary);">${label}</div>
                ${description ? `<div class="text-secondary" style="font-size: 0.8125rem; margin-top: 2px;">${description}</div>` : ''}
            </div>
            <div>
                ${controlHtml}
            </div>
        </div>
    `;
}

export function createSettingInfoCard(icon, title, subtitle) {
    return `
        <div class="lde-centered-layout" style="background: var(--lde-bg-surface-elevated); border: 1px solid var(--lde-border); border-radius: var(--lde-radius-md); padding: 32px;">
            <div style="font-size: 3rem; margin-bottom: 12px;">${icon}</div>
            <div style="font-size: 1.25rem; font-weight: 600; color: var(--lde-text-primary);">${title}</div>
            <div class="text-secondary" style="margin-top: 4px;">${subtitle}</div>
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
