import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:3000/api/v1/auth'; // URL de votre API

  constructor(private http: HttpClient) {}

  login(email: string, mot_de_passe: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { email, mot_de_passe });
  }

  // Autres méthodes comme logout, isAuthenticated, etc.
}