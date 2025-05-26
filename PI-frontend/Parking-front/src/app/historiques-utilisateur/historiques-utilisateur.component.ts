import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http'; 
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms'; // Importer ReactiveFormsModule
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';



import { Chart, registerables } from 'chart.js';

// Enregistrer tous les modules de Chart.js
Chart.register(...registerables);

interface ApiUser {
  nom: string;
  prenom: string;
  telephone: string; 

}

interface UserData {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  solde: number;
}

interface ApiParking {
  nom_du_parking: string;
  adresse: string;
}

interface ApiPlace {
  _id: string;
  nomPlace: string; // Nom de la place
  statut: string;
}

interface ApiReservation {
  _id: string;
  userId: ApiUser; // Assurez-vous que cette propriété est bien définie
  parkingId: ApiParking; // Assurez-vous que cette propriété est bien définie
  tarifId: string; // Ajoutez cette propriété si nécessaire
  typeVehicule: string;
  placeId: ApiPlace; // Changez ceci pour le type ApiPlace
  heureRestante: string; // ou Date si vous traitez cela comme une date
  duree: string;
  etat: string;
  montant: number;
  paiement: string;
  codeNumerique: number;
  numeroRecu: string; // Assurez-vous que cette propriété est bien définie
  createdAt: string; // ou Date si vous traitez cela comme une date
  updatedAt: string; // ou Date si vous traitez cela comme une date
  heureArrivee: string; // ou Date si vous traitez cela comme une date
  heureDepart: string; // ou Date si vous traitez cela comme une date
  numeroImmatriculation: string;
}
@Component({
    selector: 'app-historiques-reservations',
    imports: [CommonModule, RouterModule, HttpClientModule, FormsModule, ReactiveFormsModule],
    templateUrl: './historiques-utilisateur.component.html',
    styleUrls: ['./historiques-utilisateur.component.css']
})
export class HistoriquesUtilisateurComponent implements OnInit, AfterViewInit {
  @ViewChild('occupancyChart') occupancyChartRef!: ElementRef;
  @ViewChild('peakHoursChart') peakHoursChartRef!: ElementRef;
  
  reservations: ApiReservation[] = [];
  paginatedReservations: ApiReservation[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 2;
  totalReservations: number = 0;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  ongoingReservations: number = 0;
  completedReservations: number = 0;
  cancelledReservations: number = 0;

  etatOptions: string[] = ['Tous les statuts', 'En cours', 'Terminée', 'Annulée'];
  parkingOptions: string[] = [];

  selectedEtat: string = 'Tous les statuts';
  selectedParking: string = 'Tous les parkings';
  selectedStatsParking: string = '';
  
  showStatsModal: boolean = false;
  occupancyChart: Chart | null = null;
  peakHoursChart: Chart | null = null;

  showInvoiceModal: boolean = false;
  selectedReservation: ApiReservation | null = null;

  currentDate: Date = new Date(); // Initialise à la date actuelle

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


  isModalActive: boolean = false; // Initialiser à false pour que le modal soit fermé par défaut
  isCancelModalActive: boolean = false; // Pour le modal d'annulation
  editReservation: ApiReservation = {
    _id: '',
    userId: { nom: '', prenom: '', telephone: '' },
    parkingId: { nom_du_parking: '', adresse: '' },
    tarifId: '',
    typeVehicule: '',
    placeId: { _id: '', nomPlace: '', statut: '' },
    heureRestante: '',
    duree: '',
    etat: '',
    montant: 0,
    paiement: '',
    codeNumerique: 0,
    numeroRecu: '',
    createdAt: '',
    updatedAt: '',
    heureArrivee: '',
    heureDepart: '',
    numeroImmatriculation: ''
};






  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadReservations();
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
      this.router.navigate(['/mon-compte-utilisateur']);
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
        // Gérer l'erreur, par exemple en affichant un message à l'utilisateur
      }
    );
  }

  ngAfterViewInit(): void {
    // Les références aux éléments Canvas seront disponibles ici
  }

  loadReservations(): void {
    try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId'); // Vérifier localStorage ici

        if (!token || !userId) {
            console.warn('Token ou userId non disponible dans localStorage');
            return; // Sortir si les données ne sont pas disponibles
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        this.http.get<{ data: { reservations: ApiReservation[] } }>(`https://parking-intelligent.onrender.com/api/v1/reservations/user/${userId}`, { headers })
            .subscribe(
                (response) => {
                    this.reservations = response.data.reservations;
                    this.applyFilters();
                    this.totalReservations = this.reservations.length;
                    this.totalPages = Math.ceil(this.totalReservations / this.itemsPerPage);
                    this.generatePagination();
                    this.updateStats();
                    this.loadParkingOptions();
                },
                (error) => {
                    console.error('Erreur lors de la récupération des réservations', error);
                }
            );
    } catch (error) {
        console.warn('localStorage non disponible', error);
    }
}


