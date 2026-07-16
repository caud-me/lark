import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * UserProfileService
 *
 * Responsibility:
 * Public API for user identities (display name, avatar, metadata).
 * Manages persistence in /users/{username}/profile.json.
 * Provides getCurrentProfile() for UI consumers.
 */
export class UserProfileService {
    constructor(userProfileManager, registry) {
        this.userProfileManager = userProfileManager;
        this.registry = registry;
    }

    /**
     * Gets the profile for the currently logged in user.
     * Convenience method for UI components ("Who am I?").
     */
    getCurrentProfile() {
        const sessionService = this.registry.get('SessionService');
        if (!sessionService) return null;
        
        const session = sessionService.getCurrentSession();
        if (!session || !session.user) return null;

        return this.getProfile(session.user.username);
    }

    /**
     * Loads the profile from disk or memory for a given username.
     * If no profile exists on disk, returns a default structure.
     */
    getProfile(username) {
        let profile = this.userProfileManager.getProfile(username);
        
        if (!profile) {
            const fileService = this.registry.get('FileService');
            const profilePath = `/users/${username}/profile.json`;

            if (fileService && fileService.exists(profilePath)) {
                try {
                    // System process reads the file securely
                    const raw = fileService.readFile(profilePath, { context: { role: 'SYSTEM' } });
                    profile = JSON.parse(raw);
                    this.userProfileManager.setProfile(username, profile);
                } catch (e) {
                    EventBus.emit('userProfileService:error', { severity: 'Error', source: 'UserProfileService', message: `Failed to read profile for ${username}: ${e.message}` });
                }
            }

            if (!profile) {
                // Fallback / defaults
                const userService = this.registry.get('UserService');
                const user = userService ? userService.getUser(username) : null;
                
                profile = {
                    displayName: user ? user.displayName : username,
                    avatar: null,
                    createdAt: user ? user.createdAt : new Date().toISOString(),
                    metadata: {}
                };
                
                // Don't auto-save to disk here, wait for an explicit update
                this.userProfileManager.setProfile(username, profile);
            }
        }

        return profile;
    }

    /**
     * Updates specific fields on a user's profile and persists it.
     */
    updateProfile(username, updates = {}) {
        const profile = this.getProfile(username);
        const updated = { ...profile, ...updates };
        
        this.userProfileManager.setProfile(username, updated);

        const fileService = this.registry.get('FileService');
        if (fileService) {
            const profilePath = `/users/${username}/profile.json`;
            try {
                // Use SYSTEM context to guarantee write succeeds, since we are a trusted service
                // and might be updating a profile outside of the active session context
                fileService.writeFile(profilePath, JSON.stringify(updated, null, 2), { context: { role: 'SYSTEM' } });
                EventBus.emit('userProfileService:updated', { severity: 'Info', source: 'UserProfileService', message: `Updated profile for ${username}` });
            } catch (e) {
                EventBus.emit('userProfileService:error', { severity: 'Error', source: 'UserProfileService', message: `Failed to save profile for ${username}: ${e.message}` });
                throw e;
            }
        }
        
        return updated;
    }

    setAvatar(username, avatarUrl) {
        return this.updateProfile(username, { avatar: avatarUrl });
    }

    getDisplayName(username) {
        const profile = this.getProfile(username);
        return profile ? profile.displayName : username;
    }
}
