import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // Importer RouterModule

interface Reservation {
  parkingName: string;
  parkingAddress: string;
  date: string;
  time: string;
  price: string;
  status: string;
}

@Component({
  selector: 'app-historiques-reservations',
  templateUrl: './historiques-reservations.component.html',
  styleUrls: ['./historiques-reservations.component.css'],
  standalone: true,  // Déclare le composant comme standalone
  imports: [RouterModule] // Ajouter RouterModule pour utiliser routerLink
})
export class HistoriquesReservationsComponent {
  reservations: Reservation[] = [
    {
      parkingName: "Parking de l'Hôtel Pullman",
      parkingAddress: "Avenue Saint Lazar",
      date: "21 Fév 2025",
      time: "09:00 - 11:00",
      price: "200 FCFA",
      status: "En cours"
    },
    {
      parkingName: "Parking de l'Hôtel Pullman",
      parkingAddress: "Avenue Saint Lazar",
      date: "23 Fév 2025",
      time: "14:15 - 15:15",
      price: "100 FCFA",
      status: "Annulé"
    }
  ];

  totalReservations: number = this.reservations.length;
  ongoingReservations: number = this.reservations.filter(res => res.status === 'En cours').length;
  completedReservations: number = this.reservations.filter(res => res.status === 'Terminées').length;
  cancelledReservations: number = this.reservations.filter(res => res.status === 'Annulé').length;

  filterStatus: string = 'Tous les statuts';
  filterParking: string = 'Tous les parkings';
  filterDate: string = '';

  // Fonction pour appliquer les filtres
  applyFilters(): void {
    let filteredReservations = this.reservations;

    if (this.filterStatus !== 'Tous les statuts') {
      filteredReservations = filteredReservations.filter(res => res.status === this.filterStatus);
    }

    if (this.filterParking !== 'Tous les parkings') {
      filteredReservations = filteredReservations.filter(res => res.parkingName === this.filterParking);
    }

    if (this.filterDate) {
      filteredReservations = filteredReservations.filter(res => res.date === this.filterDate);
    }

    this.reservations = filteredReservations;
  }

  // Fonction pour gérer la pagination (éventuellement à implémenter)
  goToPage(pageNumber: number): void {
    console.log('Aller à la page', pageNumber);
    // Pagination logique
  }
}
