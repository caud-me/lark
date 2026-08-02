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

        let path = entryPoint;

        // Strip leading relative markers
        if (path.startsWith('./')) {
            path = path.substring(2);
        } else if (path.startsWith('/')) {
            path = path.substring(1);
        }

        // Dynamically strip source root folder name if present (e.g. if entryPoint starts with whatever source folder LDE_SOURCE_URL points to)
        if (window.LDE_SOURCE_URL) {
            try {
                const sourceDirName = new URL(window.LDE_SOURCE_URL).pathname.split('/').filter(Boolean).pop();
                if (sourceDirName && path.startsWith(sourceDirName + '/')) {
                    path = path.substring(sourceDirName.length + 1);
                }
            } catch (e) {
                // Ignore URL parsing errors
            }
        }

        const url = new URL(path, window.LDE_SOURCE_URL || window.LDE_BASE_URL).href;
        return import(url);
    }
}
