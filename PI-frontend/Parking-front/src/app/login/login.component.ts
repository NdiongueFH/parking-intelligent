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

      // Envoyer les données du formulaire au backend
      this.http.post('http://localhost:3000/api/v1/auth/login', this.loginForm.value)
        .subscribe({
          next: (response: any) => {
            this.loading = false;
            // Stocker le token dans le localStorage
            localStorage.setItem('token', response.token);
            // Rediriger vers le tableau de bord administrateur
            this.router.navigate(['/dashboard-admin']);
          },
          error: (err) => {
            this.loading = false;
            this.error = err.error.message || 'Email ou mot de passe incorrect. Veuillez réessayer.';

            // Effacer le message d'erreur après 3 secondes
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
