import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      mot_de_passe: ['', [Validators.required, Validators.minLength(8)]]
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
  
      this.http.post('http://localhost:3000/api/v1/auth/login', this.loginForm.value)
        .subscribe({
          next: (response: any) => {
            this.loading = false;
  
            // Stocker le token et le rôle
            localStorage.setItem('token', response.token);
            localStorage.setItem('userRole', response.data.user.role); // Récupérer le rôle
  
            // Redirection selon le rôle
            if (response.data.user.role === 'utilisateur') {
              this.router.navigate(['/dashboard-utilisateur']);
            } else if (response.data.user.role === 'administrateur') {
              this.router.navigate(['/dashboard-admin']);
            } else {
              this.error = 'Rôle inconnu. Veuillez contacter l\'administrateur.';
            }
          },
          error: (err) => {
            this.loading = false;
            this.error = err.error.message || 'Email ou mot de passe incorrect. Veuillez réessayer.';
            setTimeout(() => {
              this.error = '';
            }, 3000);
          }
        });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
