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
  parkingId: string = ''; // Initialiser parkingId comme une chaîne vide
  placeId: string = ''; // Initialiser parkingId comme une chaîne vide
  parkingName: string = ''; // Nom du parking à afficher
  parkingAddress: string = ''; // Adresse du parking

  // Statistiques de parking
  parkingStats = {
    totalSpots: 0,
    occupiedSpots: 0,
    freeSpots: 0,
    reservedSpots: 0
  };

  showReservationModal: boolean = false;
  selectedSpot: any | null = null; // Type générique pour selectedSpot
  parkingPlaces: any[] = []; // Pour stocker les places de parking

  pageNumbers: number[] = []; // Pour stocker les numéros de pages

  currentPage: number = 1; // Page actuelle
  itemsPerPage: number = 12; // Nombre total d'items par page (3 colonnes de 4 places)
  totalPlaces: number = 0; // Total des places de parking

  successMessage: string = ''; // Variable pour stocker le message de succès
  showSuccessMessage: boolean = false;


 
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

    // Récupérer les détails du parking, y compris le nom et l'adresse
    this.http.get<any>(`http://localhost:3000/api/v1/parkings/${this.parkingId}`, { headers }).subscribe(
      (data) => {
        console.log('Détails du parking récupérés:', data); // Log des détails du parking
        this.parkingName = data.nom_du_parking; // Mettez à jour le nom du parking
        this.parkingAddress = data.adresse; // Mettez à jour l'adresse du parking
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

  reserveSpot(place: any): void {
    this.selectedSpot = {
        ...place, // Inclure les détails de la place
        parkingName: this.parkingName, // Ajouter le nom du parking
        parkingAddress: this.parkingAddress, // Ajouter l'adresse du parking
        placeId: place._id // Ajouter l'ID de la place ici
    };

    // Log des IDs
    console.log("ID du parking:", this.parkingId);
    console.log("ID de la place sélectionnée:", place._id); // Assurez-vous que l'ID de la place est bien accessible

    // Récupérer l'ID de l'utilisateur
    const userId = localStorage.getItem('userId');
    console.log("ID de l'utilisateur récupéré:", userId); // Log de l'ID de l'utilisateur

    // Vérifiez si l'ID de l'utilisateur est null
    if (!userId) {
        console.error("Aucun ID d'utilisateur trouvé. Assurez-vous que l'utilisateur est connecté.");
    }

    // Récupérer le tarif par heure
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(`http://localhost:3000/api/v1/tarifs/${this.parkingId}`, { headers }).subscribe(
        (response: any) => {
            if (response.data && response.data.tarifs.length > 0) {
                const pricePerHour = response.data.tarifs[0].tarifDurations.heure; // Récupérer le tarif par heure
                this.selectedSpot.price = pricePerHour; // Ajouter le tarif à selectedSpot
            }
        },
        (error) => {
            console.error("Erreur lors de la récupération des tarifs:", error);
        }
    );

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

  get totalPages(): number {
    return Math.ceil(this.totalPlaces / this.itemsPerPage);
  }

  onReservationSuccess(message: string): void {
    this.successMessage = message; // Définir le message de succès
    setTimeout(() => {
        this.successMessage = ''; // Réinitialiser le message après 3 secondes
    }, 3000);
}


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
}