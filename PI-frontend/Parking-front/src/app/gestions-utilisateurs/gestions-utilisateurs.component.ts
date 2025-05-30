import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router'; // Importez Router
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { io, Socket } from 'socket.io-client'; // Importer Socket.IO


interface UserData {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  solde: number;
}

@Component({
    selector: 'app-gestions-utilisateurs',
    imports: [CommonModule, RouterModule, FormsModule, HttpClientModule, ReactiveFormsModule],
    templateUrl: './gestions-utilisateurs.component.html',
    styleUrls: ['./gestions-utilisateurs.component.css']
})
export class GestionsUtilisateursComponent implements OnInit {
  utilisateurs: any[] = [];
  paginatedUsers: any[] = [];
  currentPage = 1;
  itemsPerPage = 9;
  totalPages = 0;
  totalUsers = 0;
  pageNumbers: number[] = [];
  selectedRole: string = '';
  searchTerm: string = '';
  showAddUserModal = false;
  showEditUserModal = false; // Pour afficher le modal d'édition
  inscriptionForm: FormGroup;
  error: string | null = null;
  success: boolean = false;
  loading: boolean = false;
  showDeleteModal = false; // Pour afficher le modal de suppression
  userToDelete: number | null = null; // ID de l'utilisateur à supprimer
  userToEdit: any = null; // Utilisateur à modifier
  successMessage: string | null = null; // Message de succès pour la suppression
  private socket: any;

  // Nouvelles propriétés pour le modal des paramètres
showSettingsModal: boolean = false;
userData: UserData = {
  _id: '',
  nom: '',
  prenom: '',
  email: '',
  solde: 0
};

private userApiUrl = 'https://parking-intelligent.onrender.com/api/v1/users';