openEditModal(reservation: ApiReservation): void {
  this.editReservation = { ...reservation }; // Créez une copie pour l'édition
  this.isModalActive = true; // Ouvrir le modal
}

closeEditModal(): void {
  this.isModalActive = false; // Fermer le modal
}

updateReservation(): void {
  if (!this.editReservation) return;

  const token = localStorage.getItem('token');
  if (!token) {
      console.error('Token manquant');
      return; // Gestion de l'erreur
  }

  const updatedData = {
      heureArrivee: this.editReservation.heureArrivee,
      heureDepart: this.editReservation.heureDepart,
      typeVehicule: this.editReservation.typeVehicule,
      numeroImmatriculation: this.editReservation.numeroImmatriculation,
      placeId: this.editReservation.placeId,
      paiement: this.editReservation.paiement
  };

  const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
  });

  this.http.put(`https://parking-intelligent.onrender.com/api/v1/reservations/${this.editReservation._id}`, updatedData, { headers })
      .subscribe(
          (response) => {
              console.log('Réservation mise à jour:', response);
              this.closeEditModal(); // Fermer le modal après mise à jour
              this.loadReservations(); // Rechargez les réservations
          },
          (error) => {
              console.error('Erreur lors de la mise à jour:', error);
          }
      );
}

handleOutsideClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const modalContent = document.querySelector('.stats-modal-content');

  // Vérifier si le clic a eu lieu en dehors du contenu du modal
  if (modalContent && !modalContent.contains(target)) {
      this.closeStatsModal(); // Fermer le modal
  }
}


cancelReservation(reservation: ApiReservation): void {
  const token = localStorage.getItem('token'); // Récupérer le token
  const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}` // Ajouter le token aux en-têtes
  });

  this.http.patch(`https://parking-intelligent.onrender.com/api/v1/reservations/${reservation._id}/cancel`, {}, { headers })
      .subscribe(
          (response) => {
              console.log('Réservation annulée:', response);
              this.loadReservations(); // Rechargez les réservations après annulation
              this.closeCancelModal(); // Fermer le modal après annulation
          },
          (error) => {
              console.error('Erreur lors de l\'annulation:', error);
          }
      );
}




  applyFilters(): void {
    let filteredReservations = this.reservations;

    if (this.selectedEtat !== 'Tous les statuts') {
        filteredReservations = filteredReservations.filter(reservation => reservation.etat === this.selectedEtat);
    }

    if (this.selectedParking !== 'Tous les parkings') {
        filteredReservations = filteredReservations.filter(reservation => reservation.parkingId.nom_du_parking === this.selectedParking);
    }

    this.totalReservations = filteredReservations.length;
    this.paginatedReservations = filteredReservations.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage);
    this.totalPages = Math.ceil(this.totalReservations / this.itemsPerPage);
    this.generatePagination();
  }

  generatePagination(): void {
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

  updateStats(): void {
    this.totalReservations = this.reservations.length;
    this.ongoingReservations = this.reservations.filter(res => res.etat === 'En cours').length;
    this.completedReservations = this.reservations.filter(res => res.etat === 'Terminée').length;
    this.cancelledReservations = this.reservations.filter(res => res.etat === 'Annulée').length;
  }

  updatePaginatedItems(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedReservations = this.reservations.slice(start, end);
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

  loadParkingOptions(): void {
    const parkings = new Set(this.reservations.map(reservation => reservation.parkingId.nom_du_parking));
    this.parkingOptions = Array.from(parkings);
  }

  // Nouvelles méthodes pour les statistiques
  openStatsModal(): void {
    if (this.selectedStatsParking) {
      this.showStatsModal = true;
      setTimeout(() => {
        this.generateOccupancyChart();
        this.generatePeakHoursChart();
      }, 100);
    }
  }

  closeStatsModal(): void {
    this.showStatsModal = false;
    this.selectedStatsParking = '';
    // Détruire les graphiques pour éviter les fuites de mémoire
    if (this.occupancyChart) {
      this.occupancyChart.destroy();
      this.occupancyChart = null;
    }
    if (this.peakHoursChart) {
      this.peakHoursChart.destroy();
      this.peakHoursChart = null;
    }
  }


  generateOccupancyChart(): void {
    if (!this.occupancyChartRef) return;

    // Filtrer les réservations pour le parking sélectionné
    const parkingReservations = this.reservations.filter(
        reservation => reservation.parkingId.nom_du_parking === this.selectedStatsParking
    );

    // Obtenir les 7 derniers jours
    const last7Days = this.getLast7Days();
    
    // Calculer le taux d'occupation pour chaque jour
    const occupancyData = last7Days.map(day => {
        const dayReservations = parkingReservations.filter(reservation => {
            const arrivalDate = new Date(reservation.heureArrivee);
            return arrivalDate.toDateString() === day.date.toDateString();
        });

        const totalCapacity = 100; // Remplacez avec la capacité réelle de votre parking
        const occupiedSpots = dayReservations.length; // Nombre de réservations pour le jour
        return (occupiedSpots / totalCapacity) * 100; // Taux d'occupation en pourcentage
    });

    // Détruire le graphique précédent s'il existe
    if (this.occupancyChart) {
        this.occupancyChart.destroy();
    }

    const ctx = this.occupancyChartRef.nativeElement.getContext('2d');
    this.occupancyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days.map(day => day.label),
            datasets: [{
                label: 'Taux d\'occupation (%)',
                data: occupancyData,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Taux d\'occupation (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Jour'
                    }
                }
            }
        }
    });
}

  generatePeakHoursChart(): void {
    if (!this.peakHoursChartRef) return;

    // Filtrer les réservations pour le parking sélectionné
    const parkingReservations = this.reservations.filter(
        reservation => reservation.parkingId.nom_du_parking === this.selectedStatsParking
    );

    // Créer un tableau pour les 24 heures de la journée
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    // Calculer l'affluence pour chaque heure
    const hourlyData = hours.map(hour => {
        const hourReservations = parkingReservations.filter(reservation => {
            const arrivalDate = new Date(reservation.heureArrivee);
            return arrivalDate.getHours() === hour;
        });
        
        // Nombre de réservations pour cette heure
        return hourReservations.length;
    });

    // Détruire le graphique précédent s'il existe
    if (this.peakHoursChart) {
        this.peakHoursChart.destroy();
    }

    const ctx = this.peakHoursChartRef.nativeElement.getContext('2d');
    this.peakHoursChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours.map(hour => `${hour}h`),
            datasets: [{
                label: 'Nombre de réservations',
                data: hourlyData,
                backgroundColor: 'rgba(250, 226, 8, 0.7)',
                borderColor: 'rgb(173, 134, 4)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nombre de réservations'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Heure'
                    }
                }
            }
        }
    });
}
  // Fonction utilitaire pour obtenir les 7 derniers jours
  getLast7Days(): { date: Date, label: string }[] {
    const days = [];
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    // Obtenir le jour de la semaine actuel
    const today = new Date();
    const dayOfWeek = today.getDay(); // Dimanche = 0, Lundi = 1, ..., Samedi = 6
    const lastMonday = new Date(today);
    
    // Déterminer le dernier lundi
    if (dayOfWeek === 0) {
        lastMonday.setDate(today.getDate() - 6); // Si aujourd'hui est dimanche, commence au lundi précédent
    } else {
        lastMonday.setDate(today.getDate() - (dayOfWeek - 1)); // Récupérer le lundi de cette semaine
    }

    // Créer un tableau des 7 derniers jours en commençant par le lundi
    for (let i = 0; i < 7; i++) {
        const date = new Date(lastMonday);
        date.setDate(lastMonday.getDate() + i);
        days.push({
            date,
            label: `${dayNames[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`
        });
    }
    
    return days;
}
   // Méthode pour ouvrir le modal de facture
   openInvoiceModal(reservation: ApiReservation): void {
    this.selectedReservation = reservation;
    this.showInvoiceModal = true;
}

