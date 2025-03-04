import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router'; // Importez Router


@Component({
  selector: 'app-modification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule,RouterModule],
  templateUrl: './modifier-utilisateur.component.html',
  styleUrls: ['./modifier-utilisateur.component.css']
})
export class ModificationComponent implements OnInit {
  modificationForm!: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;
  userId: string = ''; // Stocker l'ID de l'utilisateur à modifier

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute // Injecter ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || ''; // Récupérer l'ID de l'utilisateur
    this.initializeForm();
    this.loadUserData(); // Charger les données de l'utilisateur
  }

  initializeForm() {
    this.modificationForm = this.formBuilder.group({
      nom: ['', [Validators.required, this.noWhitespaceValidator]],
      prenom: ['', [Validators.required, this.noWhitespaceValidator]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      adresse: ['', [Validators.required, this.noWhitespaceValidator]],
      carteRfid: [''] // Initialiser si le rôle est 'administrateur'
    });
  }

  loadUserData() {
    this.http.get<any>(`http://localhost:3000/api/v1/users/${this.userId}`).subscribe(
      user => {
        this.fillForm(user); // Remplir le formulaire avec les données
      },
      error => {
        console.error('Erreur lors du chargement des données de l’utilisateur', error);
        this.error = 'Erreur lors du chargement des données';
      }
    );
  }

  fillForm(user: any) {
    this.modificationForm.patchValue({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      adresse: user.adresse,
      carteRfid: user.carteRfid || '' // Assurez-vous que carteRfid est défini
    });

    // Gérer l'état du champ carteRfid
    if (user.role === 'utilisateur') {
      this.modificationForm.get('carteRfid')?.disable(); // Désactiver si rôle est utilisateur
    } else {
      this.modificationForm.get('carteRfid')?.enable(); // Activer si rôle est administrateur
    }
  }

  noWhitespaceValidator(control: any) {
    const isWhitespace = (control.value || '').trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
  }

  async updateUser() {
    try {
      const response = await this.http.patch(`http://localhost:3000/api/v1/users/update/${this.userId}`, this.modificationForm.value).toPromise();
      this.success = true;
      setTimeout(() => {
        this.router.navigate(['/gestions-utilisateurs']); // Redirection après succès
      }, 3000);
    } catch (err: any) {
      this.error = err.message || 'Une erreur est survenue lors de la modification';
    } finally {
      this.loading = false;
    }
  }

  onSubmit(): void {
    if (this.modificationForm.invalid) {
      Object.keys(this.modificationForm.controls).forEach(key => {
        const control = this.modificationForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = '';
    this.updateUser();
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.modificationForm.get(fieldName);
    return !!control && (control.invalid && (control.dirty || control.touched));
  }

  isFormValid(): boolean {
    return this.modificationForm.valid; // Assurez-vous que cela retourne un boolean
  }

  isCarteRfidDisabled(): boolean {
    const control = this.modificationForm.get('carteRfid');
    return control ? control.disabled : true; // Retourne true si le champ est désactivé
  }
}