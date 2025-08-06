// progress-navbar.component.ts
import { Component, Input } from '@angular/core';

// Define an interface for the step objects
interface Step {
  label: string;
  title: string;
}

@Component({
    selector: 'app-progress-navbar',
    templateUrl: './progress-navbar.component.html',
    styleUrls: ['./progress-navbar.component.scss'],
    standalone: false
})
export class ProgressNavbarComponent {
  @Input() currentStep: number = 1; // Changed default to 1 to match "Date Range Selection" as active

  steps: Step[] = [
    { label: 'Upload Dataset', title: 'Upload Dataset' },
    { label: 'Date Ranges', title: 'Date Range Selection' },
    { label: 'Model Training', title: 'Model Training & Evaluation' },
    { label: 'Simulation', title: 'Real-Time Prediction Simulation' }
  ];

  // Optional: Method to navigate to a specific step
  goToStep(stepIndex: number): void {
    if (stepIndex <= this.currentStep) {
      this.currentStep = stepIndex;
    }
  }

  // Optional: Method to go to next step
  nextStep(): void {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  // Optional: Method to go to previous step
  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }
}
