export default {
    run: async (registry, pid) => {
        // We do not create a window.
        // Instead, we just run background logic or register intents.
        
        const DialogService = registry.get('DialogService');

        setInterval(async () => {
            if (DialogService) {
                await DialogService.alert('This is a background notification.', 'Background App');
            }
        }, 60000);
    }
};
