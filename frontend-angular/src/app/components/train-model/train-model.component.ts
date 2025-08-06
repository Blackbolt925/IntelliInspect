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
  isError = false;

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: { 
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'XGBoost Training Performance'
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Boosting Round'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Accuracy / Loss'
        }
      }
    }
  };

  doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['True Positive', 'True Negative', 'False Positive', 'False Negative'],
    datasets: []
  };

  doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    cutout: '60%',
    layout: {
      padding: 60 // adds padding around the chart so it appears smaller
    },
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Confusion Matrix'
      }
    }
  };

  constructor(private trainService: TrainService, private router: Router) {}

  trainModel(): void {
    this.training = true;
    this.statusMsg = 'Training in progress...';
    this.isError = false;

    // const dateRangesString = localStorage.getItem('dateRanges');
    // const dateRanges = dateRangesString ? JSON.parse(dateRangesString) : {};

    // const payload = {
    //   trainStart: dateRanges.TrainStart,
    //   trainEnd: dateRanges.TrainEnd,
    //   testStart: dateRanges.TestStart,
    //   testEnd: dateRanges.TestEnd,
    //   simulationStart: dateRanges.SimulationStart,
    //   simulationEnd: dateRanges.SimulationEnd
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
        this.statusMsg = 'Model Trained Successfully';

        // X-axis will only show 1, 2, 3... instead of "Boosting Round 1"
        const labels = res.train_accuracy.map((_: any, i: number) => i + 1);

        this.lineChartData = {
          labels,
          datasets: [
            {
              label: 'Training Accuracy',
              data: res.train_accuracy,
              fill: false
            },
            {
              label: 'Training Loss',
              data: res.train_loss,
              fill: false
            }
          ]
        };

        // Confusion Matrix values
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
        this.isError = true;
      }
    });
  }

  next(): void {
    this.router.navigate(['/simulation']);
  }
}
