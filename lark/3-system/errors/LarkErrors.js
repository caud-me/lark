/**
 * LarkErrors.js
 * 
 * Responsibility:
 * Defines the canonical OS Error Taxonomy for Lark OS 27.8.14.
 * Enforces explicit error classification across Kernel, System, Platform, and User-space domains.
 */

export class LarkBaseError extends Error {
    constructor(message, code = 'ERR_LARK_GENERIC', details = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

// --- Kernel Domain Errors ---

export class KernelError extends LarkBaseError {
    constructor(message, code = 'ERR_KERNEL', details = {}) {
        super(message, code, details);
    }
}

export class ContractViolationError extends KernelError {
    constructor(message, details = {}) {
        super(message, 'ERR_CONTRACT_VIOLATION', details);
    }
}

export class ServiceRegistrationError extends KernelError {
    constructor(serviceName, details = {}) {
        super(`ServiceRegistrationError: Service '${serviceName}' is not registered in ServiceRegistry.`, 'ERR_SERVICE_NOT_FOUND', { serviceName, ...details });
    }
}

export class DriverInitializationError extends KernelError {
    constructor(driverName, reason, details = {}) {
        super(`DriverInitializationError: Driver '${driverName}' failed to initialize: ${reason}`, 'ERR_DRIVER_INIT_FAILED', { driverName, reason, ...details });
    }
}

export class BootStageError extends KernelError {
    constructor(stageName, reason, details = {}) {
        super(`BootStageError: Boot stage '${stageName}' failed: ${reason}`, 'ERR_BOOT_STAGE_FAILED', { stageName, reason, ...details });
    }
}

// --- Platform / Runtime Domain Errors ---

export class RuntimeError extends LarkBaseError {
    constructor(message, code = 'ERR_RUNTIME', details = {}) {
        super(message, code, details);
    }
}

export class FileNotFoundError extends RuntimeError {
    constructor(path, details = {}) {
        super(`FileNotFoundError: Target file or directory not found at '${path}'`, 'ERR_FILE_NOT_FOUND', { path, ...details });
    }
}

export class PermissionDeniedError extends RuntimeError {
    constructor(operation, path, details = {}) {
        super(`PermissionDeniedError: Access denied for operation '${operation}' on '${path}'`, 'ERR_PERMISSION_DENIED', { operation, path, ...details });
    }
}

export class NetworkOfflineError extends RuntimeError {
    constructor(resource, details = {}) {
        super(`NetworkOfflineError: Network operation failed because system is offline: ${resource}`, 'ERR_NETWORK_OFFLINE', { resource, ...details });
    }
}

export class PackageNotFoundError extends RuntimeError {
    constructor(packageId, details = {}) {
        super(`PackageNotFoundError: Package '${packageId}' was not found in repository database`, 'ERR_PACKAGE_NOT_FOUND', { packageId, ...details });
    }
}
