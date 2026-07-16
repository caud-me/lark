# Extension Framework

Extensions allow your package to integrate deeply with the LDE Shell without running a full application.

## Types of Extensions
Currently supported extensions include:
- `Widget`: Displays content on the desktop or dashboard.
- `SearchProvider`: Feeds results into the system command palette or start menu.

## Defining an Extension
In your `manifest.json`, define the `extensions` array:

```json
{
    "extensions": [
        {
            "type": "Widget",
            "id": "my-widget",
            "name": "My Widget",
            "entryPoint": "/Widget.js"
        }
    ]
}
```

## Implementation
An extension typically exports a class with specific lifecycle methods like `mount(parent)` and `unmount()`. The system manages instantiation.
