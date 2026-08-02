/**
 * ShellComponent
 *
 * Base contract for reusable Desktop Environment presentation components.
 * Shell components are purely presentational and must use the provided
 * ServiceRegistry to query state and subscribe to semantic events.
 */
export class ShellComponent {
    /**
     * Initializes the component with access to platform services.
     * @param {Object} registry - The ServiceRegistry
     * @param {Object} environment - The parent DesktopEnvironment instance
     */
    initialize(registry, environment) {
        this.registry = registry;
        this.environment = environment;
        this.element = null;
    }

    /**
     * Injects the component's DOM into the target container.
     * @param {HTMLElement} container - The DOM container to append into
     */
    mount(container) {
        if (this.element && container) {
            container.appendChild(this.element);
        }
    }

    /**
     * Resumes the component. Should be used to subscribe to EventBus.
     */
    resume() {
        // Override to subscribe to events
    }

    /**
     * Suspends the component. Should be used to unsubscribe from EventBus.
     */
    suspend() {
        // Override to unsubscribe from events
    }

    /**
     * Destroys the component, cleaning up DOM and references.
     */
    destroy() {
        if (this.element) {
            this.element.remove();
        }
        this.suspend();
    }
}
