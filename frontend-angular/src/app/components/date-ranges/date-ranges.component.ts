import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { DateRangeService } from '../../services/date-range.service';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface RecordCounts {
  trainDays: number;
  trainStart: string;
  trainEnd: string;
  testDays: number;
  testStart: string;
  testEnd: string;
  simDays: number;
  simStart: string;
  simEnd: string;
}

interface ChartData {
  month: string;
  year: number;
  trainVolume: number;
  testVolume: number;
  simVolume: number;
}

interface DateConstraints {
  minDate: string;
  maxDate: string;
}

@Component({
  selector: 'app-date-ranges',
  templateUrl: './date-ranges.component.html',
  styleUrls: ['./date-ranges.component.scss'],
  standalone: false
})
export class DateRangesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;

  trainStart = '';
  trainEnd = '';
  testStart = '';
  testEnd = '';
  simStart = '';
  simEnd = '';

  minDate = '';
  maxDate = '';

  validationSuccess = false;
  validationErrors: string[] = [];
  recordCounts: RecordCounts | null = null;
  chartData: ChartData[] = [];

  chart: Chart | null = null;

  constructor(
    private dateService: DateRangeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('[Init] DateRangesComponent initialized');
    if (typeof window !== 'undefined') {
      this.loadDateConstraints();
    }
  }

  ngAfterViewInit(): void {
    // Placeholder for post-view logic
  }

  loadDateConstraints(): void {
    this.minDate = '';
    this.maxDate = '';
    console.log('[loadDateConstraints] Date constraints disabled');
  }

  private formatDateForInput(dateTimeString: string): string {
    try {
      const date = new Date(dateTimeString);
      return date.toISOString().split('T')[0];
    } catch {
      return dateTimeString.split(' ')[0];
    }
  }

  canValidate(): boolean {
    return !!(
      this.trainStart && this.trainEnd &&
      this.testStart && this.testEnd &&
      this.simStart && this.simEnd
    );
  }

  private calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startFormatted = start.toLocaleDateString('en-US', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const endFormatted = end.toLocaleDateString('en-US', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    return `${startFormatted} to ${endFormatted}`;
  }

  validateRanges(): void {
    console.log('[validateRanges] Validation triggered');

    if (!this.canValidate()) {
      console.warn('[validateRanges] Validation skipped - missing inputs');
      return;
    }

    this.validationSuccess = false;
    this.validationErrors = [];
    this.recordCounts = null;
    this.chartData = [];

    const payload = {
      trainStart: this.trainStart,
      trainEnd: this.trainEnd,
      testStart: this.testStart,
      testEnd: this.testEnd,
      simStart: this.simStart,
      simEnd: this.simEnd
    };

    console.log('[validateRanges] Sending payload to backend:', payload);

    this.dateService.validateDateRanges(payload).subscribe({
      next: (response) => {
        console.log('[validateRanges] Received response:', response);

        if (response.status === 'valid') {
          console.log('[validateRanges] Validation succeeded');
          this.validationSuccess = true;
          this.validationErrors = [];

          this.recordCounts = {
            trainDays: this.calculateDays(this.trainStart, this.trainEnd),
            trainStart: this.trainStart,
            trainEnd: this.trainEnd,
            testDays: this.calculateDays(this.testStart, this.testEnd),
            testStart: this.testStart,
            testEnd: this.testEnd,
            simDays: this.calculateDays(this.simStart, this.simEnd),
            simStart: this.simStart,
            simEnd: this.simEnd
          };

          this.chartData = response.chartData || [];

          console.log('[validateRanges] Chart data set. Creating chart...');
          setTimeout(() => {
            this.createChart();
          }, 100);
        } else {
          console.warn('[validateRanges] Validation failed with errors:', response.errors || [response.message]);
          this.validationSuccess = false;
          this.validationErrors = response.errors || [response.message];
          this.recordCounts = null;
          this.chartData = [];
        }
      },
      error: (error) => {
        console.error('[validateRanges] API call failed:', error);
        this.validationSuccess = false;
        this.validationErrors = ['Failed to validate date ranges. Please try again.'];
        this.recordCounts = null;
        this.chartData = [];
      }
    });
  }

  private createChart(): void {
    console.log('[createChart] Chart rendering started');

    if (!this.barChartRef || this.chartData.length === 0) {
      console.warn('[createChart] Missing chart reference or data. Chart not created.');
      return;
    }

    if (this.chart) {
      console.log('[createChart] Destroying existing chart instance');
      this.chart.destroy();
    }

    const ctx = this.barChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('[createChart] Chart context not available');
      return;
    }

    const labels = this.chartData.map(item => item.month);

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Training',
            data: this.chartData.map(item => item.trainVolume),
            backgroundColor: '#22c55e',
            borderColor: '#16a34a',
            borderWidth: 1
          },
          {
            label: 'Testing',
            data: this.chartData.map(item => item.testVolume),
            backgroundColor: '#f59e0b',
            borderColor: '#d97706',
            borderWidth: 1
          },
          {
            label: 'Simulation',
            data: this.chartData.map(item => item.simVolume),
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: false }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Timeline (Year)',
              font: { size: 12 }
            },
            grid: { display: false }
          },
          y: {
            title: {
              display: true,
              text: 'Volume',
              font: { size: 12 }
            },
            beginAtZero: true,
            grid: { color: '#e5e7eb' }
          }
        },
        elements: {
          bar: { borderRadius: 2 }
        }
      }
    });

    console.log('[createChart] Chart rendered successfully');
  }

  next(): void {
    if (!this.validationSuccess) {
      console.warn('[next] Navigation blocked - validation not complete');
      return;
    }

    const dateRanges = {
      TrainStart: this.trainStart,
      TrainEnd: this.trainEnd,
      TestStart: this.testStart,
      TestEnd: this.testEnd,
      SimulationStart: this.simStart,
      SimulationEnd: this.simEnd
    };

    localStorage.setItem('dateRanges', JSON.stringify(dateRanges));
    console.log('[next] Date ranges saved to local storage:', dateRanges);

    const finalPayload = {
      trainStart: this.trainStart,
      trainEnd: this.trainEnd,
      testStart: this.testStart,
      testEnd: this.testEnd,
      simStart: this.simStart,
      simEnd: this.simEnd,
      trainDays: this.recordCounts?.trainDays,
      testDays: this.recordCounts?.testDays,
      simDays: this.recordCounts?.simDays
    };

    console.log('[next] Submitting date ranges to backend:', finalPayload);

    this.dateService.submitDateRanges(finalPayload).subscribe({
      next: (response) => {
        console.log('[next] Submission successful. Navigating to /train-model', response);
        this.router.navigate(['/train-model']);
      },
      error: (error) => {
        console.error('[next] Submission failed. Navigating to fallback /model-training', error);
        this.router.navigate(['/model-training']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.chart) {
      console.log('[ngOnDestroy] Destroying chart instance');
      this.chart.destroy();
    }
  }
}
