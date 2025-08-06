import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

interface DateConstraints {
  minDate: string;
  maxDate: string;
}

interface ValidationResponse {
  status: 'valid' | 'invalid';
  message: string;
  chartData?: ChartDataPoint[];
  errors?: string[];
}

interface ChartDataPoint {
  month: string;
  year: number;
  trainVolume: number;
  testVolume: number;
  simVolume: number;
}

interface DateRangePayload {
  trainStart: string;
  trainEnd: string;
  testStart: string;
  testEnd: string;
  simStart: string;
  simEnd: string;
  trainDays?: number;
  testDays?: number;
  simDays?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DateRangeService {
  private baseUrl = 'http://localhost:5229/api/DateRange';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // Prevents SSR from making the call
  getDateConstraints(): Observable<DateConstraints> {
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get<DateConstraints>(`${this.baseUrl}/constraints`);
    } else {
      return of({ minDate: '', maxDate: '' }); // return empty or dummy values
    }
  }

  validateDateRanges(payload: DateRangePayload): Observable<ValidationResponse> {
    if (isPlatformBrowser(this.platformId)) {
      return this.http.post<ValidationResponse>(`${this.baseUrl}/validate`, payload);
    } else {
      return of({ status: 'invalid', message: 'SSR mode: skipping API call' });
    }
  }

  submitDateRanges(payload: DateRangePayload): Observable<any> {
    if (isPlatformBrowser(this.platformId)) {
      return this.http.post(`${this.baseUrl}/submit`, payload);
    } else {
      return of({}); // or some fallback
    }
  }
}
