# Capability Framework

The Capability Framework is how LDE applications interact with system resources securely.

## What is a Capability?
A capability is a specific action (e.g., `dialog:show`, `network:fetch`) that an application can invoke.

## Declaring Permissions
Before you can invoke a capability, you must declare it in your `manifest.json`:

```json
{
    "permissions": ["dialog:show"]
}
```

## Invoking Capabilities
You invoke a capability via the context:

```js
const result = await this.context.capabilities.invoke('dialog:show', {
    title: 'Hello',
    message: 'World'
});
```

If you do not have permission, the invocation will fail or prompt the user.
