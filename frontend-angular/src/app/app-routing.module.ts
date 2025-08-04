import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UploadComponent } from './components/upload/upload.component';
import { DateRangesComponent } from './components/date-ranges/date-ranges.component';
import { TrainModelComponent } from './components/train-model/train-model.component';
import { SimulationComponent } from './components/simulation/simulation.component';

const routes: Routes = [
  { path: '', redirectTo: 'upload', pathMatch: 'full' },
  { path: 'upload', component: UploadComponent },
<<<<<<< HEAD
  { path: 'ranges', component: DateRangesComponent },
  { path: 'train', component: TrainModelComponent },
  { path: 'simulate', component: SimulationComponent }
=======
  { path: 'date-ranges', component: DateRangesComponent },
  { path: 'train-model', component: TrainModelComponent },
  { path: 'simulation', component: SimulationComponent },
  { path: '**', redirectTo: 'upload' }
>>>>>>> a00852c (made changes)
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
