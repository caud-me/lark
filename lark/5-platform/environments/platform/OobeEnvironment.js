import { oobeNameStep } from './steps/oobeNameStep.js';
import { oobePasswordStep } from './steps/oobePasswordStep.js';
import { oobeConfirmPasswordStep } from './steps/oobeConfirmPasswordStep.js';
import { oobeHintStep } from './steps/oobeHintStep.js';
import { oobeGraphicsStep } from './steps/oobeGraphicsStep.js';
import { setupCompleteStep } from './steps/setupCompleteStep.js';

/**
 * OobeEnvironment
 *
 * Responsibility:
 * Pure environment orchestrator for Out-Of-Box Experience (OOBE) user account configuration and personalization.
 * Owns OOBE navigation, credential validation, user profile context, and system setup completion events.
 *
 * Must NEVER:
 * - Create disks, wipe disks, or mount storage backends (owned by SetupEnvironment & VirtualDiskService)
 * - Contain DOM compositing logic (owned by PlatformEnvironmentSurface)
 *
 * Invariant:
 * Independently mountable — receives boot state from BootOrchestrator without assuming prior Setup Environment state.
 */
export class OobeEnvironment {
    constructor(serviceRegistry, initialStepId = 'oobeName') {
        this.registry = serviceRegistry;
        this.currentStepIndex = 0;
        this.workflow = [];
        this.context = this._createInitialContext();
        this.surface = null;

        this.initializeWorkflow();
        if (initialStepId) {
            this.jumpToStep(initialStepId);
        }
    }

    /**
     * Initializes explicit OOBE user account context object.
     */
    _createInitialContext() {
        return {
            userAccount: { name: 'Johnny Appleseed', password: '', passwordConfirm: '', hint: '' },
            selectedDisk: null,
            createdDrive: null,
            oobeState: 'INITIAL',
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
     * Assembles OOBE workflow step definitions.
     */
    initializeWorkflow() {
        this.workflow = [
            oobeNameStep,
            oobePasswordStep,
            oobeConfirmPasswordStep,
            oobeHintStep,
            oobeGraphicsStep,
            setupCompleteStep
        ];
    }
}
