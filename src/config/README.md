# Runtime Configuration

Reserved for future runtime configuration. Intentionally empty in Series 5.

**Planned purpose:** Static or environment-specific configuration that does not belong in`SettingsManager` (which owns mutable user preferences) or `SystemVersion.js` (which owns
version constants). Examples: feature flags, default locale, build-time constants.
