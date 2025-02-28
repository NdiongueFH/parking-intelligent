import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './inscription.component.html',
  styleUrls: ['./inscription.component.css']
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
      nom: ['', [Validators.required]],
      prenom: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      mot_de_passe: ['', [Validators.required, Validators.minLength(6)]],
      adresse: ['', [Validators.required]],
      role: ['utilisateur'] // Valeur par défaut
    });
  }

  onSubmit(): void {
    if (this.inscriptionForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.inscriptionForm.controls).forEach(key => {
        const control = this.inscriptionForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = '';

    // Envoi de la requête au backend
    this.http.post<any>('/api/users/signup', this.inscriptionForm.value)
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.success = true;
          
          // Redirection après 2 secondes
          setTimeout(() => {
            this.router.navigate(['/connexion']);
          }, 2000);
        },
        error: (error) => {
          this.loading = false;
          this.error = error.error.message || 'Une erreur est survenue lors de l\'inscription';
        }
      });
  }

  // Helpers pour vérifier les états des contrôles
  isFieldInvalid(fieldName: string): boolean {
    const control = this.inscriptionForm.get(fieldName);
    return !!control && 
           control.invalid && 
           (control.dirty || control.touched) && 
           control.value !== '';
  }
}
