# Theme Integration

LDE has a powerful theming engine. Applications should adapt to the system theme rather than hardcoding colors.

## CSS Variables
The OS provides a set of CSS variables on the `:root` element that applications should consume:

- `--bg-color`: The primary background color.
- `--text-color`: The primary text color.
- `--surface-1`, `--surface-2`: Layered background colors for depth.
- `--border-color`: Standard border color.
- `--accent-color`: Primary highlight/accent color.

## Example
Instead of `background-color: white; color: black;`, write:

```css
.my-container {
    background-color: var(--bg-color);
    color: var(--text-color);
    border: 1px solid var(--border-color);
}
```

This ensures your application automatically supports Light Mode, Dark Mode, and any custom themes the user installs.
