import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { io } from 'socket.io-client';

@Component({
  selector: 'app-login',
  standalone: true, // Ajouter si tu utilises Angular standalone components
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  loading = false;
  error = '';
  private socket: any;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService // Injecter AuthService ici !
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      mot_de_passe: ['', [Validators.required, Validators.minLength(8)]]
    });

    // Initialiser Socket.IO
    this.socket = io('https://parking-intelligent.onrender.com');

    // Écouter l'événement 'rfidScanned' pour connexion automatique
    this.socket.on('rfidScanned', (uid: string) => {
      this.loginWithRfid(uid);
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  validateField(fieldName: string) {
    const control = this.loginForm.get(fieldName);
    if (control) {
      control.markAsTouched();
      control.updateValueAndValidity();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return !!control &&
           control.invalid &&
           (control.dirty || control.touched) &&
           control.value !== '';
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: (response: any) => { // Typage explicite
          this.loading = false;

          const role = this.authService.getRole();
          if (role === 'utilisateur') {
            this.router.navigate(['/dashboard-utilisateur']);
          } else if (role === 'administrateur') {
            this.router.navigate(['/dashboard-admin']);
          } else {
            this.error = 'Rôle inconnu. Veuillez contacter l\'administrateur.';
          }
        },
        error: (err: any) => { // Typage explicite
          this.loading = false;
          this.error = err.error?.message || 'Email ou mot de passe incorrect. Veuillez réessayer.';
          setTimeout(() => {
            this.error = '';
          }, 3000);
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  scanRfid() {
    console.log('Scanner la carte RFID...');
  }

  loginWithRfid(carteRfid: string) {
    this.loading = true;
    this.error = '';

    this.http.post('https://parking-intelligent.onrender.com/api/v1/auth/login-rfid', { carteRfid }).subscribe({
      next: (response: any) => {
        this.loading = false;

        localStorage.setItem('token', response.token);
        localStorage.setItem('userId', response.data.user._id);
        localStorage.setItem('userRole', response.data.user.role);

        if (response.data.user.role === 'utilisateur') {
          this.router.navigate(['/dashboard-utilisateur']);
        } else if (response.data.user.role === 'administrateur') {
          this.router.navigate(['/dashboard-admin']);
        } else {
          this.error = 'Rôle inconnu. Veuillez contacter l\'administrateur.';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.error?.message || 'Carte RFID non reconnue. Veuillez réessayer.';
        setTimeout(() => {
          this.error = '';
        }, 3000);
      }
    });
  }
}
