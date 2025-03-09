import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';
import { latLng, tileLayer, Map, MapOptions } from 'leaflet';

export interface Parking {
  _id: string; // Assurez-vous d'avoir un champ ID
  nom_du_parking: string;
  adresse: string;
  latitude: number;
  longitude: number;
  capaciteTotale: number;
  placesLibres?: number;
  placesReservees?: number;
}

export interface Place {
  name: string;
  status: string;
  vehicleType: string;
}

@Component({
  selector: 'app-liste-parking',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule, LeafletModule],
  templateUrl: './liste-parking.component.html',
  styleUrls: ['./liste-parking.component.css']
})
export class ListeParkingComponent implements OnInit {
  parkings: Parking[] = [];
  paginatedParkings: Parking[] = [];
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 0;
  totalParkings = 0;
  pageNumbers: number[] = [];
  searchTerm: string = '';
  selectedVehicleType: string = 'Voiture';
  markers: L.Layer[] = [];
  successMessage: string = '';
  showSuccessModal: boolean = false;



  showDeleteModal: boolean = false;
selectedParking: Parking | null = null; // Pour stocker le parking à supprimer

showSuccessMessage: boolean = false;

  showMapModal: boolean = false;
  selectedLocation: { lat: number; lng: number } | null = null;
  map: Map | null = null;

  isEditing: boolean = false;
  modifiedTariffs = {
    heure: 100,
    jour: 1000,
    semaine: 6000,
    mois: 20000
  };

  newPlace: Place = {
    name: '',
    status: 'Libre',
    vehicleType: 'Voiture'
  };

  showAddForm: boolean = false;
  newParking: Parking = {
    _id: '', // Ajoutez le champ ID
    nom_du_parking: '',
    adresse: '',
    latitude: 0,
    longitude: 0,
    capaciteTotale: 0
  };

  selectedTab: string = 'details';
  messageType: string = '';

  private apiUrl = 'http://localhost:3000/api/v1/parkings';

  mapOptions: MapOptions = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
        attribution: '© OpenStreetMap contributors' 
      })
    ],
    zoom: 15,
    center: latLng(14.6937, -17.4441)
  };

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadParkings();
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

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  resetForm() {
    this.newParking = {
      _id: '',
      nom_du_parking: '',
      adresse: '',
      latitude: 0,
      longitude: 0,
      capaciteTotale: 0
    };
  }

  selectMapLocation() {
    this.showMapModal = true;
  }

  saveParking() {
    if (!this.newParking.nom_du_parking || !this.newParking.adresse || !this.newParking.capaciteTotale) {
      this.messageType = 'error';
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post<Parking>(this.apiUrl, this.newParking, { headers }).subscribe(
      (response) => {
        console.log('Parking ajouté avec succès:', response);
        this.loadParkings();
        this.toggleAddForm();
        this.successMessage = 'Parking créé avec succès !';
        this.showSuccessModal = true;

        setTimeout(() => {
          this.showSuccessModal = false;
          this.successMessage = '';
        }, 2000);
      },
      (error) => {
        console.error('Erreur lors de l\'ajout du parking:', error);
      }
    );
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
  }

  loadParkings(): void {
    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(this.apiUrl, { params, headers }).subscribe(
      (data) => {
        console.log('Données récupérées:', data);
        this.parkings = data;
        this.totalParkings = this.parkings.length;
        this.totalPages = Math.ceil(this.totalParkings / this.itemsPerPage);
        this.generatePagination();
        this.updatePaginatedItems();
      },
      (error) => {
        console.error('Erreur lors de la récupération des parkings', error);
      }
    );
  }

  generatePagination() {
    this.pageNumbers = [];
    for (let i = 1; i <= this.totalPages; i++) {
      this.pageNumbers.push(i);
    }
  }

  updatePaginatedItems() {
    const filteredParkings = this.parkings.filter(parking =>
      parking.nom_du_parking.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    this.totalParkings = filteredParkings.length;
    this.totalPages = Math.ceil(this.totalParkings / this.itemsPerPage);
    this.generatePagination();

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedParkings = filteredParkings.slice(start, end);
  }

  filterParkings() {
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

  toggleParkingDetails(parking: Parking) {
    if (this.selectedParking === parking) {
      this.selectedParking = null;
      this.selectedTab = 'details';
    } else {
      this.selectedParking = parking;
      this.selectedTab = 'details';
    }
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  modifyTariffs() {
    this.isEditing = !this.isEditing;
  }

  saveTariffs() {
    console.log('Nouveaux tarifs sauvegardés:', this.modifiedTariffs);
    this.isEditing = false;
  }

  addPlace() {
    console.log('Nouvelle place ajoutée:', this.newPlace);
    this.newPlace = { name: '', status: 'Libre', vehicleType: 'Voiture' };
  }

  saveSelectedLocation() {
    if (this.selectedLocation) {
      this.newParking.latitude = this.selectedLocation.lat;
      this.newParking.longitude = this.selectedLocation.lng;

      this.getAddressFromCoordinates(this.selectedLocation.lat, this.selectedLocation.lng).then(address => {
        this.newParking.adresse = address;
        this.messageType = 'success';
        this.closeMapModal();
      }).catch(error => {
        console.error('Erreur lors de la récupération de l\'adresse:', error);
        this.messageType = 'error';
      });
    } else {
      this.messageType = 'error';
    }
  }

  closeMapModal() {
    this.showMapModal = false;
  }

  onMapReady(map: Map): void {
    this.map = map;
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.selectedLocation = { lat: event.latlng.lat, lng: event.latlng.lng };

      if (this.map) {
        const newMarker = L.marker([event.latlng.lat, event.latlng.lng]);
        newMarker.addTo(this.map);
      }
    });
  }

  getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      this.http.get<any>(url).subscribe(
        (response) => {
          if (response && response.display_name) {
            resolve(response.display_name);
          } else {
            reject('Adresse non trouvée');
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  deleteParking(parking: Parking) {
    const parkingId = parking._id; // Assurez-vous d'utiliser le bon champ ID
    console.log('ID du parking à supprimer:', parkingId); // Log de l'ID
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    this.http.delete(`${this.apiUrl}/${parkingId}`, { headers }).subscribe(
      response => {
        console.log('Parking supprimé avec succès:', response);
        this.loadParkings(); // Recharger la liste après suppression
      },
      error => {
        console.error('Erreur lors de la suppression du parking:', error);
      }
    );
  }

  openDeleteModal(parking: Parking) {
    this.selectedParking = parking; // Stockez le parking sélectionné
    this.showDeleteModal = true; // Affichez le modal
}

closeDeleteModal() {
    this.showDeleteModal = false; // Cachez le modal
    this.selectedParking = null; // Réinitialisez le parking sélectionné
}

confirmDelete() {
  if (this.selectedParking) {
    this.deleteParking(this.selectedParking); // Appel de la méthode pour supprimer le parking

    // Afficher le message de succès
    this.successMessage = 'Parking supprimé avec succès!';
    this.showSuccessMessage = true;

    // Fermer le modal
    this.closeDeleteModal();

    // Réinitialiser le message après quelques secondes
    setTimeout(() => {
      this.showSuccessMessage = false;
      this.successMessage = '';
    }, 3000);
  }
}

}