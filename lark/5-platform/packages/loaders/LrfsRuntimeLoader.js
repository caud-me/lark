/**
 * LrfsRuntimeLoader
 *
 * Responsibility:
 * Loads applications directly from LRFS via Blob URLs.
 */
export class LrfsRuntimeLoader {
    constructor(lrfs) {
        this.lrfs = lrfs;
    }

    async load(appInfo) {
        let entryPoint = appInfo.runtime ? appInfo.runtime.entryPoint : appInfo.entryPoint;
        if (!entryPoint) {
            throw new Error(`LrfsRuntimeLoader: Application ${appInfo.id} has no entry point defined.`);
        }

        if (!entryPoint.startsWith('/')) {
            if (appInfo.install && appInfo.install.path) {
                entryPoint = `${appInfo.install.path}/${entryPoint}`;
            } else {
                // Fallback for builtins or legacy packages missing install.path
                entryPoint = `/packages/${appInfo.id}/${entryPoint}`;
            }
        }

        if (!this.lrfs.exists(entryPoint)) {
            throw new Error(`LrfsRuntimeLoader: Entry point ${entryPoint} not found in LRFS.`);
        }

        const content = this.lrfs.readFile(entryPoint);
        const blob = new Blob([content], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        
        try {
            return await import(url);
        } finally {
            // Revoke after a short delay to ensure import completes, 
            // though import is async, it might need the blob URL immediately.
            // Actually, import() returns a promise, so awaiting it guarantees it was fetched.
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    }
}
