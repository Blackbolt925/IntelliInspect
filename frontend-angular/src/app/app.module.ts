import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { StepperComponent } from './components/stepper/stepper.component';
import { UploadComponent } from './components/upload/upload.component';
import { DateRangesComponent } from './components/date-ranges/date-ranges.component';
import { TrainModelComponent } from './components/train-model/train-model.component';
import { SimulationComponent } from './components/simulation/simulation.component';
import { HttpClientModule } from '@angular/common/http';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ProgressNavbarComponent } from './components/progress-navbar/progress-navbar.component';



@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    StepperComponent,
    UploadComponent,
    DateRangesComponent,
    TrainModelComponent,
    SimulationComponent,
    ProgressNavbarComponent
  ],
  imports: [
    HttpClientModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatStepperModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    provideClientHydration(),
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
