import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient,HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

interface UserData {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  solde: number;
  adresse :string,
  telephone :number
}

@Component({
    selector: 'app-modification',
    imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
    templateUrl: './modifier-utilisateur.component.html',
    styleUrls: ['./modifier-utilisateur.component.css']
})
export class ModificationComponent implements OnInit {
  modificationForm: FormGroup;
  error: string | null = null;
  success: boolean = false;
  token: string | null = localStorage.getItem('token'); // Récupération du token

    // Nouvelles propriétés pour le modal des paramètres
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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.modificationForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      adresse: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    console.log('Initialisation du composant ModificationComponent...');
    this.loadUserData();
  }

  loadUserData(): void {
    console.log('Chargement des données de l\'utilisateur...');
    
    if (!this.token) {
      this.error = 'Token non trouvé. Veuillez vous reconnecter.';
      console.error(this.error);
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);

    this.http.get('https://parking-intelligent.onrender.com/api/v1/auth/me', { headers }).subscribe(
      (response: any) => {
        console.log('Données utilisateur récupérées :', response.data.user);
        const user = response.data.user;
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

  onSubmit(): void {
    console.log('Soumission du formulaire de modification...');

    if (this.modificationForm.invalid) {
        console.warn('Le formulaire est invalide. Vérifiez les champs.');
        return;
    }

    const updatedData = this.modificationForm.value;
    console.log('Données mises à jour :', updatedData);

    if (!this.token) {
        this.error = 'Token non trouvé. Veuillez vous reconnecter.';
        console.error(this.error);
        return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);

    this.http.patch('https://parking-intelligent.onrender.com/api/v1/auth/me', updatedData, { headers }).subscribe(
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


  isFieldInvalid(field: string): boolean {
    const fieldControl = this.modificationForm.get(field);
    const invalid = fieldControl ? fieldControl.invalid && fieldControl.touched : false;

    if (invalid) {
      console.warn(`Champ invalide : ${field}`);
    }
    return invalid;
  }
}