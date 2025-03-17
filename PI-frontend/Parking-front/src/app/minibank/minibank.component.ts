import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';

// Enregistrer les composants Chart.js
Chart.register(...registerables);

interface UserData {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  solde: number;
  telephone : number
}

@Component({
  selector: 'app-minibank',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './minibank.component.html',
  styleUrls: ['./minibank.component.css']
})
export class MinibankComponent implements OnInit {
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


private userApiUrl = 'http://localhost:3000/api/v1/users';


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

  ngOnInit(): void {
    this.setupBalanceToggle();
    this.fetchTransactions(); // Appeler la méthode pour récupérer les transactions
    this.fetchUserData(); // Appeler la méthode pour récupérer les données de l'utilisateur
    this.loadUserData(); // Charger les données de l'utilisateur


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
      this.router.navigate(['/modifier-utilisateur']);
      this.showSettingsModal = false;
    }
    
    // Navigation vers la page de changement de mot de passe
    goToChangePassword(): void {
      this.router.navigate(['/changer-mot-de-passe']);
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


fetchTransactions(): void {
  const token = localStorage.getItem('token');
  this.http.get('http://localhost:3000/api/v1/transfers', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).subscribe(
    (response: any) => {
      this.transactions = response.data.transfers;
      console.log('Transactions récupérées:', this.transactions);

      // Trier les transactions par date décroissante
      this.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Mettre à jour les transactions visibles
      this.totalPages = Math.ceil(this.transactions.length / this.itemsPerPage);
      this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);
      this.updateVisibleTransactions();

      // Filtrer les transactions de la journée
      this.filterDailyTransactions();
      this.initializeChart();
    },
    error => {
      console.error('Erreur lors de la récupération des transactions:', error);
    }
  );
}

filterDailyTransactions(): void {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  this.dailyTransactions = this.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startOfDay && transactionDate <= endOfDay;
  });

  console.log('Transactions filtrées pour la journée:', this.dailyTransactions);
  this.prepareChartData(this.dailyTransactions);
}

