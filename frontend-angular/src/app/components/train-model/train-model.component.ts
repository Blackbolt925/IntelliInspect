import { Component } from '@angular/core';
import { TrainService } from '../../services/train.service';
import { Router } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';

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

  lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  donutChartData: ChartData<'doughnut'> = {
    labels: ['TP', 'TN', 'FP', 'FN'],
    datasets: [{
      data: [],
      backgroundColor: ['#4caf50', '#2196f3', '#f44336', '#ff9800']
    }]
  };

  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Training & Testing Loss' }
    }
  };

  donutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: { position: 'right' },
      title: { display: true, text: 'Confusion Matrix' }
    },
    cutout: '60%'
  };

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

        // Chart labels based on epochs
        const labels = res.trainLoss.map((_: any, i: number) => `Epoch ${i + 1}`);

        this.lineChartData = {
          labels,
          datasets: [
            {
              label: 'Train Loss',
              data: res.trainLoss,
              borderColor: 'blue',
              fill: false
            },
            {
              label: 'Test Loss',
              data: res.testLoss,
              borderColor: 'red',
              fill: false
            }
          ]
        };

        const { TP, TN, FP, FN } = res.confusionMatrix;
        this.donutChartData = {
          labels: ['TP', 'TN', 'FP', 'FN'],
          datasets: [{
            data: [TP, TN, FP, FN],
            backgroundColor: ['#4caf50', '#2196f3', '#f44336', '#ff9800']
          }]
        };
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