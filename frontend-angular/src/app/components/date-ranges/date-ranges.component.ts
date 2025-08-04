import { Component } from '@angular/core';
import { DateRangeService } from '../../services/date-range.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-date-ranges',
  templateUrl: './date-ranges.component.html',
  styleUrls: ['./date-ranges.component.scss']
})
export class DateRangesComponent {
  trainStart = '';
  trainEnd = '';
  testStart = '';
  testEnd = '';
  simStart = '';
  simEnd = '';

  validationMessage = '';
  validationSuccess = false;
  recordCounts: any = null;
  barChartData: any[] = [];

  constructor(private dateService: DateRangeService, private router: Router) {}

  validateRanges(): void {
    const payload = {
      trainStart: this.trainStart,
      trainEnd: this.trainEnd,
      testStart: this.testStart,
      testEnd: this.testEnd,
      simStart: this.simStart,
      simEnd: this.simEnd
    };

    this.dateService.validateDateRanges(payload).subscribe({
      next: (res) => {
        this.validationSuccess = res.status === 'Valid';
        this.validationMessage = res.status === 'Valid'
          ? 'Date ranges validated successfully!'
          : 'Invalid date ranges!';
        this.recordCounts = res.counts;
        this.barChartData = res.monthlyBreakdown;
      },
      error: () => {
        this.validationSuccess = false;
        this.validationMessage = 'Validation failed!';
      }
    });
  }

  next(): void {
    this.router.navigate(['/train-model']);
  }
}
