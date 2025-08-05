import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FileUploadService } from '../../services/file-upload.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.scss'],
    standalone: false
})
export class UploadComponent {
  selectedFile: File | null = null;
  fileName: string = '';
  metadata: any = null;
  isUploading = false;
  progress = 0;
  error = '';

  constructor(private fileUploadService: FileUploadService, private router: Router) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.size > environment.MAX_FILE_SIZE) {
      this.error = `File Size exceeded Max limit ${environment.MAX_FILE_SIZE}`;
    }
    else if (file && (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'))) {
      this.selectedFile = file;
      this.fileName = file.name;
      this.error = '';
      this.uploadFile();
    }
    else {
      this.error = 'Please upload a valid CSV file.';
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.size > environment.MAX_FILE_SIZE) {
      this.error = `File Size exceeded Max limit ${environment.MAX_FILE_SIZE}`;
    }
    else if (file && (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'))) {
      this.selectedFile = file;
      this.fileName = file.name;
      this.error = '';
      this.uploadFile();
    }
    else {
      this.error = 'Please upload a valid CSV file.';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  uploadFile(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.progress = 0;
    this.error = '';

    this.fileUploadService.uploadCSV(this.selectedFile).subscribe({
      next: (event) => {
        if (event.type === 1 && event.total) { // HttpEventType.UploadProgress
          this.progress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === 4) { // HttpEventType.Response
          this.metadata = event.body;
          this.isUploading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to upload file.';
        this.isUploading = false;
      }
    });
  }

  proceed(): void {
    this.router.navigate(['/date-ranges']);
  }
}