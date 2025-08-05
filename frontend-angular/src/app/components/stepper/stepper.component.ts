import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-stepper',
    templateUrl: './stepper.component.html',
    styleUrls: ['./stepper.component.scss'],
    standalone: false
})
export class StepperComponent {
  @Input() activeStep: number = 1;

  steps = [
    { number: 1, label: 'Upload Dataset' },
    { number: 2, label: 'Date Ranges' },
    { number: 3, label: 'Train Model' },
    { number: 4, label: 'Simulation' }
  ];
}
