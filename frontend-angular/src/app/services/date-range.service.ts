// services/date-range.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface DateConstraints {
  minDate: string;
  maxDate: string;
}

interface ValidationResponse {
  status: 'valid' | 'invalid';
  message: string;
  chartData: ChartDataPoint[];
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
  private baseUrl = 'http://your-backend-url/api'; // Replace with your actual backend URL

  constructor(private http: HttpClient) {}

  // Get min/max date constraints from backend
  getDateConstraints(): Observable<DateConstraints> {
    return this.http.get<DateConstraints>(`${this.baseUrl}/date-constraints`);
  }

  // Validate date ranges and get chart data
  validateDateRanges(payload: DateRangePayload): Observable<ValidationResponse> {
    return this.http.post<ValidationResponse>(`${this.baseUrl}/validate-date-ranges`, payload);
  }

  // Submit final date ranges selection
  submitDateRanges(payload: DateRangePayload): Observable<any> {
    return this.http.post(`${this.baseUrl}/submit-date-ranges`, payload);
  }
}
