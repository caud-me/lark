# Shell Primitives

LDE provides several primitive components that applications can use to build consistent interfaces.

## Windows
Windows are the primary way applications display content. You create a window using `this.context.window.create()`. Windows automatically handle dragging, resizing, and closing.

## Context Menus
Use the `contextMenu:show` capability to show native context menus anywhere in your application.

## Dialogs
Use the `dialog:show` capability to prompt users for confirmation or information without building your own modals.

## Notifications
Use the `notifications:show` capability to alert the user of important background events.
