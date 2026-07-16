# Manifests

The `manifest.json` file is the heart of an LDE package. It tells the OS everything it needs to know to install and run the software.

## Required Fields
- `id`: A unique string identifier (e.g., `com.example.app`).
- `name`: The human-readable name of the package.
- `version`: Semver version of the package.
- `type`: Either `application` or `extension`.
- `minimumOsVersion`: The lowest version of LDE this package supports.
- `sdkVersion`: The SDK version this package was built against.

## Application-specific Fields
- `entryPoint`: The main Javascript file to execute when launched.
- `runtime`: The runtime loader (e.g., `lrfs`). Defaults to `lrfs`.

## Extensions and Permissions
- `extensions`: An array of extension definitions.
- `permissions`: An array of capabilities the application intends to use.
