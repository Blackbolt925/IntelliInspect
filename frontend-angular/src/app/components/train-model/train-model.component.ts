import { Component } from '@angular/core';
import { TrainService } from '../../services/train.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-train-model',
  templateUrl: './train-model.component.html',
  styleUrls: ['./train-model.component.scss']
})
export class TrainModelComponent {
  training = false;
  trained = false;
  metrics: any = null;
  statusMsg = '';

  constructor(private trainService: TrainService, private router: Router) {}

  trainModel(): void {
    this.training = true;
    this.statusMsg = 'Training in progress...';

    const payload = {
      trainStart: localStorage.getItem('trainStart'),
      trainEnd: localStorage.getItem('trainEnd'),
      testStart: localStorage.getItem('testStart'),
      testEnd: localStorage.getItem('testEnd')
    };

    this.trainService.trainModel(payload).subscribe({
      next: (res) => {
        this.metrics = res;
        this.trained = true;
        this.training = false;
        this.statusMsg = '✔ Model Trained Successfully';
      },
      error: () => {
        this.statusMsg = 'Training failed.';
        this.training = false;
      }
    });
  }

  next(): void {
    this.router.navigate(['/simulation']);
  }
}
