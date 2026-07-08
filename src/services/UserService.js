/**
 * UserService
 *
 * Responsibility:
 * Exposes a public API for managing user accounts.
 *
 * Does NOT:
 * - Handle authentication mechanisms
 */
export class UserService {
    constructor(userManager) {
        this.userManager = userManager;
    }

    getUser(username) {
        return this.userManager.getUser(username);
    }

    getUsers() {
        return this.userManager.getUsers();
    }

    createUser(username, displayName) {
        return this.userManager.createUser(username, displayName);
    }
}
