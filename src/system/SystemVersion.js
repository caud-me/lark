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
    name: "Lark OS",
    codename: "Waffle", // year 27 is Waffle, never change this.
    year: 27,
    milestone: 5,
    phase: 22,
    hotfix: 1,
    channel: "stable",
    build: 1,
    architecture: "Series 5",

    get version() {
        return `${this.year}.${this.milestone}.${this.phase}.${this.hotfix}`;
    }
};
