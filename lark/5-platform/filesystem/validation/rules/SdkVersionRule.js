/**
 * SdkVersionRule
 * Ensures minimumOsVersion and sdkVersion exist.
 */
export class SdkVersionRule {
    validate(manifest) {
        const diagnostics = [];

        if (!manifest.minimumOsVersion) {
            diagnostics.push({
                severity: 'warning',
                code: 'MF002',
                message: `Missing minimumOsVersion`,
                suggestion: `Specify the minimum OS version this package is compatible with (e.g., "1.0.0").`
            });
        }

        if (!manifest.sdkVersion) {
            diagnostics.push({
                severity: 'warning',
                code: 'MF003',
                message: `Missing sdkVersion`,
                suggestion: `Specify the SDK version used to build this package (e.g., "1.0").`
            });
        }

        return diagnostics;
    }
}
