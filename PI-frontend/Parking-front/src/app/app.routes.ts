// src/app/app.routes.ts
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
  { path: '**', redirectTo: '' }
];