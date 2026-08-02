/**
 * ManifestBuilder
 * 
 * A fluent interface for developers to programmatically generate
 * valid manifest.json files for their LDE applications.
 */
export class ManifestBuilder {
    constructor() {
        this.manifest = {
            type: 'application',
            permissions: [],
            extensions: [],
            sdkVersion: '1.0'
        };
    }

    setId(id) {
        this.manifest.id = id;
        return this;
    }

    setName(name) {
        this.manifest.name = name;
        return this;
    }

    setVersion(version) {
        this.manifest.version = version;
        return this;
    }

    setMinimumOsVersion(version) {
        this.manifest.minimumOsVersion = version;
        return this;
    }

    setEntryPoint(entryPoint) {
        this.manifest.entryPoint = entryPoint;
        return this;
    }

    setRuntime(runtime) {
        this.manifest.runtime = runtime;
        return this;
    }

    setIcon(iconPath) {
        this.manifest.icon = iconPath;
        return this;
    }

    addPermission(permission) {
        if (!this.manifest.permissions.includes(permission)) {
            this.manifest.permissions.push(permission);
        }
        return this;
    }

    addExtension(type, config) {
        this.manifest.extensions.push({
            type,
            ...config
        });
        return this;
    }

    build() {
        return { ...this.manifest };
    }

    toJSON() {
        return JSON.stringify(this.build(), null, 4);
    }
}
