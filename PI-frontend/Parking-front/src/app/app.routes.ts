import { Routes } from '@angular/router';
import { HomeComponent } from './page-acceuil/page-acceuil.component';


export const routes: Routes = [
  { path: '', component: HomeComponent },
  { 
    path: 'login', 
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'inscription', 
    loadComponent: () => import('./inscription/inscription.component').then(m => m.InscriptionComponent) 
  },
  { 
    path: 'dashboard-admin', 
    loadComponent: () => import('./dashboard-admin/dashboard-admin.component').then(m => m.AdminDashboardComponent) 
  },
  { 
    path: 'historiques-reservations', 
    loadComponent: () => import('./historiques-reservations/historiques-reservations.component').then(m => m.HistoriquesReservationsComponent) 
  },
  { 
    path: 'gestions-utilisateurs', 
    loadComponent: () => import('./gestions-utilisateurs/gestions-utilisateurs.component').then(m => m.GestionsUtilisateursComponent) 
  },

  { 
    path: 'form-reservation', 
    loadComponent: () => import('./form-reservation/form-reservation.component').then(m => m.ParkingReservationComponent) 
  },

  { 
    path: 'parking', 
    loadComponent: () => import('./parking/parking.component').then(m => m.ParkingComponent) 
  },

  { 
    path: 'liste-parking', 
    loadComponent: () => import('./liste-parking/liste-parking.component').then(m => m.ListeParkingComponent) 
  },
  { path: '**', redirectTo: '' }
];
