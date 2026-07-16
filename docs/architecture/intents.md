# Application Intents Architecture

## Overview
Lark OS uses an **Application Intent** architecture to decouple process invocation from application-specific behavior. Intents allow discrete parts of the system (e.g. Spotlight Search, the File Manager) to request actions from applications without needing to understand how those applications are implemented.

An Intent is a standardized message describing an action that a user or system component wants an application to perform. 

## Intent Lifecycle

The lifecycle of an Intent strictly adheres to the Single Responsibility Principle:

```mermaid
graph TD
    Sender[Intent Sender<br>e.g. Spotlight, File Manager] -->|Dispatches Intent| IntentService(ApplicationIntentService)
    
    IntentService -->|Checks Registry| SingletonCheck{Is App Running & Singleton?}
    
    SingletonCheck -->|Yes| RuntimeDelivery[Resolve Module &<br>Call onIntent()]
    SingletonCheck -->|No| ProcessLaunch[Start Process]
    
    ProcessLaunch -->|options.intent| ProcessService(ProcessService)
    
    ProcessService -->|Run Module| AppRun[Application.run()]
    
    RuntimeDelivery --> App(Application)
    AppRun --> App
```

### 1. The Sender
A sender (such as `CommandSearchProvider` or `FileService`) discovers that an action needs to happen. 
The sender **must never** attempt to execute application logic or interact with `ProcessService` directly when dispatching an intent. It simply constructs an Intent payload and asks `ApplicationIntentService` to deliver it.

### 2. The Application Router (`ApplicationIntentService`)
`ApplicationIntentService` is the central clearinghouse for all intents.
It receives the requested application ID and the intent payload. It makes the architectural decision of whether to:
- Route the intent to an existing instance of the application (if the app is defined as a singleton and is already running).
- Request a new process from `ProcessService`, attaching the intent to the launch options.

### 3. Process Creation (`ProcessService`)
`ProcessService` creates processes. It is a strictly generic lifecycle manager. 
It receives `options` from the caller and blindly passes those options into the application's `run()` hook upon module load. It does not inspect intents or route singletons.

### 4. Application Reception
Applications receive intents in two ways:
1. **On Launch:** The intent is extracted from the `options` object provided to `module.default.run(registry, pid, options)`.
2. **At Runtime:** The intent is delivered directly to `module.default.onIntent(registry, pid, intent)` by the `ApplicationIntentService`.

## Intent Schema

Intents are simple objects with a namespaced `type` and a `payload`. 
Namespacing ensures that future protocols do not collide.

```javascript
{
    type: "terminal.execute",
    payload: {
        command: "ls"
    }
}
```

Common future namespaces might include:
- `terminal.execute`, `terminal.openProfile`
- `files.open`, `files.reveal`
- `settings.openPage`
- `music.play`, `music.pause`

## Strict Architectural Rules

When modifying or extending the Intent system, the following rules must be observed:

1. **Intents are immutable:** Once an intent is dispatched, it must not be mutated by the router or process manager.
2. **Senders never call applications directly:** Components must never attempt to invoke an application's methods. All cross-boundary communication must flow through `ApplicationIntentService`.
3. **Routing always goes through ApplicationIntentService:** `ProcessService` manages process trees; `ApplicationIntentService` manages application routing. 
4. **Applications own their own intent types:** The receiving application dictates what namespaces and payload structures it expects. The system simply transports them.
5. **Services never execute application behavior:** `ApplicationIntentService` and `ProcessService` do not know what `terminal.execute` means. Their only job is delivery.
