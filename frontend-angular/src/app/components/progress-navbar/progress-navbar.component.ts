import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-progress-navbar',
    templateUrl: './progress-navbar.component.html',
    styleUrls: ['./progress-navbar.component.scss'],
    standalone: false
})
export class ProgressNavbarComponent {
  @Input() currentStep: number = 1;

  steps = [
    { label: 'Upload Dataset' },
    { label: 'Date Ranges' },
    { label: 'Model Training' },
    { label: 'Simulation' }
  ];
}

