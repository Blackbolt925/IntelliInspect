import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TrainService {
  private API_URL = 'http://localhost:5229/api/train-model'; // Update this if needed

  constructor(private http: HttpClient) {}

  trainModel(payload: any): Observable<any> {
    return this.http.post<any>(this.API_URL, payload);
  }
}


// import { Injectable } from '@angular/core';
// import { Observable, of } from 'rxjs';

// @Injectable({ providedIn: 'root' })
// export class TrainService {
//   trainModel(payload: any): Observable<any> {
//     // Simulated metrics response
//     const dummyResponse = {
//       accuracy: 93.5,
//       precision: 92.1,
//       recall: 90.3,
//       f1Score: 91.2,
//       mcc: 0.89,
//       trainLoss: [0.45, 0.38, 0.31, 0.25, 0.20],
//       testLoss: [0.50, 0.42, 0.37, 0.33, 0.28],
//       trainAccuracy: [70, 78, 84, 88, 93],
//       testAccuracy: [65, 74, 81, 85, 90],
//       confusionMatrix: {
//         TP: 300,
//         TN: 150,
//         FP: 20,
//         FN: 30
//       }
//     };

//     return of(dummyResponse); // Emits immediately for testing
//   }
// }