  constructor(private http: HttpClient, private formBuilder: FormBuilder, private router: Router) {
    this.inscriptionForm = this.formBuilder.group({
      nom: ['', [Validators.required, this.noWhitespaceValidator]],
      prenom: ['', [Validators.required, this.noWhitespaceValidator]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      mot_de_passe: ['', [Validators.required, Validators.minLength(8)]],
      adresse: ['', [Validators.required, this.noWhitespaceValidator]],
      role: ['utilisateur'], // Valeur par défaut
      carteRfid: ['', Validators.required] // Validation par défaut
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.onRoleChange(); // Initialiser la validation de la carte RFID
    this.loadUserData(); // Charger les données de l'utilisateur

     // Initialiser Socket.IO
     this.socket = io('https://parking-intelligent.onrender.com'); // Connexion au serveur

     // Écouter l'événement 'rfidScanned'
     this.socket.on('rfidScanned', (uid: string) => {
       console.log('UID de la carte RFID reçu:', uid);
       this.inscriptionForm.patchValue({ carteRfid: uid }); // Mettre à jour le champ carteRfid
     });

  }

   // Nouvelle méthode pour charger les données de l'utilisateur
   loadUserData(): void {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId'); // Récupérer l'ID de l'utilisateur à partir du localStorage
  
    if (!token || !userId) {
        this.router.navigate(['/login']);
        return;
    }
  
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    this.http.get<{ status: string; data: { user: UserData } }>(`${this.userApiUrl}/${userId}`, { headers }).subscribe(
        (response) => {
            if (response.status === 'success') {
                this.userData = response.data.user; // Accédez à l'objet utilisateur
            } else {
                console.error('Erreur lors de la récupération des données utilisateur');
            }
        },
        (error) => {
            console.error('Erreur lors de la récupération des données utilisateur', error);
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
      this.router.navigate(['/mon-compte']);
      this.showSettingsModal = false;
    }
   

  logout(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    this.http.post('https://parking-intelligent.onrender.com/api/v1/auth/logout', {}, { headers }).subscribe(
      () => {
        // Supprimer le token du localStorage
        localStorage.removeItem('token');
        // Rediriger vers la page de connexion ou une autre page appropriée
        this.router.navigate(['/login']);
      },
      (error) => {
        console.error('Erreur lors de la déconnexion', error);
      }
    );
  }

  loadUsers() {
    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(`https://parking-intelligent.onrender.com/api/v1/users`, { params, headers }).subscribe(
      (data) => {
        console.log('Données récupérées:', data);
        this.utilisateurs = data.data.users; // Assurez-vous que c'est correct
        this.totalUsers = data.data.totalUsers;
        this.totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
        this.generatePagination();
        this.updatePaginatedItems();
      },
      (error) => {
        console.error('Erreur lors de la récupération des utilisateurs', error);
      }
    );
  }

  generatePagination() {
    this.pageNumbers = [];

    if (this.totalPages <= 5) {
      for (let i = 1; i <= this.totalPages; i++) {
        this.pageNumbers.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          this.pageNumbers.push(i);
        }
      } else if (this.currentPage >= this.totalPages - 2) {
        for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
          this.pageNumbers.push(i);
        }
      } else {
        for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) {
          this.pageNumbers.push(i);
        }
      }
    }
  }

  updatePaginatedItems() {
    const filteredUsers = this.utilisateurs.filter(user => {
      const roleMatch = this.selectedRole ? user.role === this.selectedRole : true;
      const searchMatch = user.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                          user.prenom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                          user.telephone.toString().includes(this.searchTerm); // Ajoutez cette condition pour le téléphone
      return roleMatch && searchMatch;
    });
  
    console.log('Utilisateurs filtrés:', filteredUsers); // Ajoutez ce log pour vérifier les utilisateurs filtrés
  
    this.totalUsers = filteredUsers.length;
    this.totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
    this.generatePagination();
  
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedUsers = filteredUsers.slice(start, end);
  
    console.log('Utilisateurs paginés:', this.paginatedUsers); // Ajoutez ce log pour vérifier les utilisateurs paginés
  }
  
  

  filterUsers() {
    this.currentPage = 1;
    this.updatePaginatedItems();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedItems();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedItems();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePaginatedItems();
  }

  openAddUserModal() {
    this.showAddUserModal = true;
  }

  closeAddUserModal() {
    this.showAddUserModal = false;
    this.inscriptionForm.reset(); // Réinitialiser le formulaire
    this.error = null;
    this.success = false;
  }

  openEditUserModal(user: any) {
    this.userToEdit = user; // Stocker l'utilisateur à modifier
    this.inscriptionForm.patchValue(user); // Remplir le formulaire avec les données de l'utilisateur
    this.showEditUserModal = true; // Afficher le modal d'édition
  }
  

  closeEditUserModal() {
    this.showEditUserModal = false;
    this.inscriptionForm.reset(); // Réinitialiser le formulaire
    this.userToEdit = null; // Réinitialiser l'utilisateur à modifier
    this.error = null; // Réinitialiser l'erreur
    this.success = false; // Réinitialiser le succès
  }

  onRoleChange() {
    const role = this.inscriptionForm.get('role')?.value;
    if (role === 'administrateur') {
      this.inscriptionForm.get('carteRfid')?.setValidators([Validators.required]);
    } else {
      this.inscriptionForm.get('carteRfid')?.clearValidators();
      this.inscriptionForm.get('carteRfid')?.reset(); // Réinitialise la carte RFID
    }
    this.inscriptionForm.get('carteRfid')?.updateValueAndValidity(); // Met à jour la validité
  }

  onSubmit() {
    if (this.inscriptionForm.valid) {
        this.loading = true; // Indiquer que le chargement commence
        const userData = this.inscriptionForm.value;

        // Supprimer carteRfid si le rôle est utilisateur
        if (userData.role === 'utilisateur') {
            delete userData.carteRfid;
        }

        // Envoi de la requête POST à l'API d'inscription
        this.http.post<any>('https://parking-intelligent.onrender.com/api/v1/auth/signup', userData)
            .subscribe(
                (response) => {
                    this.successMessage = 'Utilisateur ajouté avec succès'; // Message de succès
                    this.error = null; // Réinitialiser l'erreur
                    this.closeAddUserModal(); // Fermer le modal
                    this.loadUsers(); // Recharger la liste des utilisateurs

                     // Masquer le message après 3 secondes
          setTimeout(() => {
            this.successMessage = null;
        }, 4000);
                },
                (error) => {
                    this.error = error.error.message || 'Une erreur est survenue lors de l\'inscription.';
                    this.successMessage = null; // Réinitialiser le message de succès
                },
                () => {
                    this.loading = false; // Indiquer que le chargement est terminé
                }
            );
    } else {
        this.error = "Veuillez remplir tous les champs obligatoires.";
        this.successMessage = null; // Réinitialiser le message de succès
    }
}

  onEditSubmit() {
    if (this.inscriptionForm.valid) {
      this.loading = true;
      const userData = { ...this.inscriptionForm.value };
  
      // Supprimer carteRfid si le rôle est utilisateur
      if (userData.role === 'utilisateur') {
        delete userData.carteRfid;
      }
  
      // Supprimer le mot de passe pour éviter les erreurs
      delete userData.mot_de_passe;
  
      console.log('Données envoyées:', userData); // Ajoutez ce log pour vérifier les données
  
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
      this.http.patch<any>(`https://parking-intelligent.onrender.com/api/v1/users/update/${this.userToEdit._id}`, userData, { headers }).subscribe(
        (response) => {
          this.successMessage = 'Utilisateur modifié avec succès';
          this.loadUsers();
          this.closeEditUserModal();

          // Masquer le message après 3 secondes
          setTimeout(() => {
            this.successMessage = null;
        }, 4000);
        },
        (error) => {
          console.error('Erreur lors de la modification de l’utilisateur', error);
          this.error = error.error.message || 'Une erreur est survenue lors de la modification.';
        },
        () => {
          this.loading = false;
        }
      );
    } else {
      this.error = "Veuillez remplir tous les champs obligatoires.";
    }
  }
  
  

  isFieldInvalid(field: string): boolean {
    const control = this.inscriptionForm.get(field);
    return control ? control.invalid && (control.touched || control.dirty) : false;
  }

  isFormValid(): boolean {
    return this.inscriptionForm.valid;
  }

  noWhitespaceValidator(control: FormControl) {
    const isWhitespace = (control.value || '').trim().length === 0;
    return isWhitespace ? { 'whitespace': true } : null;
  }

  deleteUser(userId: number) {
    console.log('Utilisateur à supprimer ID:', userId);
    this.userToDelete = userId; // Stocker l'utilisateur à supprimer
    this.showDeleteModal = true; // Afficher le modal de confirmation
  }

  confirmDelete() {
    console.log('Confirmation de suppression pour l’utilisateur ID:', this.userToDelete); 
    if (this.userToDelete) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.delete(`https://parking-intelligent.onrender.com/api/v1/users/${this.userToDelete}`, { headers }).subscribe(
          () => {
              console.log('Utilisateur supprimé avec succès');
              this.successMessage = 'Utilisateur supprimé avec succès'; // Définir le message de succès
              this.loadUsers(); // Recharger la liste des utilisateurs après suppression
              this.showDeleteModal = false; // Fermer le modal
              this.userToDelete = null; // Réinitialiser l'ID de l'utilisateur

              // Masquer le message après 3 secondes
              setTimeout(() => {
                  this.successMessage = null;
              }, 4000);
          },
          (error) => {
              console.error('Erreur lors de la suppression de l’utilisateur', error);
              this.showDeleteModal = false; // Fermer le modal en cas d'erreur
          }
      );
    }
  }

  cancelDelete() {
    this.showDeleteModal = false; // Fermer le modal sans supprimer
    this.userToDelete = null; // Réinitialiser l'ID de l'utilisateur
  }
  searchUser(): void {
    if (this.searchTerm.trim() === '') {
      this.loadUsers(); // Recharge tous les utilisateurs si le champ est vide
      return;
    }
  
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    console.log('Terme de recherche:', this.searchTerm);
  
    this.http.get<any>(`${this.userApiUrl}/telephone/${this.searchTerm}`, { headers }).subscribe(
      (response) => {
        console.log('Résultats de la recherche:', response);
  
        // Vérifiez si la réponse contient un utilisateur unique
        if (response.data.user) {
          this.utilisateurs = [response.data.user]; // Convertir en tableau
        } else {
          this.utilisateurs = response.data.users || []; // Utiliser un tableau vide si aucun utilisateur trouvé
        }
  
        console.log('Utilisateurs après recherche:', this.utilisateurs); // Ajoutez ce log pour vérifier les utilisateurs
  
        this.totalUsers = this.utilisateurs.length; // Mettre à jour le total d'utilisateurs
        this.totalPages = Math.ceil(this.totalUsers / this.itemsPerPage); // Calculer le total de pages
        this.generatePagination(); // Générer la pagination
        this.updatePaginatedItems(); // Mettre à jour les utilisateurs paginés
      },
      (error) => {
        console.error('Erreur lors de la recherche d\'utilisateurs', error);
      }
    );
  }
  
  
  
}