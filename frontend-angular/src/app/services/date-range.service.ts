import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DateRangeService {
  private API_URL = 'http://localhost:5000/api/date-ranges/validate'; // ← Update this if backend differs

  constructor(private http: HttpClient) {}

  validateDateRanges(payload: {
    trainStart: string;
    trainEnd: string;
    testStart: string;
    testEnd: string;
    simStart: string;
    simEnd: string;
  }): Observable<any> {
    return this.http.post<any>(this.API_URL, payload);
  }
}
