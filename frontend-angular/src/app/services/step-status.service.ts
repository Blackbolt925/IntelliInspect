import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StepStatusService {
  private stepStatus = {
    upload: false,
    dateRanges: false,
    trainModel: false
  };

  markStepComplete(step: keyof typeof this.stepStatus): void {
    this.stepStatus[step] = true;
    localStorage.setItem(`step-${step}`, 'true');
  }

  isStepComplete(step: keyof typeof this.stepStatus): boolean {
    const stored = localStorage.getItem(`step-${step}`);
    return stored === 'true';
  }

  resetAll(): void {
    Object.keys(this.stepStatus).forEach((k) => {
      localStorage.removeItem(`step-${k}`);
    });
  }
}
