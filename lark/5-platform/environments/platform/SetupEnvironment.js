import { welcomeStep } from './steps/welcomeStep.js';
import { diskCheckStep } from './steps/diskCheckStep.js';
import { createDiskWizardStep } from './steps/createDiskWizardStep.js';
import { virtualDiskCreatedStep } from './steps/virtualDiskCreatedStep.js';
import { installedConfirmationStep } from './steps/installedConfirmationStep.js';

/**
 * SetupEnvironment
 *
 * Responsibility:
 * Pure environment orchestrator for Lark OS System Disk Installation.
 * Owns storage discovery, disk selection, disk wizard navigation, formatting, and installation restart handoff.
 *
 * Must NEVER:
 * - Create users, validate passwords, or manage user personalization (owned by OobeEnvironment & UserService)
 * - Contain DOM compositing logic (owned by PlatformEnvironmentSurface)
 * - Manipulate low-level storage drivers directly (owned by VirtualDiskService)
 *
 * Invariant:
 * Independently mountable — receives boot state from BootOrchestrator without assuming OOBE Environment state.
 */
export class SetupEnvironment {
    constructor(serviceRegistry) {
        this.registry = serviceRegistry;
        this.currentStepIndex = 0;
        this.workflow = [];
        this.context = this._createInitialContext();
        this.surface = null;

        this.initializeWorkflow();
    }

    /**
     * Initializes explicit Installer context object.
     */
    _createInitialContext() {
        return {
            selectedDisk: null,
            createdDrive: null,
            availableDisks: [],
            storageCapabilities: { hasIndexedDB: false, estimatedQuotaMb: 1024, browserName: 'Browser' },
            installerState: 'INITIAL',
            errors: []
        };
    }

    /**
     * Navigation API: Returns active step instance.
     */
    getCurrentStep() {
        return this.workflow[this.currentStepIndex] || null;
    }

    canProceed() {
        const step = this.getCurrentStep();
        if (!step) return false;
        if (typeof step.canProceed === 'function') {
            return step.canProceed(this.context);
        }
        return true;
    }

    canGoBack() {
        return this.currentStepIndex > 0;
    }

    async next() {
        const current = this.getCurrentStep();
        if (current && typeof current.validate === 'function') {
            const isValid = await current.validate(this.context, this);
            if (!isValid) return false;
        }

        if (current && typeof current.onNext === 'function') {
            await current.onNext(this.context, this);
        }

        if (this.currentStepIndex < this.workflow.length - 1) {
            if (current && typeof current.onLeave === 'function') {
                current.onLeave(this.context, this);
            }
            this.currentStepIndex++;
            const nextStep = this.getCurrentStep();
            if (nextStep && typeof nextStep.onEnter === 'function') {
                await nextStep.onEnter(this.context, this);
            }
            this._notifyStepChanged();
            return true;
        }
        return false;
    }

    previous() {
        if (this.canGoBack()) {
            const current = this.getCurrentStep();
            if (current && typeof current.onLeave === 'function') {
                current.onLeave(this.context, this);
            }
            this.currentStepIndex--;
            const prevStep = this.getCurrentStep();
            if (prevStep && typeof prevStep.onEnter === 'function') {
                prevStep.onEnter(this.context, this);
            }
            this._notifyStepChanged();
            return true;
        }
        return false;
    }

    async jumpToStep(stepId) {
        const idx = this.workflow.findIndex(s => s.id === stepId);
        if (idx !== -1) {
            const current = this.getCurrentStep();
            if (current && typeof current.onLeave === 'function') {
                current.onLeave(this.context, this);
            }
            this.currentStepIndex = idx;
            const newStep = this.getCurrentStep();
            if (newStep && typeof newStep.onEnter === 'function') {
                await newStep.onEnter(this.context, this);
            }
            this._notifyStepChanged();
        }
    }

    getContext() {
        return this.context;
    }

    _notifyStepChanged() {
        if (this.surface && typeof this.surface.renderActiveStep === 'function') {
            this.surface.renderActiveStep();
        }
    }

    /**
     * Assembles Installer workflow step definitions.
     */
    initializeWorkflow() {
        this.workflow = [
            welcomeStep,
            diskCheckStep,
            createDiskWizardStep,
            virtualDiskCreatedStep,
            installedConfirmationStep
        ];
    }
}