closeInvoiceModal(): void {
  console.log('Fermeture du modal');
  this.showInvoiceModal = false; // Changez la variable pour masquer le modal
}

closeIfOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const modalContent = document.querySelector('.invoice-modal-content');

  // Vérifier si le clic a eu lieu en dehors du contenu du modal
  if (modalContent && !modalContent.contains(target)) {
      this.closeInvoiceModal();
  }
}

closeModalIfOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  if (target.classList.contains('modal')) {
      this.closeEditModal(); // Fermer le modal si le clic est à l'extérieur du contenu
  }
}


openCancelModal(reservation: ApiReservation): void {
  this.editReservation = reservation; // Passer la réservation à annuler
  this.isCancelModalActive = true; // Ouvrir le modal d'annulation
}

closeCancelModal(): void {
  this.isCancelModalActive = false; // Fermer le modal d'annulation
}


downloadInvoice(reservation: ApiReservation | null): void {
  if (!reservation) return;

  const invoiceElement = document.querySelector('.invoice-container') as HTMLElement; // Sélectionner le conteneur de la facture
  const downloadButton = document.querySelector('.download-invoice') as HTMLElement; // Sélectionner le bouton

  if (invoiceElement && downloadButton) {
      // Masquer le bouton
      downloadButton.style.display = 'none';

      html2canvas(invoiceElement).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF();
          const imgWidth = 190; // Largeur de l'image dans le PDF
          const pageHeight = pdf.internal.pageSize.height;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;

          let position = 0;

          // Ajouter l'image au PDF
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          // Ajouter des pages supplémentaires si nécessaire
          while (heightLeft >= 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
          }

          // Télécharger le PDF
          pdf.save(`facture_${reservation.codeNumerique}.pdf`);

          // Réafficher le bouton après le téléchargement
          downloadButton.style.display = 'block';
      });
  }
}
}