/**
 * BuiltinRuntimeLoader
 *
 * Responsibility:
 * Loads built-in system applications using standard dynamic imports.
 */
export class BuiltinRuntimeLoader {
    async load(appInfo) {
        let entryPoint = appInfo.runtime ? appInfo.runtime.entryPoint : appInfo.entryPoint;
        if (!entryPoint) {
            throw new Error(`BuiltinRuntimeLoader: Application ${appInfo.id} has no entry point defined.`);
        }

        // Support legacy relative paths from the old kernel layout and map them to
        // the current browser-served app location under src/apps.
        if (entryPoint.startsWith('../apps/')) {
            entryPoint = entryPoint.replace('../apps/', 'src/apps/');
        }

        // Strip leading slash if present to make it relative to LDE_BASE_URL
        if (entryPoint.startsWith('/')) {
            entryPoint = entryPoint.substring(1);
        }

        const url = new URL(entryPoint, window.LDE_BASE_URL).href;
        return import(url);
    }
}
