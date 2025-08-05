import { Component } from '@angular/core';
import { SimulationService } from '../../services/simulation.service';

@Component({
    selector: 'app-simulation',
    templateUrl: './simulation.component.html',
    styleUrls: ['./simulation.component.scss'],
    standalone: false
})
export class SimulationComponent {
  isRunning = false;
  isCompleted = false;
  records: any[] = [];

  total = 0;
  passCount = 0;
  failCount = 0;
  avgConfidence = 0;

  lineChartData: any[] = [];
  donutChartData: any = { pass: 0, fail: 0 };

  constructor(private simService: SimulationService) {}

  startSimulation(): void {
    this.isRunning = true;
    this.records = [];
    this.total = this.passCount = this.failCount = this.avgConfidence = 0;

    this.simService.startSimulation().subscribe({
      next: (res: any) => {
        this.records.push(res);
        this.total++;

        if (res.prediction === 'Pass') this.passCount++;
        else this.failCount++;

        this.avgConfidence = (
          (this.avgConfidence * (this.total - 1) + res.confidence) / this.total
        );

        this.lineChartData.push({ time: res.time, value: res.confidence });
        this.donutChartData = {
          pass: this.passCount,
          fail: this.failCount
        };
      },
      complete: () => {
        this.isRunning = false;
        this.isCompleted = true;
      },
      error: () => {
        this.isRunning = false;
        this.isCompleted = true;
      }
    });
  }

  restart(): void {
    this.isCompleted = false;
    this.startSimulation();
  }
}
