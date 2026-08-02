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
    milestone: 10,
    phase: 17,
    hotfix: 6,
    channel: "stable",
    build: 100, // this increments every phase, and hotfix. a combined.
    architecture: "Series 10",

    get version() {
        return this.hotfix ? `${this.year}.${this.milestone}.${this.phase}.${this.hotfix}` : `${this.year}.${this.milestone}.${this.phase}`;
    },

    // lark-pre27.10.1-build-77 (webos)
    get watermarkVersion() {
        return `lark-pre${this.year}.${this.milestone}.${this.phase}.${this.hotfix}-build-${this.build} (webos)`
    }
};
