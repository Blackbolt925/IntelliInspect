import { Component, NgZone } from '@angular/core';
import { SimulationService } from '../../services/simulation.service';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.scss'],
  standalone: false
})
export class SimulationComponent {
  isBrowser = typeof window !== 'undefined';

  isRunning = false;
  isCompleted = false;
  records: any[] = [];

  total = 0;
  passCount = 0;
  failCount = 0;
  avgConfidence = 0;

  // Line chart for confidence over time
  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Confidence Score',
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

  // Donut chart for average confidence
  donutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Avg Confidence', 'Remaining'],
    datasets: [
      {
        data: [0, 100],
        backgroundColor: ['#10b981', '#e5e7eb']
      }
    ]
  };

  donutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    cutout: '60%',
    layout: {
      padding: 60 // adds padding around the chart so it appears smaller
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    }
  };

  constructor(
    private simService: SimulationService,
    private zone: NgZone
  ) {}

  startSimulation(): void {
    console.log("[UI] Starting simulation...");

    // Reset state
    this.isRunning = true;
    this.isCompleted = false;
    this.records = [];
    this.total = 0;
    this.passCount = 0;
    this.failCount = 0;
    this.avgConfidence = 0;

    // Reset charts
    this.lineChartData.labels = [];
    this.lineChartData.datasets[0].data = [];
    this.donutChartData.datasets[0].data = [0, 100];

    this.simService.startSimulation().subscribe({
      next: (res: any) => {
        this.zone.run(() => {
          console.log("[UI] Row received (NgZone):", res);

          const confidence = Number(res.confidence);
          this.records.push(res);
          this.total++;

          // Pass/Fail counting
          if (res.prediction === 'Pass') this.passCount++;
          else this.failCount++;

          // Update average confidence
          this.avgConfidence =
            (this.avgConfidence * (this.total - 1) + confidence) / this.total;

          // Update line chart
          this.lineChartData.labels!.push(res.time);
          this.lineChartData.datasets[0].data.push(confidence);

          // Update donut chart
          const avgPercent = Math.round(this.avgConfidence);
          this.donutChartData.datasets[0].data = [avgPercent, 100 - avgPercent];

          // Force chart updates
          this.lineChartData = { ...this.lineChartData };
          this.donutChartData = { ...this.donutChartData };

          console.log("[UI] Updated:", {
            total: this.total,
            pass: this.passCount,
            fail: this.failCount,
            avg: this.avgConfidence.toFixed(2)
          });
        });
      },

      complete: () => {
        this.zone.run(() => {
          console.log("[UI] Simulation completed.");
          this.isRunning = false;
          this.isCompleted = true;
        });
      },

      error: (err) => {
        this.zone.run(() => {
          console.error("[UI] Simulation error:", err);
          this.isRunning = false;
          this.isCompleted = true;
        });
      }
    });
  }

  restart(): void {
    this.startSimulation();
  }
}
