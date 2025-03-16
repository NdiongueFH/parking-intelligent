import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';

// Enregistrer les composants Chart.js
Chart.register(...registerables);

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

  // État de la visibilité du solde
  isBalanceVisible: boolean = true; // Initialement visible
  
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
 
  fetchTransactions(): void {
    const token = localStorage.getItem('token'); // Récupération du token
    this.http.get('http://localhost:3000/api/v1/transfers', {
        headers: { 'Authorization': `Bearer ${token}` } // Utilisation du token
    }).subscribe(
        (response: any) => {
            this.transactions = response.data.transfers; // Stocker les transactions récupérées
            
            // Trier les transactions du plus récent au plus ancien
            this.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            this.filterWeeklyTransactions(); // Filtrer les transactions de la semaine
            this.initializeChart(); // Initialiser le graphique après le filtrage
        },
        error => {
            console.error('Erreur lors de la récupération des transactions:', error);
        }
    );
}
  filterWeeklyTransactions(): void {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Début de la semaine (dimanche)
    const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6)); // Fin de la semaine (samedi)

    // Filtrer les transactions de la semaine
    const weeklyTransactions = this.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startOfWeek && transactionDate <= endOfWeek;
    });

    // Préparer les données pour le graphique
    this.prepareChartData(weeklyTransactions);
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

  prepareChartData(transactions: any[]): void {
    const labels: string[] = [];
    const depositValues: number[] = [];
    const withdrawalValues: number[] = [];

    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('fr-FR', { weekday: 'long' }); // Obtenir le nom du jour ou le mois
        const amount = transaction.type === 'depot' ? transaction.montant : -transaction.montant;

        // Vérifier si le jour existe déjà dans les labels
        const index = labels.indexOf(formattedDate);
        if (index > -1) {
            if (transaction.type === 'depot') {
                depositValues[index] += transaction.montant; // Ajouter au montant du dépôt
            } else {
                withdrawalValues[index] += transaction.montant; // Ajouter au montant du retrait
            }
        } else {
            labels.push(formattedDate); // Ajouter un nouveau jour
            depositValues.push(transaction.type === 'depot' ? transaction.montant : 0); // Ajouter le montant du dépôt
            withdrawalValues.push(transaction.type === 'retrait' ? transaction.montant : 0); // Ajouter le montant du retrait
        }
    });

    this.weeklyData = { labels, depositValues, withdrawalValues }; // Stocker les données pour le graphique
}

initializeChart(): void {
    const ctx = document.getElementById('transactionChart') as HTMLCanvasElement;

    if (ctx) {
        ctx.innerHTML = ''; // Pour éviter le superposition des graphiques
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.weeklyData.labels,
                datasets: [
                  {
                    label: 'Dépôts',
                    data: this.weeklyData.depositValues,
                    borderColor: '#4CAF50', // Couleur verte pour les dépôts
                    backgroundColor: 'rgba(76, 175, 80, 0.1)', // Fond clair pour les dépôts
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Retraits',
                    data: this.weeklyData.withdrawalValues,
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
                        display: true
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
    if (period === 'week') {
      this.filterWeeklyTransactions(); // Filtrer les transactions de la semaine
    } else if (period === 'month') {
      this.filterMonthlyTransactions(); // Filtrer les transactions du mois
    } else if (period === 'year') {
      this.filterYearlyTransactions(); // Filtrer les transactions de l'année
    }

    this.initializeChart(); // Réinitialiser le graphique avec les données filtrées
  }

  fetchUserData(): void {
    const token = localStorage.getItem('token');
    console.log('Token récupéré:', token); // Log du token

    if (!token) {
        console.error('Aucun token trouvé, l\'utilisateur n\'est pas authentifié.');
        return;
    }

    this.http.get('http://localhost:3000/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe(
        (response: any) => {
            console.log('Réponse de l\'API:', response); // Log de la réponse de l'API
            if (response && response.data && response.data.user) {
                this.userData = {
                    name: response.data.user.prenom,
                    phone: response.data.user.telephone,
                    balance: response.data.user.solde
                };
                console.log('Données utilisateur assignées:', this.userData); // Log des données assignées
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