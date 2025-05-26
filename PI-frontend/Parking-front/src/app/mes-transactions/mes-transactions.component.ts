import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';



// Enregistrer les composants Chart.js
Chart.register(...registerables);

interface UserData {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  solde: number;
  telephone: string;
}

@Component({
  selector: 'app-mes-transactions',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './mes-transactions.component.html',
  styleUrls: ['./mes-transactions.component.css']
})
export class MesTransactionsComponent implements OnInit, OnDestroy {
    // Données de l'utilisateur
  userData: any = {}; // Initialiser comme un objet vide


  // Formulaires pour dépôt et retrait
  depositForm: FormGroup;
  withdrawForm: FormGroup;
  isDepositModalOpen = false;
  isWithdrawModalOpen = false;

  currentPage: number = 1; // Page actuelle
itemsPerPage: number = 4; // Nombre d'éléments par page
totalPages: number = 0; // Total des pages
pageNumbers: number[] = []; // Numéros de pages
visibleTransactions: any[] = []; // Propriété pour stocker les transactions visibles

// Nouvelles propriétés pour le modal des paramètres
showSettingsModal: boolean = false;



private userApiUrl = 'https://parking-intelligent.onrender.com/api/v1/users';


  // État de la visibilité du solde
  isBalanceVisible: boolean = true; // Initialement visible

  dailyTransactions: any[] = []; // Propriété pour stocker les transactions de la journée
  
  // Données des transactions
  transactions: any[] = []; // Propriété pour stocker les transactions
  weeklyData: { labels: string[], depositValues: number[], withdrawalValues: number[] } = { 
    labels: [], 
    depositValues: [], 
    withdrawalValues: [] 
}; // Données pour le graphique
  successMessage: string | null = null; // Variable pour stocker le message de succès

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    // Initialisation des formulaires
    this.depositForm = this.fb.group({
      telephone: ['', Validators.required],
      montant: ['', [Validators.required, Validators.min(1)]]
    });

    this.withdrawForm = this.fb.group({
      telephone: ['', Validators.required],
      montant: ['', [Validators.required, Validators.min(1)]]
    });
  }

  subscriptions: Subscription[] = [];


  ngOnInit(): void {
    this.setupBalanceToggle();
    this.fetchUserData(); // Appeler la méthode pour récupérer les données de l'utilisateur
    this.loadUserData(); // Charger les données de l'utilisateur
    this.fetchUserTransactions(); // Appel des transactions ici



  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());

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
    
 


  setupBalanceToggle(): void {
    // Attendre que le DOM soit complètement chargé
    setTimeout(() => {
      const toggleButton = document.getElementById('toggleBalance');
      const balanceAmount = document.getElementById('balanceAmount');
      const balanceHidden = document.getElementById('balanceHidden');
      const eyeIcon = document.getElementById('eyeIcon');

      if (toggleButton && balanceAmount && balanceHidden && eyeIcon) {
        toggleButton.addEventListener('click', () => {
          this.isBalanceVisible = !this.isBalanceVisible;

          if (this.isBalanceVisible) {
            balanceAmount.style.display = 'block';
            balanceHidden.style.display = 'none';
            eyeIcon.className = 'fa fa-eye';
          } else {
            balanceAmount.style.display = 'none';
            balanceHidden.style.display = 'block';
            eyeIcon.className = 'fa fa-eye-slash';
          }
        });
      }
    }, 0);
  }

updateVisibleTransactions(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.visibleTransactions = this.transactions.slice(start, end); // Transactions à afficher
}

goToPage(page: number): void {
    this.currentPage = page;
    this.updateVisibleTransactions(); // Mettre à jour les transactions visibles
}

previousPage(): void {
    if (this.currentPage > 1) {
        this.currentPage--;
        this.updateVisibleTransactions();
    }
}

nextPage(): void {
    if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.updateVisibleTransactions();
    }
}

 
  // Méthode de déconnexion
  logout(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post('https://parking-intelligent.onrender.com/api/v1/auth/logout', {}, { headers }).subscribe(
      () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId'); // Assurez-vous de supprimer l'ID de l'utilisateur lors de la déconnexion
        this.router.navigate(['/login']);
      },
      (error) => {
        console.error('Erreur lors de la déconnexion', error);
        alert('Erreur lors de la déconnexion. Vérifiez la console pour plus d\'informations.');
      }
    );
  }

  
  fetchUserData(): void {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Aucun token trouvé, l\'utilisateur n\'est pas authentifié.');
        return;
    }

    this.http.get('https://parking-intelligent.onrender.com/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe(
        (response: any) => {
            if (response && response.data && response.data.user) {
                this.userData = {
                    nom: response.data.user.nom,
                    prenom: response.data.user.prenom,
                    telephone: response.data.user.telephone,
                    solde: response.data.user.solde,
                    email: response.data.user.email // Assurez-vous que tous les champs sont présents
                };
            } else {
                console.error('Structure de réponse inattendue:', response);
            }
        },
        error => {
            console.error('Erreur lors de la récupération des données de l\'utilisateur:', error);
        }
    );
}


fetchUserTransactions(): void {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Token non trouvé.');
    return;
  }

  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  this.http.get<any>('https://parking-intelligent.onrender.com/api/v1/transfers/mes-transactions', { headers }).subscribe(
    (response) => {
      if (response.status === 'success') {
        this.transactions = response.data.transfers;
        this.totalPages = Math.ceil(this.transactions.length / this.itemsPerPage);
        this.updateVisibleTransactions(); // Met à jour les transactions visibles pour la pagination
      } else {
        console.error('Erreur lors du chargement des transactions.');
      }
    },
    (error) => {
      console.error('Erreur API :', error);
    }
  );
}

toggleBalanceVisibility(): void {
  this.isBalanceVisible = !this.isBalanceVisible; // Inverser l'état
}
}