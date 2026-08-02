/**
 * UserProfileManager
 *
 * Responsibility:
 * Owns the mutable runtime state for user identities/profiles.
 * Maps usernames to profile objects.
 *
 * Does NOT:
 * - Handle authentication (SessionManager)
 * - Persist configuration (UserProfileService)
 * - Own preferences (Settings)
 */
export class UserProfileManager {
    constructor() {
        this.profiles = new Map();
    }

    getProfile(username) {
        return this.profiles.get(username) || null;
    }

    setProfile(username, profileData) {
        this.profiles.set(username, profileData);
    }
}
