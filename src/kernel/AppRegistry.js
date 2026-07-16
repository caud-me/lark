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
                id: 'sys.eventviewer',
                title: 'Event Viewer',
                name: 'Event Viewer',
                description: 'System logging and diagnostic viewer',
                icon: '📋',
                category: 'System',
                loader: 'builtin',
                entryPoint: '/src/apps/system/EventViewer.js',
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
                id: 'sys.taskmanager',
                title: 'Task Manager',
                name: 'Task Manager',
                description: 'Process and performance monitoring',
                icon: '📈',
                category: 'System',
                loader: 'builtin',
                entryPoint: '/src/apps/system/TaskManager.js',
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
                icon: '▶️',
                category: 'System',
                loader: 'builtin',
                entryPoint: '/src/apps/system/Terminal.js',
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
                        entryPoint: '/src/platform/search/providers/CommandSearchProvider.js'
                    }
                ],
                searchableIntents: [
                    {
                        title: "Execute Command",
                        keywords: ["run", "cli", "terminal", "prompt", "bash", "execute", "shell"],
                        icon: "▶️",
                        intent: { type: "terminal.execute", payload: { command: "help" } }
                    }
                ]
            },
            {
                id: 'sys.settings',
                title: 'Settings',
                name: 'Settings',
                description: 'System configuration and preferences',
                icon: '⚙️',
                category: 'System',
                loader: 'builtin',
                entryPoint: '/src/apps/system/Settings.js',
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
                        icon: "🎨",
                        intent: { type: "settings.openPage", payload: { page: "personalization" } }
                    },
                    {
                        title: "Accounts",
                        keywords: ["users", "profiles", "passwords", "security", "login", "identity"],
                        icon: "👤",
                        intent: { type: "settings.openPage", payload: { page: "users" } }
                    },
                    {
                        title: "System Details",
                        keywords: ["about", "version", "info", "specs", "hardware", "device"],
                        icon: "💻",
                        intent: { type: "settings.openPage", payload: { page: "system" } }
                    },
                    {
                        title: "Developer Options",
                        keywords: ["dev", "debug", "tools", "flags", "experimental"],
                        icon: "🛠️",
                        intent: { type: "settings.openPage", payload: { page: "developer" } }
                    }
                ]
            },
            {
                id: 'sys.filemanager',
                title: 'File Manager',
                name: 'File Manager',
                description: 'Explore and manage local storage',
                icon: '📁',
                category: 'System',
                loader: 'builtin',
                entryPoint: '/src/apps/system/FileManager.js',
                type: 'system',
                singleton: false,
                protected: false,
                hidden: false,
                version: '1.0.0',
                author: 'LDE Core',
                keywords: ['files', 'explorer', 'storage', 'folders'],
                permissions: ['filesystem.read', 'filesystem.write'],
                extensions: [
                    {
                        id: 'file-search',
                        type: 'search-provider',
                        entryPoint: '/src/platform/search/providers/FileSearchProvider.js'
                    }
                ],
                searchableIntents: [
                    {
                        title: "Documents",
                        keywords: ["files", "docs", "text", "work", "papers"],
                        icon: "📄",
                        intent: { type: "files.openDirectory", payload: { path: "~/Documents" } }
                    },
                    {
                        title: "Downloads",
                        keywords: ["files", "downloads", "incoming", "web", "saved"],
                        icon: "📥",
                        intent: { type: "files.openDirectory", payload: { path: "~/Downloads" } }
                    },
                    {
                        title: "Desktop Files",
                        keywords: ["files", "desktop", "workspace", "home"],
                        icon: "🖥️",
                        intent: { type: "files.openDirectory", payload: { path: "~/Desktop" } }
                    }
                ]
            },
            {
                id: 'sys.softwarecenter',
                title: 'Software Center',
                name: 'Software Center',
                description: 'Discover and install applications',
                icon: '🛍️',
                category: 'System',
                loader: 'builtin',
                entryPoint: '/src/apps/system/SoftwareCenter.js',
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
                        entryPoint: '/src/platform/search/providers/PackageSearchProvider.js'
                    }
                ]
            }
        ];
    }
}
