import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { HomeComponent } from './home/home.component';
import { AppointmentsComponent } from './appointments/appointments.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'appointments', component: AppointmentsComponent, canActivate: [MsalGuard] }
];
