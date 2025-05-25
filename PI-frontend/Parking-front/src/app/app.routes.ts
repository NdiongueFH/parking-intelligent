import { Routes } from '@angular/router';
import { HomeComponent } from './page-acceuil/page-acceuil.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { UserGuard } from './guards/user.guard';
import { RoleGuard } from './guards/role.guard';




export const routes: Routes = [
  { path: '', component: HomeComponent },

  // Acces tous les deux
  { 
    path: 'login', 
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'inscription', 
    loadComponent: () => import('./inscription/inscription.component').then(m => m.InscriptionComponent) 
  },

  { 
    path: 'forgot-password', 
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) 
  },
  { 
    path: 'reset-password', 
    loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent) 
  },

  { 
    path: 'form-reservation', 
    loadComponent: () => import('./form-reservation/form-reservation.component').then(m => m.ParkingReservationComponent), canActivate: [AuthGuard, RoleGuard]
  },

  { 
    path: 'facture', 
    loadComponent: () => import('./facture/facture.component').then(m => m.FactureComponent), canActivate: [AuthGuard, RoleGuard] 
  },
  { 
    path: 'notification-modal', 
    loadComponent: () => import('./notification-modal/notification-modal.component').then(m => m.NotificationModalComponent), canActivate: [AuthGuard, RoleGuard] 
  },




  // Acces Administrateur uniquement
  { 
    path: 'dashboard-admin', 
    loadComponent: () => import('./dashboard-admin/dashboard-admin.component').then(m => m.AdminDashboardComponent),canActivate: [AuthGuard, AdminGuard]
  },
  
  { 
    path: 'historiques-reservations', 
    loadComponent: () => import('./historiques-reservations/historiques-reservations.component').then(m => m.HistoriquesReservationsComponent),canActivate: [AuthGuard, AdminGuard]
  },

  { 
    path: 'change-password', 
    loadComponent: () => import('./change-password/change-password.component').then(m => m.MotDePasseComponent),canActivate: [AuthGuard, AdminGuard]
  },
  
  { 
    path: 'gestions-utilisateurs', 
    loadComponent: () => import('./gestions-utilisateurs/gestions-utilisateurs.component').then(m => m.GestionsUtilisateursComponent),canActivate: [AuthGuard, AdminGuard] 
  },

  {
    path: 'mon-compte',
    loadComponent: () => import('./mon-compte/mon-compte.component').then(m => m.MonCompteComponent),
    children: [
      {
        path: '',
        redirectTo: 'modifier-utilisateur',
        pathMatch: 'full'
      },
      {
        path: 'modifier-utilisateur',
        loadComponent: () => import('./modifier-utilisateur/modifier-utilisateur.component').then(m => m.ModificationComponent)
      },
      {
        path: 'change-password',
        loadComponent: () => import('./change-password/change-password.component').then(m => m.MotDePasseComponent)
      }
    ],canActivate: [AuthGuard, AdminGuard]
  },

  { 
    path: 'minibank', 
    loadComponent: () => import('./minibank/minibank.component').then(m => m.MinibankComponent),canActivate: [AuthGuard, AdminGuard] 
  },
  { 
    path: 'liste-parking', 
    loadComponent: () => import('./liste-parking/liste-parking.component').then(m => m.ListeParkingComponent),canActivate: [AuthGuard, AdminGuard]
  },
  { 
    path: 'parking', 
    loadComponent: () => import('./parking/parking.component').then(m => m.ParkingComponent),canActivate: [AuthGuard, AdminGuard] 
  },






  // Acces Utilisateur 

  { 
    path: 'dashboard-utilisateur', 
    loadComponent: () => import('./dashboard-utilisateur/dashboard-utilisateur.component').then(m => m.UtilisateurDashboardComponent),canActivate: [AuthGuard, UserGuard] 
  },

  { 
    path: 'modifier-utilisateur', 
    loadComponent: () => import('./modifier-utilisateur/modifier-utilisateur.component').then(m => m.ModificationComponent),canActivate: [AuthGuard, UserGuard] 
  },
  { 
    path: 'historiques-utilisateur', 
    loadComponent: () => import('./historiques-utilisateur/historiques-utilisateur.component').then(m => m.HistoriquesUtilisateurComponent),canActivate: [AuthGuard, UserGuard] 
  },

  { 
    path: 'change-password-user', 
    loadComponent: () => import('./change-password-user/change-password-user.component').then(m => m.ChangePasswordUserComponent),canActivate: [AuthGuard, UserGuard] 
  },

  {
    path: 'mon-compte-utilisateur',
    loadComponent: () => import('./mon-compte-utilisateur/mon-compte-utilisateur.component').then(m => m.MonCompteUtilisateurComponent),
    children: [
      {
        path: '',
        redirectTo: 'update-ses-infos-user',
        pathMatch: 'full'
      },
      {
        path: 'update-ses-infos-user',
        loadComponent: () => import('./update-ses-infos-user/update-ses-infos-user.component').then(m => m.UpdateSesInfosUserComponent)
      },
      {
        path: 'update-son-mdp-user',
        loadComponent: () => import('./update-son-mdp-user/update-son-mdp-user.component').then(m => m.UpdateSonMDPUserComponent)
      }
    ],canActivate: [AuthGuard, UserGuard]
  },

  { 
    path: 'mes-transactions', 
    loadComponent: () => import('./mes-transactions/mes-transactions.component').then(m => m.MesTransactionsComponent),canActivate: [AuthGuard, UserGuard] 
  },


  { 
    path: 'parking-utilisateur', 
    loadComponent: () => import('./parking-utilisateur/parking-utilisateur.component').then(m => m.ParkingUtilisateurComponent),canActivate: [AuthGuard, UserGuard] 
  },


 
  { path: '**', redirectTo: '' }
];
