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
    path: 'dashboard-utilisateur', 
    loadComponent: () => import('./dashboard-utilisateur/dashboard-utilisateur.component').then(m => m.UtilisateurDashboardComponent) 
  },
  { 
    path: 'historiques-reservations', 
    loadComponent: () => import('./historiques-reservations/historiques-reservations.component').then(m => m.HistoriquesReservationsComponent) 
  },
  { 
    path: 'historiques-utilisateur', 
    loadComponent: () => import('./historiques-utilisateur/historiques-utilisateur.component').then(m => m.HistoriquesUtilisateurComponent) 
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
    path: 'facture', 
    loadComponent: () => import('./facture/facture.component').then(m => m.FactureComponent) 
  },
  { 
    path: 'minibank', 
    loadComponent: () => import('./minibank/minibank.component').then(m => m.MinibankComponent) 
  },


  { 
    path: 'modifier-utilisateur', 
    loadComponent: () => import('./modifier-utilisateur/modifier-utilisateur.component').then(m => m.ModificationComponent) 
  },
  { 
    path: 'change-password', 
    loadComponent: () => import('./change-password/change-password.component').then(m => m.MotDePasseComponent) 
  },

  { 
    path: 'forgot-password', 
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) 
  },
  { 
    path: 'parking', 
    loadComponent: () => import('./parking/parking.component').then(m => m.ParkingComponent) 
  },

  { 
    path: 'notification-modal', 
    loadComponent: () => import('./notification-modal/notification-modal.component').then(m => m.NotificationModalComponent) 
  },

  { 
    path: 'parking-utilisateur', 
    loadComponent: () => import('./parking-utilisateur/parking-utilisateur.component').then(m => m.ParkingUtilisateurComponent) 
  },


  { 
    path: 'liste-parking', 
    loadComponent: () => import('./liste-parking/liste-parking.component').then(m => m.ListeParkingComponent) 
  },
  { path: '**', redirectTo: '' }
];
