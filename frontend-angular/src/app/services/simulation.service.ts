import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SimulationService {
  private API_URL = 'http://localhost:5000/api/simulate'; // Adjust to backend route

  constructor(private http: HttpClient) {}

  startSimulation(): Observable<any> {
    return this.http.get<any>(this.API_URL, { observe: 'events', responseType: 'json' as 'json' });
  }
}
