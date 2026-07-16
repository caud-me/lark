# Dialog Application Template

This template demonstrates how to use the OS capability framework to show native system dialogs.

## Architecture
Rather than building HTML modals, LDE provides a capability (`dialog:show`) that interfaces with the system's DialogManager.

## Concepts demonstrated
- Requesting permissions in `manifest.json`
- Using `context.capabilities.invoke()`
- Handling capability results async
