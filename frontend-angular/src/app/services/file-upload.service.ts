import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FileUploadService {
  private API_URL = 'http://localhost:5229/api/Upload'; // Update this to your backend endpoint

  constructor(private http: HttpClient) {}

  uploadCSV(file: File): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(this.API_URL, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  // uploadCSV(file: File): Observable<any> {
  //   console.log('Pretending to upload:', file.name);
  //   return new Observable(observer => {
  //     setTimeout(() => {
  //       observer.next({ message: 'Mock upload complete', fileName: file.name });
  //       observer.complete();
  //     }, 1500); // Simulate delay
  //   });
  // }

}
