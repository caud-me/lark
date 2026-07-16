/**
 * EnvironmentType
 *
 * Defines the rigid classification types for all Lark OS Environments.
 */
export const EnvironmentType = Object.freeze({
    BOOT: Symbol('BOOT'),
    LOGIN: Symbol('LOGIN'),
    RECOVERY: Symbol('RECOVERY'),
    WELCOME: Symbol('WELCOME'),
    LOCK: Symbol('LOCK'),
    DESKTOP: Symbol('DESKTOP'),
    SHUTDOWN: Symbol('SHUTDOWN')
});
