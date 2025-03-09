import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { ParkingReservationComponent } from '../form-reservation/form-reservation.component';

@Component({
  selector: 'app-parking',
  standalone: true,
  imports: [CommonModule, RouterModule, ParkingReservationComponent, HttpClientModule],
  templateUrl: './parking.component.html',
  styleUrls: ['./parking.component.css']
})
export class ParkingComponent implements OnInit {
  parkingId: string | null = null; // ID du parking récupéré des paramètres
  parkingName: string = ''; // Nom du parking à afficher

  // Statistiques de parking
  parkingStats = {
    totalSpots: 0,
    occupiedSpots: 0,
    freeSpots: 0,
    reservedSpots: 0
  };

  showReservationModal: boolean = false;
  selectedSpot: string | null = null;
  parkingPlaces: any[] = []; // Pour stocker les places de parking

  pageNumbers: number[] = []; // Pour stocker les numéros de pages


  constructor(private router: Router, private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
        this.parkingId = params['parkingId'];
        if (this.parkingId) {
            this.loadParkingDetails();
            this.loadParkingPlaces();
        }
    });
    this.updatePageNumbers(); // Initialiser les numéros de page
}
updatePageNumbers(): void {
  this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1); // Crée un tableau de numéros de page
}

previousPage(): void {
  if (this.currentPage > 1) {
      this.changePage(this.currentPage - 1);
  }
}

nextPage(): void {
  if (this.currentPage < this.totalPages) {
      this.changePage(this.currentPage + 1);
  }
}

goToPage(page: number): void {
  this.changePage(page);
}


  loadParkingDetails(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Récupérer les détails du parking, y compris le nom
    this.http.get<any>(`http://localhost:3000/api/v1/parkings/${this.parkingId}`, { headers }).subscribe(
      (data) => {
        console.log('Détails du parking récupérés:', data); // Log des détails du parking
        this.parkingName = data.nom_du_parking; // Mettez à jour le nom du parking
      },
      (error) => {
        console.error('Erreur lors de la récupération des détails du parking:', error);
        alert('Erreur lors de la récupération des détails du parking. Vérifiez la console pour plus d\'informations.');
      }
    );
  }

  loadParkingPlaces(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>(`http://localhost:3000/api/v1/place-parking/parking/${this.parkingId}`, { headers }).subscribe(
        (data) => {
            this.parkingPlaces = data; // Stocker les données récupérées
            this.totalPlaces = data.length; // Met à jour le total
            this.updateParkingStats(); // Mettre à jour les statistiques
            this.updatePageNumbers(); // Met à jour les numéros de page ici
        },
        (error) => {
            console.error('Erreur lors de la récupération des places de parking:', error);
            alert('Erreur lors de la récupération des places de parking. Vérifiez la console pour plus d\'informations.');
        }
    );
}

changePage(page: number): void {
  this.currentPage = page;
}

  updateParkingStats(): void {
    this.parkingStats.totalSpots = this.parkingPlaces.length;
    this.parkingStats.occupiedSpots = this.parkingPlaces.filter(place => place.statut === 'occupee').length;
    this.parkingStats.freeSpots = this.parkingPlaces.filter(place => place.statut === 'libre').length;
    this.parkingStats.reservedSpots = this.parkingPlaces.filter(place => place.statut === 'reservee').length;
  }

  reserveSpot(spotId: string): void {
    this.selectedSpot = spotId; // Enregistrer la place sélectionnée
    this.showReservationModal = true; // Afficher le modal
  }

  closeReservationModal() {
    this.showReservationModal = false; // Fermer le modal
  }

  getColumns(places: any[]): any[][] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const paginatedPlaces = places.slice(startIndex, startIndex + this.itemsPerPage);
    const columns = [];
    for (let i = 0; i < paginatedPlaces.length; i += 4) {
        columns.push(paginatedPlaces.slice(i, i + 4));
    }
    return columns;
}

currentPage: number = 1; // Page actuelle
itemsPerPage: number = 12; // Nombre total d'items par page (3 colonnes de 4 places)
totalPlaces: number = 0; // Total des places de parking

get totalPages(): number {
    return Math.ceil(this.totalPlaces / this.itemsPerPage);
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
        alert('Erreur lors de la déconnexion. Vérifiez la console pour plus d\'informations.');
      }
    );
  }
}