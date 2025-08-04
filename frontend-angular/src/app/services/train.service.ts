import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TrainService {
  private API_URL = 'http://localhost:5000/api/train-model'; // Update this if needed

  constructor(private http: HttpClient) {}

  trainModel(payload: any): Observable<any> {
    return this.http.post<any>(this.API_URL, payload);
  }
}