prepareChartData(transactions: any[]): void {
  const labels: string[] = Array.from({ length: 19 }, (_, i) => (i + 6).toString()); // Heures de 6h à 00h
  const depositValues: number[] = Array(19).fill(0); // Pour stocker les dépôts par heure
  const withdrawalValues: number[] = Array(19).fill(0); // Pour stocker les retraits par heure

  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const hour = date.getHours(); // Obtenir l'heure
    const amount = transaction.type === 'depot' ? transaction.montant : -transaction.montant;

    // Ajouter le montant au tableau approprié
    if (hour >= 6 && hour <= 23) { // Vérifier que l'heure est dans la plage 6h à 00h
      if (transaction.type === 'depot') {
        depositValues[hour - 6] += transaction.montant;
      } else {
        withdrawalValues[hour - 6] += transaction.montant;
      }
    }
  });

  console.log('Données préparées pour le graphique:', { labels, depositValues, withdrawalValues });
  this.weeklyData = { labels, depositValues, withdrawalValues };
}



  filterMonthlyTransactions(): void {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // Début du mois
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Fin du mois

    // Filtrer les transactions du mois
    const monthlyTransactions = this.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });

    // Préparer les données pour le graphique
    this.prepareChartData(monthlyTransactions);
  }

  filterYearlyTransactions(): void {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1); // Début de l'année
    const endOfYear = new Date(now.getFullYear(), 11, 31); // Fin de l'année

    // Filtrer les transactions de l'année
    const yearlyTransactions = this.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startOfYear && transactionDate <= endOfYear;
    });

    // Préparer les données pour le graphique
    this.prepareChartData(yearlyTransactions);
  }


  initializeChart(): void {
    const ctx = document.getElementById('transactionChart') as HTMLCanvasElement;
  
    if (ctx) {
      ctx.innerHTML = ''; // Pour éviter la superposition des graphiques
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.weeklyData.labels, // Heures de 6h à 00h
          datasets: [
            {
              label: 'Dépôts',
              data: this.weeklyData.depositValues, // Montants des dépôts par heure
              borderColor: '#4CAF50', // Couleur verte pour les dépôts
              backgroundColor: 'rgba(76, 175, 80, 0.1)', // Fond clair pour les dépôts
              fill: true,
              tension: 0.4
            },
            {
              label: 'Retraits',
              data: this.weeklyData.withdrawalValues, // Montants des retraits par heure
              borderColor: '#F44336', // Couleur rouge pour les retraits
              backgroundColor: 'rgba(244, 67, 54, 0.1)', // Fond clair pour les retraits
              fill: true,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true // Affiche la légende pour distinguer les courbes
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' + context.raw + ' FCFA';
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Heures'
              },
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                callback: function(value) {
                  return value + ' FCFA';
                }
              }
            }
          }
        }
      });
    }
  }
  

  // Ouvrir le modal de dépôt
  showDepositModal(): void {
    this.isDepositModalOpen = true;
  }

  // Ouvrir le modal de retrait
  showWithdrawModal(): void {
    this.isWithdrawModalOpen = true;
  }

  // Fermer le modal de dépôt
  closeDepositModal(): void {
    this.isDepositModalOpen = false;
    this.depositForm.reset();
  }

  // Fermer le modal de retrait
  closeWithdrawModal(): void {
    this.isWithdrawModalOpen = false;
    this.withdrawForm.reset();
  }

  // Soumettre le formulaire de dépôt
  submitDeposit(): void {
    const depositData = this.depositForm.value;
    const token = localStorage.getItem('token'); // Récupération du token

    this.http.post('http://localhost:3000/api/v1/users/deposit', depositData, {
      headers: { 'Authorization': `Bearer ${token}` } // Utilisation du token
    }).subscribe(
      response => {
        console.log('Dépôt réussi:', response);
        this.closeDepositModal();
        this.showSuccessMessage('Dépôt effectué avec succès !'); // Afficher le message de succès
      },
      error => {
        console.error('Erreur lors du dépôt:', error);
      }
    );
  }

  // Soumettre le formulaire de retrait
  submitWithdraw(): void {
    const withdrawData = this.withdrawForm.value;
    const token = localStorage.getItem('token'); // Récupération du token

    this.http.post('http://localhost:3000/api/v1/users/withdraw', withdrawData, {
      headers: { 'Authorization': `Bearer ${token}` } // Utilisation du token
    }).subscribe(
      response => {
        console.log('Retrait réussi:', response);
        this.closeWithdrawModal();
        this.showSuccessMessage('Retrait effectué avec succès !'); // Afficher le message de succès
      },
      error => {
        console.error('Erreur lors du retrait:', error);
      }
    );
  }

  // Méthode pour afficher le message de succès
  showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null; // Masquer le message après 3 secondes
    }, 4000);
  }

  // Méthode de déconnexion
  logout(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post('http://localhost:3000/api/v1/auth/logout', {}, { headers }).subscribe(
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

  changePeriod(period: string): void {
    console.log('Changement de période:', period);
    // Mettre à jour le graphique en fonction de la période sélectionnée
    if (period === 'day') {
      this.filterDailyTransactions(); // Filtrer les transactions de la semaine
    } else if (period === 'month') {
      this.filterMonthlyTransactions(); // Filtrer les transactions du mois
    } else if (period === 'year') {
      this.filterYearlyTransactions(); // Filtrer les transactions de l'année
    }

    this.initializeChart(); // Réinitialiser le graphique avec les données filtrées
  }
  fetchUserData(): void {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Aucun token trouvé, l\'utilisateur n\'est pas authentifié.');
        return;
    }

    this.http.get('http://localhost:3000/api/v1/auth/me', {
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

toggleBalanceVisibility(): void {
  this.isBalanceVisible = !this.isBalanceVisible; // Inverser l'état
}
}