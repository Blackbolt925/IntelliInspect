import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SimulationService {
  private API_URL = 'http://localhost:5229/api/simulate';

  startSimulation(): Observable<any> {
    return new Observable(observer => {
      const eventSource = new EventSource(this.API_URL);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        observer.next(data);
      };

      eventSource.onerror = (err) => {
        console.error('EventSource error:', err);
        eventSource.close();
        observer.complete();
      };
    });
  }
}



// import { Injectable } from '@angular/core';
// import { Observable, interval } from 'rxjs';
// import { map, take } from 'rxjs/operators';

// @Injectable({ providedIn: 'root' })
// export class SimulationService {
//   private readonly SIMULATION_DURATION = 20; // number of rows (20 seconds)

//   constructor() {}

//   startSimulation(): Observable<any> {
//     return interval(1000).pipe( // emit one value every 1 second
//       take(this.SIMULATION_DURATION),
//       map(i => {
//         const pass = Math.random() > 0.3;
//         const confidence = +(Math.random() * 100).toFixed(2);

//         return {
//           time: new Date().toLocaleTimeString(),
//           sampleId: `SAMP-${1000 + i}`,
//           prediction: pass ? 'Pass' : 'Fail',
//           confidence,
//           temperature: +(20 + Math.random() * 10).toFixed(2),
//           pressure: +(990 + Math.random() * 20).toFixed(2),
//           humidity: +(40 + Math.random() * 20).toFixed(2)
//         };
//       })
//     );
//   }
// }

