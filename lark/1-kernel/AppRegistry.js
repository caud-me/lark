/**
 * AppRegistry
 *
 * Responsibility:
 * Acts as an application factory and runtime entrypoint resolver.
 * Also provides the list of built-in applications for initial system bootstrap.
 *
 * Does NOT:
 * - Launch applications or manage processes (ProcessService does this)
 */
export class AppRegistry {
    constructor() {
    }

    /**
     * Returns the built-in system applications used to bootstrap an empty system.
     * @returns {Array} List of default app definitions
     */
    getBuiltinApplications() {
        return [
            {
                id: 'sys.notepad',
                title: 'Notepad',
                name: 'Notepad',
                description: 'A lightweight text editor',
                icon: '<i>&#xE70F;</i>',
                category: 'Utilities',
                loader: 'builtin',
                entryPoint: 'lark/6-apps/system/Notepad.js',
                type: 'system',
                singleton: true,
                protected: false,
                hidden: false,
                version: '1.0',
                author: 'LDE Core',
                keywords: ['text', 'editor', 'txt', 'write'],
                permissions: [],
                capabilities: {
                    fileTypes: ['.txt', '.md', '.json']
                },
                intents: [
                    { action: 'textedit.open', description: 'Open a text file' },
                    { action: 'open-file', description: 'Open a text file' }
                ]
            },
            {
                id: 'sys.eventviewer',
                title: 'Event Viewer',
                name: 'Event Viewer',
                description: 'System logging and diagnostic viewer',
                icon: '<i>&#xE9D9;</i>',
                category: 'System',
                loader: 'builtin',
                entryPoint: 'lark/6-apps/system/EventViewer.js',
                type: 'system',
                singleton: true,
                protected: false,
                hidden: false,
                version: '2.0',
                author: 'LDE Core',
                keywords: ['logs', 'diagnostics', 'events', 'syslog'],
                permissions: []
            },
            {
                id: 'sys.activitymonitor',
                title: 'Actvity Monitor',
                name: 'Actvity Monitor',
                description: 'Process and performance monitoring',
                icon: '<i>&#xE9D2;</i>',
                category: 'System',
                loader: 'builtin',
                entryPoint: 'lark/6-apps/system/TaskManager.js',
                type: 'system',
                singleton: true,
                protected: false,
                hidden: false,
                version: '1.0.0',
                author: 'LDE Core',
                keywords: ['processes', 'performance', 'cpu', 'memory'],
                permissions: []
            },
            {
                id: 'sys.terminal',
                title: 'Terminal',
                name: 'Terminal',
                description: 'Command line interface',
                icon: '<i>&#xE756;</i>',
                category: 'System',
                loader: 'builtin',
                entryPoint: 'lark/6-apps/system/Terminal.js',
                type: 'system',
                singleton: false,
                protected: false,
                hidden: false,
                capabilities: {
                    fileTypes: ['.txt', '.md'],
                    mimeTypes: ['text/plain']
                },
                defaultAction: 'open',
                version: '1.0.0',
                author: 'LDE Core', 
                keywords: ['cli', 'command', 'shell', 'prompt'],
                permissions: ['filesystem.read', 'filesystem.write', 'process.manage'],
                extensions: [
                    {
                        id: 'command-search',
                        type: 'search-provider',
                        entryPoint: 'lark/5-platform/search/providers/CommandSearchProvider.js'
                    }
                ],
                searchableIntents: [
                    {
                        title: "Execute Command",
                        keywords: ["run", "cli", "terminal", "prompt", "bash", "execute", "shell"],
                        icon: "<i>&#xE756;</i>",
                        intent: { type: "terminal.execute", payload: { command: "help" } }
                    }
                ]
            },
            {
                id: 'sys.settings',
                title: 'Settings',
                name: 'Settings',
                description: 'System configuration and preferences',
                icon: '<i>&#xE713;</i>',
                category: 'System',
                loader: 'builtin',
                entryPoint: 'lark/6-apps/system/Settings.js',
                type: 'system',
                singleton: true,
                protected: false,
                hidden: false,
                version: '1.0.2',
                author: 'LDE Core',
                keywords: ['preferences', 'configuration', 'options'],
                permissions: ['settings.read', 'settings.write'],
                searchableIntents: [
                    {
                        title: "Personalization",
                        keywords: ["wallpaper", "background", "desktop", "theme", "appearance", "dark mode", "light mode"],
                        icon: "<i>&#xE771;</i>",
                        intent: { type: "settings.openPage", payload: { page: "personalization" } }
                    },
                    {
                        title: "Accounts",
                        keywords: ["users", "profiles", "passwords", "security", "login", "identity"],
                        icon: "<i>&#xE77B;</i>",
                        intent: { type: "settings.openPage", payload: { page: "users" } }
                    },
                    {
                        title: "System Details",
                        keywords: ["about", "version", "info", "specs", "hardware", "device"],
                        icon: "<i>&#xE7F8;</i>",
                        intent: { type: "settings.openPage", payload: { page: "system" } }
                    },
                    {
                        title: "Developer Options",
                        keywords: ["dev", "debug", "tools", "flags", "experimental"],
                        icon: "<i>&#xE710;</i>",
                        intent: { type: "settings.openPage", payload: { page: "developer" } }
                    }
                ]
            },
            {
                id: 'sys.finder',
                title: 'Finder',
                name: 'Finder',
                description: 'Explore and manage local storage',
                icon: '<i>&#xE8B7;</i>',
                category: 'System',
                loader: 'builtin',
                entryPoint: 'lark/6-apps/system/FileManager.js',
                type: 'system',
                singleton: false,
                protected: false,
                hidden: false,
                version: '1.0.0',
                author: 'LDE Core',
                keywords: ['files', 'explorer', 'storage', 'folders', 'finder'],
                permissions: ['filesystem.read', 'filesystem.write'],
                extensions: [
                    {
                        id: 'file-search',
                        type: 'search-provider',
                        entryPoint: 'lark/5-platform/search/providers/FileSearchProvider.js'
                    }
                ],
                searchableIntents: [
                    {
                        title: "Documents",
                        keywords: ["files", "docs", "text", "work", "papers"],
                        icon: "<i>&#xE8A5;</i>",
                        intent: { type: "files.openDirectory", payload: { path: "~/Documents" } }
                    },
                    {
                        title: "Downloads",
                        keywords: ["files", "downloads", "incoming", "web", "saved"],
                        icon: "<i>&#xE896;</i>",
                        intent: { type: "files.openDirectory", payload: { path: "~/Downloads" } }
                    },
                    {
                        title: "Desktop Files",
                        keywords: ["files", "desktop", "workspace", "home"],
                        icon: "<i>&#xE9F5;</i>",
                        intent: { type: "files.openDirectory", payload: { path: "~/Desktop" } }
                    }
                ]
            },
            {
                id: 'sys.softwarecenter',
                title: 'Software Center',
                name: 'Software Center',
                description: 'Discover and install applications',
                icon: '<i>&#xE719;</i>',
                category: 'System',
                loader: 'builtin',
                entryPoint: 'lark/6-apps/system/SoftwareCenter.js',
                type: 'system',
                singleton: true,
                protected: false,
                hidden: false,
                version: '1.0.0',
                author: 'LDE Core',
                keywords: ['store', 'packages', 'install', 'marketplace'],
                permissions: ['packages.manage'],
                extensions: [
                    {
                        id: 'package-search',
                        type: 'search-provider',
                        entryPoint: 'lark/5-platform/search/providers/PackageSearchProvider.js'
                    }
                ]
            },
            {
                id: 'sys.guardian',
                title: 'Guardian',
                name: 'Guardian',
                description: 'Platform health, integrity, and architecture verification dashboard',
                icon: '<i>&#xEA18;</i>',
                category: 'System',
                loader: 'builtin',
                entryPoint: 'lark/6-apps/system/Guardian.js',
                type: 'system',
                singleton: true,
                protected: false,
                hidden: false,
                version: '1.0.0',
                author: 'LDE Core',
                permissions: [],
                startup: {
                    enabled: true,
                    intent: 'guardian.scan',
                    reason: 'Executes automatic platform health scan on desktop startup.'
                },
                runtime: {
                    startup: {
                        enabled: true,
                        intent: 'guardian.scan',
                        reason: 'Executes automatic platform health scan on desktop startup.'
                    }
                }
            }
        ];
    }
}
