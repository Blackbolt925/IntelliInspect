import { Component } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { TrainService } from '../../services/train.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-train-model',
  templateUrl: './train-model.component.html',
  styleUrls: ['./train-model.component.scss'],
  standalone: false
})
export class TrainModelComponent {
  training = false;
  trained = false;
  metrics: any = null;
  statusMsg = '';

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };
  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: { legend: { position: 'top' } }
  };

  doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['True Positive', 'True Negative', 'False Positive', 'False Negative'],
    datasets: []
  };

  doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    cutout: '60%', // controls the donut hole size (50-70% is common)
    plugins: {
      legend: { position: 'top' }
    }
  };

  constructor(private trainService: TrainService, private router: Router) {}

  trainModel(): void {
    this.training = true;
    this.statusMsg = 'Training in progress...';

    // const payload = {
    //   trainStart: localStorage.getItem('trainStart'),
    //   trainEnd: localStorage.getItem('trainEnd'),
    //   testStart: localStorage.getItem('testStart'),
    //   testEnd: localStorage.getItem('testEnd'),
    //   simulationStart: localStorage.getItem('simulationStart'),
    //   simulationEnd: localStorage.getItem('simulationEnd')
    // };

    const payload = {
      trainStart: '2023-01-01',
      trainEnd: '2023-01-02',
      testStart: '2023-01-03',
      testEnd: '2023-01-04',
      simulationStart: '2023-01-05',
      simulationEnd: '2023-01-06'
    };

    this.trainService.trainModel(payload).subscribe({
      next: (res) => {
        this.metrics = res;
        this.trained = true;
        this.training = false;
        this.statusMsg = '✔ Model Trained Successfully';

        const labels = res.train_accuracy.map((_: any, i: number) => `Epoch ${i + 1}`);

        this.lineChartData = {
          labels,
          datasets: [
            {
              label: 'Training Accuracy',
              data: res.train_accuracy,
              borderColor: 'green',
              fill: false
            },
            {
              label: 'Training Loss',
              data: res.train_loss,
              borderColor: 'red',
              fill: false
            }
          ]
        };

        const [[TP = 0, TN = 0, FP = 0, FN = 0]] = res.confusion_matrix;

        this.doughnutChartData = {
          labels: ['True Positive', 'True Negative', 'False Positive', 'False Negative'],
          datasets: [
            {
              data: [TP, TN, FP, FN],
              backgroundColor: ['#28a745', '#17a2b8', '#dc3545', '#ffc107']
            }
          ]
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
