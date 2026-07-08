/**
 * SystemVersion
 * 
 * Responsibility:
 * Acts as the single canonical source of truth for OS identity and versioning.
 * 
 * Does NOT:
 * - Handle caching (Service Worker versions are independent)
 */

export const SYSTEM_INFO = {
    name: "LDE 27",
    codename: "Waffle",
    year: 27,
    milestone: 1,
    phase: 20,
    hotfix: 0,
    channel: "stable",
    build: 1,
    architecture: "Series 1",

    get version() {
        return `${this.year}.${this.milestone}.${this.phase}.${this.hotfix}`;
    }
};
