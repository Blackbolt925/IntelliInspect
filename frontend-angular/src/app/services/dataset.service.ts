import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DateRangeService {
  private API_URL = 'http://localhost:5000/api/date-ranges/validate'; // Adjust based on backend

  constructor(private http: HttpClient) {}

  validateDateRanges(payload: any): Observable<any> {
    return this.http.post(this.API_URL, payload);
  }
}
