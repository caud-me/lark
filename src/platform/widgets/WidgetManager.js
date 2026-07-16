import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * WidgetManager
 * 
 * Responsibility:
 * Owns the mutable state of active widget instances on the desktop[cite: 6].
 * Persists instance layouts and configurations to the filesystem[cite: 6].
 */
export class WidgetManager {
    constructor() {
        this.instances = []; //[cite: 6]
        this.nextInstanceId = 1; //[cite: 6]
    }

    setWidgets(instances, nextInstanceId) {
        this.instances = instances || []; //[cite: 6]
        this.nextInstanceId = nextInstanceId || 1; //[cite: 6]
    }

    getWidgetState() {
        return {
            instances: this.instances, //[cite: 6]
            nextInstanceId: this.nextInstanceId //[cite: 6]
        };
    }

    addInstance(widgetId, x = 100, y = 100, w = 240, h = 120, config = {}) {
        const instanceId = `widget-${this.nextInstanceId++}`; //[cite: 6]
        
        let targetX = x;
        let targetY = y;

        // Establishes horizontal/vertical step intervals (dimension + visual gap)
        const horizontalStep = 260; 
        const verticalStep = 140;   
        const screenRightBoundary = 1000; // Soft wrap boundary limit

        let collisionFound = true;
        let protectionCounter = 0;

        // Scan existing instances to prevent coordinate stacking[cite: 6]
        while (collisionFound && protectionCounter < 50) {
            let currentCollision = false;

            for (let i = 0; i < this.instances.length; i++) {
                const existing = this.instances[i];
                if (existing.x === targetX && existing.y === targetY) {
                    currentCollision = true;
                    break;
                }
            }

            if (currentCollision) {
                targetX += horizontalStep;
                // If we reach too far right, drop to the next row and reset X anchor
                if (targetX > screenRightBoundary) {
                    targetX = x;
                    targetY += verticalStep;
                }
                protectionCounter++;
            } else {
                collisionFound = false;
            }
        }

        const instance = {
            instanceId,
            widgetId,
            x: targetX,
            y: targetY,
            width: w,
            height: h,
            config
        };

        this.instances.push(instance); //[cite: 6]
        
        EventBus.emit('widget:added', { //[cite: 6]
            severity: 'Info', //[cite: 6]
            source: 'WidgetManager', //[cite: 6]
            message: `Widget added: ${widgetId}`, //[cite: 6]
            instance //[cite: 6]
        });

        return instance; //[cite: 6]
    }

    removeInstance(instanceId) {
        const initialLength = this.instances.length; //[cite: 6]
        this.instances = this.instances.filter(w => w.instanceId !== instanceId); //[cite: 6]
        if (this.instances.length !== initialLength) { //[cite: 6]
            EventBus.emit('widget:removed', { //[cite: 6]
                severity: 'Info', //[cite: 6]
                source: 'WidgetManager', //[cite: 6]
                message: `Widget removed: ${instanceId}`, //[cite: 6]
                instanceId //[cite: 6]
            });
            return true; //[cite: 6]
        }
        return false; //[cite: 6]
    }

    updateInstance(instanceId, updates) {
        const instance = this.instances.find(w => w.instanceId === instanceId); //[cite: 6]
        if (instance) { //[cite: 6]
            if (updates.x !== undefined) instance.x = updates.x; //[cite: 6]
            if (updates.y !== undefined) instance.y = updates.y; //[cite: 6]
            if (updates.width !== undefined) instance.width = updates.width; //[cite: 6]
            if (updates.height !== undefined) instance.height = updates.height; //[cite: 6]
            if (updates.config !== undefined) instance.config = { ...instance.config, ...updates.config }; //[cite: 6]
            EventBus.emit('widget:moved', { //[cite: 6]
                severity: 'Info', //[cite: 6]
                source: 'WidgetManager', //[cite: 6]
                message: `Widget moved/updated: ${instanceId}`, //[cite: 6]
                instanceId //[cite: 6]
            });
            return true; //[cite: 6]
        }
        return false; //[cite: 6]
    }

    getInstances() {
        return this.instances; //[cite: 6]
    }
}