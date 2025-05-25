import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:3000/api/v1/auth';

  constructor(private http: HttpClient) {}

  // Appel de connexion qui stocke token, userId et role
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        // Stockage dans localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('userId', response.data.user._id);
        localStorage.setItem('userRole', response.data.user.role);
      })
    );
  }

  // Vérifie si l’utilisateur est connecté (token présent)
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // Récupère le rôle utilisateur
  getRole(): string | null {
    return localStorage.getItem('userRole');
  }

  // Déconnexion (supprime les données)
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
  }
}
