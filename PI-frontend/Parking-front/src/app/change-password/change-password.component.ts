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
    selector: 'app-motDePasse',
    imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
    templateUrl: './change-password.component.html',
    styleUrls: ['./change-password.component.css']
})
export class MotDePasseComponent implements OnInit {
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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initPasswordForm();
    this.loadUserData();
    
    // Surveillance des changements de mot de passe pour évaluer sa force
    this.passwordForm.get('newPassword')?.valueChanges.subscribe(val => {
        this.checkPasswordStrength(val);
    });

    // Surveillance des changements pour effacer les messages d'erreur
    this.passwordForm.get('currentPassword')?.valueChanges.subscribe(val => {
        if (!val) {
            this.passwordForm.get('currentPassword')?.setErrors(null); // Effacer les erreurs
        }
    });

    this.passwordForm.get('newPassword')?.valueChanges.subscribe(val => {
        if (!val) {
            this.passwordForm.get('newPassword')?.setErrors(null); // Effacer les erreurs
        }
    });

    this.passwordForm.get('confirmPassword')?.valueChanges.subscribe(val => {
        if (!val) {
            this.passwordForm.get('confirmPassword')?.setErrors(null); // Effacer les erreurs
        }
    });
  }

  
  initPasswordForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }
  
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    
    return newPassword === confirmPassword ? null : { 'passwordMismatch': true };
  }
  
  loadUserData(): void {
    if (this.token) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.token}`
      });
      
      this.http.get<UserData>('https://parking-intelligent.onrender.com/api/v1/users/me', { headers })
        .subscribe({
          next: (data) => {
            this.userData = data;
          },
          error: (err) => {
            console.error('Erreur lors du chargement des données utilisateur :', err);
            if (err.status === 401) {
              // Token expiré ou invalide
              localStorage.removeItem('token');
              this.router.navigate(['/login']);
            }
          }
        });
    }
  }
  
  checkPasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = '';
      this.strengthClass = '';
      this.strengthPercentage = 0;
      return;
    }
    
    let score = 0;
    
    // Longueur
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexité
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Déterminer la force
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
  
  onSubmit(): void {
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
    
    if (this.token) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      });
      
      this.http.patch('https://parking-intelligent.onrender.com/api/v1/auth/updatePassword', passwordData, { headers })
        .subscribe({
          next: (response: any) => {
            this.isLoading = false;
            this.isSuccess = true;
            this.message = 'Votre mot de passe a été modifié avec succès !';
            
            // Réinitialiser le formulaire
            this.passwordForm.reset();
            
            // Stocker le nouveau token si retourné
            if (response.token) {
              localStorage.setItem('token', response.token);
              this.token = response.token;
            }
            
            // Rediriger après un délai
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          },
          error: (err) => {
            this.isLoading = false;
            this.isSuccess = false;
            
            if (err.error && err.error.message) {
              this.message = err.error.message;
            } else {
              this.message = 'Une erreur est survenue lors de la modification du mot de passe.';
            }
            
            if (err.status === 401 && err.error.message !== 'Votre mot de passe actuel est incorrect') {
              // Token expiré
              localStorage.removeItem('token');
              this.router.navigate(['/login']);
            }
          }
        });
    } else {
      this.isLoading = false;
      this.isSuccess = false;
      this.message = 'Vous devez être connecté pour modifier votre mot de passe.';
      this.router.navigate(['/login']);
    }
  }
  
// Méthode pour basculer la visibilité des mots de passe
togglePasswordVisibility(type: string): void {
  if (type === 'current') {
    this.showCurrentPassword = !this.showCurrentPassword;
  } else if (type === 'new') {
    this.showNewPassword = !this.showNewPassword;
  } else if (type === 'confirm') {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
  
  hasError(controlName: string): boolean {
    const control = this.passwordForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
  
  goBack(): void {
    this.router.navigate(['/dashboard-admin']);
  }
  
  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
  
  // Méthode pour afficher/masquer le modal des paramètres
  toggleSettingsModal(): void {
    this.showSettingsModal = !this.showSettingsModal;
    
    // Si on ferme le modal en cliquant ailleurs sur la page
    if (this.showSettingsModal) {
      setTimeout(() => {
        document.addEventListener('click', this.closeModalOnClickOutside);
      }, 0);
    } else {
      document.removeEventListener('click', this.closeModalOnClickOutside);
    }
  }
  
  // Fermer le modal en cliquant en dehors
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

    
    // Navigation vers la page de modification du profil
    goToEditProfile(): void {
      this.router.navigate(['/modifier-utilisateur']);
      this.showSettingsModal = false;
    }
    
    // Navigation vers la page de changement de mot de passe
  goToChangePassword(): void {
    this.router.navigate(['/change-password']);
    this.showSettingsModal = false;
  }
}