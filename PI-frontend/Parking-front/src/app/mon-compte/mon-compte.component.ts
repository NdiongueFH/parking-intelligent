import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

interface UserData {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  solde: number;
  adresse: string;
  telephone: number;
}

@Component({
  selector: 'app-mon-compte',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './mon-compte.component.html',
  styleUrls: ['./mon-compte.component.css']
})
export class MonCompteComponent implements OnInit {
  token: string | null = localStorage.getItem('token');
  showSettingsModal: boolean = false;
  userData: UserData = {
    _id: '',
    nom: '',
    prenom: '',
    email: '',
    solde: 0,
    adresse: '',
    telephone: 0
  };
  
  // Formulaire pour la modification des informations
  modificationForm!: FormGroup;
  error: string | null = null;
  success: boolean = false;

  // Formulaire pour le changement de mot de passe
  passwordForm!: FormGroup;
  isLoading: boolean = false;
  message: string = '';
  isSuccess: boolean = false;

  // Variables pour la visibilité des mots de passe
  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  // Variables pour la force du mot de passe
  passwordStrength: string = '';
  strengthClass: string = '';
  strengthPercentage: number = 0;

  // Onglet actif
  // Propriétés à ajouter
activeTab: string = 'info';

// Méthode à ajouter
switchTab(tabName: string): void {
  this.activeTab = tabName;
}

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  initializeForms(): void {
    this.modificationForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      adresse: ['', Validators.required]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Surveillance des changements de mot de passe pour évaluer sa force
    this.passwordForm.get('newPassword')?.valueChanges.subscribe(val => {
      this.checkPasswordStrength(val);
    });
  }

  loadUserData(): void {
    if (!this.token) {
      this.error = 'Token non trouvé. Veuillez vous reconnecter.';
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);

    this.http.get('http://localhost:3000/api/v1/auth/me', { headers }).subscribe(
      (response: any) => {
        const user = response.data.user;
        this.userData = user;
        this.modificationForm.patchValue({
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          telephone: user.telephone,
          adresse: user.adresse
        });
      },
      (error) => {
        this.error = 'Erreur lors du chargement des données de l\'utilisateur.';
        console.error(this.error, error);
      }
    );
  }

  onSubmitModification(): void {
    if (this.modificationForm.invalid) {
      return;
    }

    const updatedData = this.modificationForm.value;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);

    this.http.patch('http://localhost:3000/api/v1/auth/me', updatedData, { headers }).subscribe(
      (response: any) => {
          this.success = true;
          this.error = null;
          console.log('Mise à jour réussie :', response);

          // Vérifiez si l'email a été modifié
          if (updatedData.email !== this.modificationForm.get('email')?.value) {
              // Redirigez vers la page de connexion
              console.log('Email modifié. Redirection vers la page de connexion...');
              localStorage.removeItem('token'); // Optionnel: Retirez le token
              setTimeout(() => {
                  this.router.navigate(['/login']);
              }, 2000);
          } else {
              // Redirigez vers le tableau de bord
              console.log('Redirection vers le tableau de bord...');
              setTimeout(() => {
                  this.router.navigate(['/login']);
              }, 2000);
          }
      },
      (error) => {
          this.error = 'Erreur lors de la mise à jour des informations.';
          this.success = false;
          console.error(this.error, error);
      }
  );
  }

  onSubmitPassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.message = '';

    const passwordData = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword,
      confirmPassword: this.passwordForm.value.confirmPassword
    };

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    });

    this.http.patch('http://localhost:3000/api/v1/auth/updatePassword', passwordData, { headers }).subscribe(
      {
        next: (response: any) => {
          this.isLoading = false;
          this.isSuccess = true;
          this.message = 'Votre mot de passe a été modifié avec succès !';
          this.passwordForm.reset();
          if (response.token) {
            localStorage.setItem('token', response.token);
            this.token = response.token;
          }
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (err) => {
          this.isLoading = false;
          this.isSuccess = false;
          this.message = err.error?.message || 'Une erreur est survenue lors de la modification du mot de passe.';
          if (err.status === 401) {
            localStorage.removeItem('token');
            this.router.navigate(['/login']);
          }
        }
      }
    );
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { 'passwordMismatch': true };
  }

  checkPasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = '';
      this.strengthClass = '';
      this.strengthPercentage = 0;
      return;
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) {
      this.passwordStrength = 'Faible';
      this.strengthClass = 'weak';
      this.strengthPercentage = 33;
    } else if (score <= 4) {
      this.passwordStrength = 'Moyen';
      this.strengthClass = 'medium';
      this.strengthPercentage = 66;
    } else {
      this.passwordStrength = 'Fort';
      this.strengthClass = 'strong';
      this.strengthPercentage = 100;
    }
  }
  hasError(controlName: string): boolean {
    const control = this.passwordForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
  

  togglePasswordVisibility(type: string): void {
    if (type === 'current') {
      this.showCurrentPassword = !this.showCurrentPassword;
    } else if (type === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else if (type === 'confirm') {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  isFieldInvalid(field: string): boolean {
    const fieldControl = this.modificationForm.get(field);
    return !!fieldControl && fieldControl.invalid && (fieldControl.dirty || fieldControl.touched);
  }

  goBack(): void {
    this.router.navigate(['/dashboard-admin']);
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  toggleSettingsModal(): void {
    this.showSettingsModal = !this.showSettingsModal;
    if (this.showSettingsModal) {
      setTimeout(() => {
        document.addEventListener('click', this.closeModalOnClickOutside);
      }, 0);
    } else {
      document.removeEventListener('click', this.closeModalOnClickOutside);
    }
  }

  closeModalOnClickOutside = (event: MouseEvent) => {
    const modal = document.querySelector('.settings-modal');
    const settingsButton = document.querySelector('.settings-button');
    if (modal && settingsButton && 
        !modal.contains(event.target as Node) && 
        !settingsButton.contains(event.target as Node)) {
      this.showSettingsModal = false;
      document.removeEventListener('click', this.closeModalOnClickOutside);
    }
  };

  goToEditProfile(): void {
    this.router.navigate(['/modifier-utilisateur']);
    this.showSettingsModal = false;
  }

  goToChangePassword(): void {
    this.router.navigate(['/change-password']);
    this.showSettingsModal = false;
  }

   // Méthode pour changer l'onglet actif
   showTab(tab: 'info' | 'password'): void {
    this.activeTab = tab;
  }

  
}