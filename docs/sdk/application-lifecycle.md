# Application Lifecycle

An application in LDE extends `BaseApplication`.

## 1. `constructor(context)`
Called when the application is loaded. Do not perform heavy work here.

## 2. `onLaunch(intent)`
Called when the application is actually started by the user or the system. This is where you typically create your window or begin background tasks.

## 3. `onForeground()` / `onBackground()`
Called when the application's window gains or loses focus. Use this to pause heavy animations or network polling.

## 4. `onExit()`
Called when the application is closed. Clean up any intervals, timeouts, or event listeners you created globally.
