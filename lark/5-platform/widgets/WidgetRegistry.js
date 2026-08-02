export class WidgetRegistry {
    constructor() {
        this.widgets = new Map();
        this._registerBuiltins();
    }
    
    _registerBuiltins() {
        this.register({
            id: 'clock',
            type: 'widget',
            name: 'Clock',
            description: 'Digital clock',
            entryPoint: '../../widgets/ClockWidget.js',
            providerId: 'sys.widgets'
        });
        this.register({
            id: 'calendar',
            type: 'widget',
            name: 'Calendar',
            description: 'Date and day viewer',
            entryPoint: '../../widgets/CalendarWidget.js',
            providerId: 'sys.widgets'
        });
        this.register({
            id: 'weather',
            type: 'widget',
            name: 'Weather',
            description: 'Local conditions',
            entryPoint: '../../widgets/WeatherWidget.js',
            providerId: 'sys.widgets'
        });
        this.register({
            id: 'notes',
            type: 'widget',
            name: 'Quick Notes',
            description: 'Scratchpad',
            entryPoint: '../../widgets/NotesWidget.js',
            providerId: 'sys.widgets'
        });
    }

    register(widget) {
        this.widgets.set(widget.id, widget);
    }
    
    getBuiltIns() {
        return Array.from(this.widgets.values());
    }
}
