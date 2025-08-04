import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-current-tab', // <-- changed selector
  templateUrl: './current-tab.component.html', // <-- changed file reference
  styleUrls: ['./current-tab.component.scss'] // <-- changed file reference
})
export class CurrentTabComponent {
  constructor(public router: Router) {}

  getCurrentStep(): number {
    const url = this.router.url;
    if (url.includes('/upload')) return 1;
    if (url.includes('/date-ranges')) return 2;
    if (url.includes('/train-model')) return 3;
    if (url.includes('/simulation')) return 4;
    return 0;
  }

  isStepCompleted(step: number): boolean {
    // You can improve this by using localStorage or a service state later
    const currentStep = this.getCurrentStep();
    return step < currentStep;
  }

  getStepClass(step: number): string {
    const current = this.getCurrentStep();
    if (step === current) return 'step active';
    if (step < current) return 'step completed';
    return 'step';
  }
}
