/**
 * SecurityPolicy
 *
 * Responsibility:
 * Defines and enforces security rules based on security contexts.
 * Returns ALLOW, DENY, or REQUIRES_ELEVATION.
 */
export const SecurityResult = {
    ALLOW: 'ALLOW',
    DENY: 'DENY',
    REQUIRES_ELEVATION: 'REQUIRES_ELEVATION'
};

export class SecurityPolicy {
    constructor(securityService) {
        this.securityService = securityService;
    }

    canManageUsers(context) {
        if (!context) return SecurityResult.DENY;
        
        if (this.securityService.isSystem(context) || this.securityService.isAdministrator(context)) {
            return SecurityResult.ALLOW;
        }
        
        if (this.securityService.canElevate(context)) {
            return SecurityResult.REQUIRES_ELEVATION;
        }

        return SecurityResult.DENY;
    }

    canDeleteUser(context, targetUsername) {
        if (!context || targetUsername === 'system') return SecurityResult.DENY;
        
        // Cannot delete self via this API
        if (context.identity === targetUsername) return SecurityResult.DENY;

        return this.canManageUsers(context);
    }

    canAccessRecovery(context) {
        if (!context) return SecurityResult.DENY;
        
        if (this.securityService.isSystem(context) || this.securityService.isAdministrator(context)) {
            return SecurityResult.ALLOW;
        }
        
        return SecurityResult.DENY;
    }

    canManageDeveloper(context) {
        if (!context) return SecurityResult.DENY;
        
        if (this.securityService.isSystem(context) || this.securityService.isAdministrator(context)) {
            return SecurityResult.ALLOW;
        }
        
        return SecurityResult.DENY;
    }

    canModifyAccount(context, targetUsername) {
        if (!context) return SecurityResult.DENY;
        
        // Users can modify their own account
        if (context.identity === targetUsername) {
            return SecurityResult.ALLOW;
        }
        
        return this.canManageUsers(context);
    }

    canInstallPackage(context) {
        if (!context) return SecurityResult.DENY;

        if (this.securityService.isAdministrator(context) || this.securityService.isSystem(context)) {
            return SecurityResult.ALLOW;
        }

        if (this.securityService.canElevate(context)) {
            return SecurityResult.REQUIRES_ELEVATION;
        }

        return SecurityResult.DENY;
    }
    
    canAccessCapability(context, capabilityId) {
        if (!context) return SecurityResult.DENY;
        
        // Phase 1: All capabilities are accessible by standard users,
        // but this provides the hook for future restricted capabilities.
        return SecurityResult.ALLOW;
    }

    canWriteToSystem(context) {
        if (!context) return SecurityResult.DENY;

        if (this.securityService.isSystem(context) || this.securityService.isKernel(context)) {
            return SecurityResult.ALLOW;
        }

        if (this.securityService.isAdministrator(context)) {
            if (context.elevated) {
                return SecurityResult.ALLOW;
            }
            return SecurityResult.REQUIRES_ELEVATION;
        }

        return SecurityResult.DENY;
    }

    canAccessPath(context, path, operation, metadata = null, parentMetadata = null) {
        if (!context) return SecurityResult.DENY;
        
        // System always has full access
        if (this.securityService.isSystem(context)) {
            return SecurityResult.ALLOW;
        }

        const isAdmin = this.securityService.isAdministrator(context);
        const isElevated = context.elevated === true;
        const username = context.identity;

        const parts = path.split('/').filter(p => p.length > 0);
        const rootDir = parts.length > 0 ? `/${parts[0]}` : '/';

        let structuralResult = SecurityResult.DENY;

        // 1. Immutable Runtime Directories (SYSTEM/KERNEL/PLATFORM)
        if (rootDir === '/system' || rootDir === '/kernel' || rootDir === '/platform') {
            structuralResult = (operation === 'read') ? SecurityResult.ALLOW : SecurityResult.DENY;
        }
        // 2. Snapshots
        else if (rootDir === '/snapshots') {
            if (isAdmin && operation === 'read') structuralResult = SecurityResult.ALLOW;
            else structuralResult = SecurityResult.DENY;
        }
        // 3. Configuration & Packages
        else if (rootDir === '/config' || rootDir === '/packages') {
            if (operation === 'read') {
                structuralResult = SecurityResult.ALLOW;
            } else if (operation === 'write' && isAdmin) {
                structuralResult = isElevated ? SecurityResult.ALLOW : SecurityResult.REQUIRES_ELEVATION;
            } else {
                structuralResult = SecurityResult.DENY;
            }
        }
        // 4. Temporary / Runtime
        else if (rootDir === '/tmp') {
            structuralResult = SecurityResult.ALLOW;
        }
        // 5. User Workspaces
        else if (rootDir === '/users') {
            const targetUser = parts[1];
            if (!targetUser) {
                // Listing /users
                structuralResult = (operation === 'read') ? SecurityResult.ALLOW : SecurityResult.DENY;
            } else if (targetUser === username) {
                structuralResult = SecurityResult.ALLOW;
            } else {
                // No access to other users' directories
                structuralResult = SecurityResult.DENY;
            }
        }
        // 6. Root Directory
        else if (rootDir === '/') {
            structuralResult = (operation === 'read') ? SecurityResult.ALLOW : SecurityResult.DENY;
        }
        // 7. Unknown paths deny by default for strictness
        else {
            structuralResult = SecurityResult.DENY;
        }

        // Evaluate ownership metadata for writes if structural access is allowed
        if (structuralResult === SecurityResult.ALLOW && operation === 'write') {
            if (rootDir !== '/tmp') {
                // If the file exists and is not owned by the user (and not system), deny write.
                if (metadata && metadata.owner && metadata.owner !== username && metadata.owner !== 'system') {
                    return SecurityResult.DENY;
                }
            }
        }

        return structuralResult;
    }
}
