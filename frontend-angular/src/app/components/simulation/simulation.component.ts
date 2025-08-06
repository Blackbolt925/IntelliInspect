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

  constructor(
    private simService: SimulationService,
    private zone: NgZone // ✅ Inject NgZone
  ) {}

  startSimulation(): void {
    console.log("[UI] Starting simulation...");

    this.isRunning = true;
    this.isCompleted = false;
    this.records = [];
    this.total = 0;
    this.passCount = 0;
    this.failCount = 0;
    this.avgConfidence = 0;

    this.lineChartData.labels = [];
    this.lineChartData.datasets[0].data = [];
    this.donutChartData.datasets[0].data = [0, 0];

    this.simService.startSimulation().subscribe({
      next: (res: any) => {
        // ✅ Wrap UI updates inside NgZone
        this.zone.run(() => {
          console.log("[UI] Row received (NgZone):", res);

          const confidence = Number(res.confidence);
          this.records.push(res);
          this.total++;

          if (res.prediction === 'Pass') this.passCount++;
          else this.failCount++;

          this.avgConfidence =
            (this.avgConfidence * (this.total - 1) + confidence) / this.total;

          this.lineChartData.labels!.push(res.time);
          this.lineChartData.datasets[0].data.push(confidence);
          this.donutChartData.datasets[0].data = [this.passCount, this.failCount];

          // ✅ Force change detection
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
