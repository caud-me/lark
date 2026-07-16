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
        // the current browser-served app location under /src/apps.
        if (entryPoint.startsWith('../apps/')) {
            entryPoint = entryPoint.replace('../apps/', '/src/apps/');
        }

        if (entryPoint.startsWith('/src/apps/')) {
            return import(entryPoint);
        }

        return import(entryPoint);
    }
}
