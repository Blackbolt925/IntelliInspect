import { Component } from '@angular/core';
import * as Highcharts from 'highcharts';
import { TrainService } from '../../services/train.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-train-model',
  templateUrl: './train-model.component.html',
  styleUrls: ['./train-model.component.scss']
})
export class TrainModelComponent {
  Highcharts: typeof Highcharts = Highcharts;

  training = false;
  trained = false;
  metrics: any = null;
  statusMsg = '';

  lineChartOptions: Highcharts.Options = {};
  donutChartOptions: Highcharts.Options = {};

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

        const labels = res.trainLoss.map((_: any, i: number) => `Epoch ${i + 1}`);

        this.lineChartOptions = {
          title: { text: 'Training & Testing Loss' },
          xAxis: { categories: labels },
          yAxis: { title: { text: 'Loss' } },
          series: [
            { name: 'Train Loss', type: 'line', data: res.trainLoss },
            { name: 'Test Loss', type: 'line', data: res.testLoss }
          ]
        };

        const { TP, TN, FP, FN } = res.confusionMatrix;

        this.donutChartOptions = {
          chart: {
            type: 'pie'
          },
          title: { text: 'Confusion Matrix' },
          plotOptions: {
            pie: {
              innerSize: '60%',
              dataLabels: { enabled: true }
            }
          },
          series: [{
            name: 'Counts',
            type: 'pie',
            data: [
              { name: 'TP', y: TP },
              { name: 'TN', y: TN },
              { name: 'FP', y: FP },
              { name: 'FN', y: FN }
            ]
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
