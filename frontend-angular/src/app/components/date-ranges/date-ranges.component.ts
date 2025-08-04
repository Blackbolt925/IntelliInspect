// date-ranges.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
  styleUrls: ['./date-ranges.component.scss']
})
export class DateRangesComponent implements OnInit, AfterViewInit {
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;

  // Date inputs
  trainStart = '';
  trainEnd = '';
  testStart = '';
  testEnd = '';
  simStart = '';
  simEnd = '';

  // Date constraints from backend
  minDate = '';
  maxDate = '';

  // Validation state
  validationSuccess = false;
  recordCounts: RecordCounts | null = null;
  chartData: ChartData[] = [];

  // Chart instance
  chart: Chart | null = null;

  constructor(
    private dateService: DateRangeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDateConstraints();
  }

  ngAfterViewInit(): void {
    // Chart will be initialized after validation
  }

  // Load min/max date constraints from backend
  loadDateConstraints(): void {
    this.dateService.getDateConstraints().subscribe({
      next: (constraints: DateConstraints) => {
        this.minDate = constraints.minDate;
        this.maxDate = constraints.maxDate;

        // If same year, you can add logic here to restrict to year
        const minYear = new Date(this.minDate).getFullYear();
        const maxYear = new Date(this.maxDate).getFullYear();

        if (minYear === maxYear) {
          // Same year - user can only change month/day
          console.log('Same year detected:', minYear);
        }
      },
      error: (error) => {
        console.error('Failed to load date constraints:', error);
        // Set default constraints
        this.minDate = '2020-01-01';
        this.maxDate = '2024-12-31';
      }
    });
  }

  // Check if validation can be performed
  canValidate(): boolean {
    return !!(
      this.trainStart && this.trainEnd &&
      this.testStart && this.testEnd &&
      this.simStart && this.simEnd
    );
  }

  // Calculate days between two dates
  private calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  }

  // Format date range for display
  formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startFormatted = start.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const endFormatted = end.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return `${startFormatted} to ${endFormatted}`;
  }

  // Validate date ranges
  validateRanges(): void {
    if (!this.canValidate()) {
      return;
    }

    // Prepare payload for backend
    const payload = {
      trainStart: this.trainStart,
      trainEnd: this.trainEnd,
      testStart: this.testStart,
      testEnd: this.testEnd,
      simStart: this.simStart,
      simEnd: this.simEnd
    };

    // Send to backend for validation and chart data
    this.dateService.validateDateRanges(payload).subscribe({
      next: (response) => {
        if (response.status === 'valid') {
          this.validationSuccess = true;

          // Calculate days (can be done in frontend or received from backend)
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

          // Set chart data from backend response
          this.chartData = response.chartData || [];

          // Create chart after a short delay to ensure DOM is ready
          setTimeout(() => {
            this.createChart();
          }, 100);
        } else {
          this.validationSuccess = false;
          this.recordCounts = null;
          this.chartData = [];
        }
      },
      error: (error) => {
        console.error('Validation failed:', error);
        this.validationSuccess = false;
        this.recordCounts = null;
        this.chartData = [];
      }
    });
  }

  // Create bar chart
  private createChart(): void {
    if (!this.barChartRef || this.chartData.length === 0) {
      return;
    }

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.barChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Prepare chart data
    const labels = this.chartData.map(item => `${item.month} ${item.year}`);

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
          legend: {
            position: 'top',
          },
          title: {
            display: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Timeline (Year)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Volume'
            },
            beginAtZero: true
          }
        }
      }
    });
  }

  // Navigate to next step
  next(): void {
    if (this.validationSuccess) {
      // Send final selected date ranges to backend before navigation
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

      this.dateService.submitDateRanges(finalPayload).subscribe({
        next: (response) => {
          console.log('Date ranges submitted successfully:', response);
          this.router.navigate(['/model-training']);
        },
        error: (error) => {
          console.error('Failed to submit date ranges:', error);
          // Navigate anyway or show error message
          this.router.navigate(['/model-training']);
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
