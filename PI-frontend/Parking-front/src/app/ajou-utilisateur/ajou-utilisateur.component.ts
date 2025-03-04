import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './ajou-utilisateur.component.html',
  styleUrls: ['./ajou-utilisateur.component.css']
})
export class InscriptionComponent implements OnInit {
  inscriptionForm!: FormGroup;
  loading = false;
  error = '';
  success = false;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.inscriptionForm = this.formBuilder.group({
      nom: ['', [Validators.required, this.noWhitespaceValidator]],
      prenom: ['', [Validators.required, this.noWhitespaceValidator]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      mot_de_passe: ['', [Validators.required, Validators.minLength(8)]],
      adresse: ['', [Validators.required, this.noWhitespaceValidator]],
      role: ['utilisateur'] // Valeur par défaut
    });
  }

  noWhitespaceValidator(control: any) {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { whitespace: true };
  }

  onSubmit(): void {
    if (this.inscriptionForm.invalid) {
      Object.keys(this.inscriptionForm.controls).forEach(key => {
        const control = this.inscriptionForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = '';

    this.http.post('http://localhost:3000/api/v1/auth/signup', this.inscriptionForm.value)
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.success = true;
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error.message || 'Une erreur est survenue lors de l\'inscription';
        }
      });
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.inscriptionForm.get(fieldName);
    return !!control &&
           (control.invalid && (control.dirty || control.touched)) &&
           (control.value !== '' && control.value.trim() !== '');
  }

  // Vérifier si le formulaire est valide
  isFormValid(): boolean {
    return this.inscriptionForm.valid;
  }
}