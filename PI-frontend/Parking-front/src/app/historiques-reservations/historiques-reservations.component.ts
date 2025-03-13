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
}
@Component({
  selector: 'app-historiques-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule,ReactiveFormsModule],
  templateUrl: './historiques-reservations.component.html',
  styleUrls: ['./historiques-reservations.component.css']
})
export class HistoriquesReservationsComponent implements OnInit, AfterViewInit {
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
    heureDepart: ''
};




  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  logout(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    this.http.post('http://localhost:3000/api/v1/auth/logout', {}, { headers }).subscribe(
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
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
    });

    this.http.get<{ data: { reservations: ApiReservation[] } }>('http://localhost:3000/api/v1/reservations', { headers })
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
}

// Méthode pour modifier une réservation
updateReservation(): void {
  if (!this.editReservation) return;

  const updatedData = {
      heureArrivee: this.editReservation.heureArrivee,
      heureDepart: this.editReservation.heureDepart,
      typeVehicule: this.editReservation.typeVehicule,
      placeId: this.editReservation.placeId,
      paiement: this.editReservation.paiement
  };

  this.http.put(`http://localhost:3000/api/v1/reservations/${this.editReservation._id}`, updatedData)
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

openEditModal(reservation: ApiReservation): void {
  this.editReservation = { ...reservation }; // Créez une copie pour l'édition
  this.isModalActive = true; // Ouvrir le modal
}

closeEditModal(): void {
  this.isModalActive = false; // Fermer le modal
}


cancelReservation(reservation: ApiReservation): void {
  const token = localStorage.getItem('token'); // Récupérer le token
  const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}` // Ajouter le token aux en-têtes
  });

  this.http.patch(`http://localhost:3000/api/v1/reservations/${reservation._id}/cancel`, {}, { headers })
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

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedItems();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedItems();
    }
  }

  goToPage(page: number): void {
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
      
      // Calcul du taux d'occupation (pour l'exemple, nous utilisons une valeur aléatoire entre 10 et 90%)
      // En production, cela devrait être basé sur la capacité réelle du parking
      return Math.floor(Math.random() * 80) + 10;
    });

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
      // Pour l'exemple, nous ajoutons une valeur aléatoire pour simuler les données
      const baseCount = hourReservations.length;
      return baseCount + Math.floor(Math.random() * 10);
    });

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
          backgroundColor: 'rgba(33, 150, 243, 0.7)',
          borderColor: 'rgba(33, 150, 243, 1)',
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
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
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