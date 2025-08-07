import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DateRangeService {
  private BASE_URL = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // GET date constraints (min and max dates)
  getDateConstraints(): Observable<any> {
    const url = `${this.BASE_URL}/api/DateRange/constraints`;
    console.log('[DateRangeService] GET request to:', url);
    return this.http.get(url);
  }

  // POST date ranges for validation
  validateDateRanges(payload: any): Observable<any> {
    const url = `${this.BASE_URL}/api/date-ranges/validate`;
    console.log('[DateRangeService] POST validation request to:', url);
    console.log('[DateRangeService] Validation payload:', payload);
    return this.http.post(url, payload);
  }

  // POST final date ranges before navigating to training
  submitDateRanges(payload: any): Observable<any> {
    const url = `${this.BASE_URL}/api/date-ranges/submit`;
    console.log('[DateRangeService] POST submission request to:', url);
    console.log('[DateRangeService] Submission payload:', payload);
    return this.http.post(url, payload);
  }
}
