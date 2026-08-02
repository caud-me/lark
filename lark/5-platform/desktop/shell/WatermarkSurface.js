import { ShellComponent } from './ShellComponent.js';
import { SYSTEM_INFO } from '../../../3-system/SystemVersion.js';

export class WatermarkSurface extends ShellComponent {
    initialize(registry, environment) {
        super.initialize(registry, environment);
        
        this.element = document.createElement('div');
        this.element.className = 'lde-watermark-surface';
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.element.style.pointerEvents = 'none';
        this.element.style.zIndex = '9999';
    }

    resume() {
        this.element.innerHTML = '';
        const recoveryService = this.registry.get('RecoveryService');
        const safeMode = recoveryService ? recoveryService.isSafeMode() : false;

        if (safeMode) {
            this._renderSafeModeWatermarks();
        } else {
            this._renderDevBuild();
        }
    }

    _renderSafeModeWatermarks() {
        const positions = [
            { top: '12px', left: '12px' },
            { top: '12px', right: '12px' },
            { bottom: '48px', left: '12px' },
            { bottom: '48px', right: '12px' }
        ];
        
        positions.forEach(pos => {
            const watermark = document.createElement('p');
            watermark.textContent = 'Safe Mode';
            watermark.classList.add('omni-watermark-text');
            watermark.style.position = 'absolute';
            Object.assign(watermark.style, pos);
            watermark.style.pointerEvents = 'none';
            this.element.appendChild(watermark);
        });
    }

    _renderDevBuild() {
        const watermark = document.createElement('p');
        watermark.classList.add('omni-watermark-text');
        
        const line1 = document.createElement('span');
        line1.textContent = SYSTEM_INFO.name;
        watermark.appendChild(line1);
        
        watermark.appendChild(document.createElement('br'));
        
        const line2 = document.createElement('span');
        line2.textContent = SYSTEM_INFO.watermarkVersion;
        watermark.appendChild(line2);
        
        watermark.appendChild(document.createElement('br'));
        
        const line3 = document.createElement('span');
        line3.textContent = 'Release preview, report for issues.';
        watermark.appendChild(line3);

        watermark.style.position = 'absolute';
        watermark.style.bottom = '48px';
        watermark.style.right = '12px';
        watermark.style.textAlign = 'right';
        watermark.style.pointerEvents = 'none';
        this.element.appendChild(watermark);
    }
}
