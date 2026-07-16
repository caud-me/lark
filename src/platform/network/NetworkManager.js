/**
 * NetworkManager
 *
 * Responsibility:
 * Owns mutable network state and configuration. Tracks connectivity,
 * active requests, and network policies.
 *
 * Does NOT:
 * - Perform fetches or downloads
 * - Emit semantic events (NetworkService does this)
 */
export class NetworkManager {
    constructor() {
        this.online = navigator.onLine;
        this.activeRequests = 0;
        this.lastConnectivityChange = new Date();
    }

    setOnlineStatus(isOnline) {
        if (this.online !== isOnline) {
            this.online = isOnline;
            this.lastConnectivityChange = new Date();
        }
    }

    isOnline() {
        return this.online;
    }

    incrementActiveRequests() {
        this.activeRequests++;
    }

    decrementActiveRequests() {
        if (this.activeRequests > 0) {
            this.activeRequests--;
        }
    }

    getActiveRequestCount() {
        return this.activeRequests;
    }

    getLastConnectivityChange() {
        return this.lastConnectivityChange;
    }
}
