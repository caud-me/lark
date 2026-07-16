# Component Lifecycle

The `ApplicationComponent` provides a structured way to build UI in LDE.

## 1. `constructor(context)`
Initialize your component state.

## 2. `render()`
Return a string of HTML. This is called automatically when the state changes.

## 3. `bindEvents()`
Called after the component is rendered and attached to the DOM. Use this to attach `addEventListener` to your elements.

## 4. `mount(parent)`
Attaches your component to a parent element in the DOM.

## 5. `unmount()`
Removes the component and cleans up listeners.

## Managing State
Use `this.setState({ key: value })`. This will automatically re-render the component and re-bind events.
