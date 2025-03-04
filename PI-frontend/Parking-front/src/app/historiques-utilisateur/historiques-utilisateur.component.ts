import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http'; 
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms'; 
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
  userId: ApiUser; 
  parkingId: ApiParking; 
  tarifId: string; 
  typeVehicule: string;
  placeId: ApiPlace; 
  heureRestante: string; 
  duree: string;
  statut: string;
  etat: string;
  montant: number;
  paiement: string;
  codeNumerique: number;
  numeroRecu: string; 
  createdAt: string; 
  updatedAt: string; 
  heureArrivee: string; 
  heureDepart: string; 
}

@Component({
  selector: 'app-historiques-utilisateur',
  standalone: true,
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

  etatOptions: string[] = ['Tous les statuts', 'En cours', 'Terminées', 'Annulee'];
  parkingOptions: string[] = [];

  selectedEtat: string = 'Tous les statuts';
  selectedParking: string = 'Tous les parkings';
  selectedStatsParking: string = '';
  
  showStatsModal: boolean = false;
  showInvoiceModal: boolean = false;
  selectedReservation: ApiReservation | null = null;

  isModalActive: boolean = false; 
  editReservation: ApiReservation = {
    _id: '',
    userId: { nom: '', prenom: '', telephone: '' },
    parkingId: { nom_du_parking: '', adresse: '' },
    tarifId: '',
    typeVehicule: '',
    placeId: { _id: '', nomPlace: '', statut: '' },
    heureRestante: '',
    duree: '',
    statut: '',
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
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
      },
      (error) => {
        console.error('Erreur lors de la déconnexion', error);
      }
    );
  }

  ngAfterViewInit(): void { }

  loadReservations(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
    });

    const userId = this.getUserIdFromToken(token);

    this.http.get<{ status: string; data: { reservations: ApiReservation[] } }>(`http://localhost:3000/api/v1/reservations/user/${userId}`, { headers })
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

  getUserIdFromToken(token: string | null): string {
    if (!token) return '';
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.id; 
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
    this.completedReservations = this.reservations.filter(res => res.etat === 'Terminées').length;
    this.cancelledReservations = this.reservations.filter(res => res.etat === 'Annulee').length;
  }

  loadParkingOptions(): void {
    const parkings = new Set(this.reservations.map(reservation => reservation.parkingId.nom_du_parking));
    this.parkingOptions = Array.from(parkings);
  }

  openEditModal(reservation: ApiReservation): void {
    this.editReservation = { ...reservation }; // Créez une copie pour l'édition
    this.isModalActive = true; // Ouvrir le modal
    console.log("Modal ouvert pour la réservation :", reservation);
  }

  closeIfOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const modalContent = document.querySelector('.invoice-modal-content');
  
    // Vérifier si le clic a eu lieu en dehors du contenu du modal
    if (modalContent && !modalContent.contains(target)) {
        this.closeInvoiceModal();
    }
  }

  // Méthode pour annuler une réservation
cancelReservation(reservation: ApiReservation): void {
  this.http.patch(`http://localhost:3000/api/v1/reservations/${reservation._id}/cancel`, {})
      .subscribe(
          (response) => {
              console.log('Réservation annulée:', response);
              this.loadReservations(); // Rechargez les réservations après annulation
          },
          (error) => {
              console.error('Erreur lors de l\'annulation:', error);
          }
      );
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
  
 
  
  openInvoiceModal(reservation: ApiReservation): void {
    this.selectedReservation = reservation;
    this.showInvoiceModal = true;
  }

  closeInvoiceModal(): void {
    this.showInvoiceModal = false; 
  }

  closeModalIfOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal')) {
      this.closeInvoiceModal(); // Fermer le modal si le clic est à l'extérieur du contenu
    }
  }

  // Autres méthodes pour la gestion des réservations...
}