// src/app/guards/role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const role = localStorage.getItem('userRole');

    if (role === 'utilisateur' || role === 'administrateur') {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}
