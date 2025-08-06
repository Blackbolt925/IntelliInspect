import { Component } from '@angular/core';
import { SimulationService } from '../../services/simulation.service';
import { ChartConfiguration } from 'chart.js';

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

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Quality Score',
        borderColor: '#3b82f6',
        tension: 0.3,
        fill: false,
        pointRadius: 3
      }
    ]
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    scales: {
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: 'Confidence (%)' }
      },
      x: {
        title: { display: true, text: 'Time' }
      }
    }
  };

  donutChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Pass', 'Fail'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#10b981', '#ef4444']
      }
    ]
  };

  donutChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  };

  constructor(private simService: SimulationService) {}

  startSimulation(): void {
    this.isRunning = true;
    this.isCompleted = false;
    this.records = [];
    this.total = this.passCount = this.failCount = this.avgConfidence = 0;

    this.lineChartData.labels = [];
    this.lineChartData.datasets[0].data = [];

    this.simService.startSimulation().subscribe({
      next: (res: any) => {
        this.records.push(res);
        this.total++;

        if (res.prediction === 'Pass') this.passCount++;
        else this.failCount++;

        this.avgConfidence = (
          (this.avgConfidence * (this.total - 1) + res.confidence) / this.total
        );

        this.lineChartData.labels!.push(res.time);
        this.lineChartData.datasets[0].data.push(res.confidence);

        this.donutChartData.datasets[0].data = [this.passCount, this.failCount];

        // 🔧 Trigger view update
        this.lineChartData = { ...this.lineChartData };
        this.donutChartData = { ...this.donutChartData };
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
    this.startSimulation();
  }
}
