import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Importez Router
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';
import { latLng, tileLayer, marker, icon, Map, MapOptions } from 'leaflet';

export interface Parking {
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
  selectedVehicleType: string = 'Voiture'; // Valeur par défaut
  markers: L.Layer[] = [];

  showMapModal: boolean = false; // Pour afficher / cacher le modal de la carte
  selectedLocation: { lat: number; lng: number } | null = null; // Pour stocker la localisation sélectionnée
  map: Map | null = null; // Ajoutez cette ligne pour définir la propriété 'map'
  

  isEditing: boolean = false; // État d'édition des tarifs
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

  // Nouvelles propriétés
  showAddForm: boolean = false;
  newParking: Parking = {
    nom_du_parking: '',
    adresse: '',
    latitude: 0,
    longitude: 0,
    capaciteTotale: 0
  };

  selectedParking: Parking | null = null; // Pour stocker le parking sélectionné
  selectedTab: string = 'details'; // Tab par défaut

  private apiUrl = 'http://localhost:3000/api/v1/parkings';
  
  // Déclaration et initialisation de mapOptions
  mapOptions: MapOptions = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
        attribution: '© OpenStreetMap contributors' 
      })
    ],
    zoom: 15,
    center: latLng(14.6937, -17.4441) // Coordonnées par défaut
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
  
  // Méthode pour afficher/cacher le formulaire
  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    // Réinitialiser le formulaire si on le ferme
    if (!this.showAddForm) {
      this.resetForm();
    }
  }
  
  // Méthode pour réinitialiser le formulaire
  resetForm() {
    this.newParking = {
      nom_du_parking: '',
      adresse: '',
      latitude: 0,
      longitude: 0,
      capaciteTotale: 0
    };
  }
  
  // Méthode pour sélectionner un emplacement sur la carte
  selectMapLocation() {
    this.showMapModal = true; // Ouvre le modal de la carte
}
  
  // Méthode pour enregistrer un nouveau parking
  saveParking() {
    if (!this.newParking.nom_du_parking || !this.newParking.adresse || !this.newParking.capaciteTotale) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.post<Parking>(this.apiUrl, this.newParking, { headers }).subscribe(
      (response) => {
        console.log('Parking ajouté avec succès:', response);
        this.loadParkings(); // Recharger la liste
        this.toggleAddForm(); // Fermer le formulaire
        alert('Parking ajouté avec succès!');
      },
      (error) => {
        console.error('Erreur lors de l\'ajout du parking:', error);
        alert('Erreur lors de l\'ajout du parking. Veuillez réessayer.');
      }
    );
  }
  
  // Méthodes existantes inchangées
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
    // Si le parking est déjà sélectionné, on le désélectionne
    if (this.selectedParking === parking) {
      this.selectedParking = null;
      this.selectedTab = 'details'; // Réinitialiser l'onglet
    } else {
      this.selectedParking = parking; // Sélectionner le parking
      this.selectedTab = 'details'; // Afficher les détails par défaut
    }
  }

  selectTab(tab: string) {
    this.selectedTab = tab; // Changer l'onglet sélectionné
  }

  modifyTariffs() {
    this.isEditing = !this.isEditing; // Inverse l'état d'édition
  }

  saveTariffs() {
    console.log('Nouveaux tarifs sauvegardés:', this.modifiedTariffs);
    this.isEditing = false; // Réinitialiser l'état d'édition
  }

  addPlace() {
    console.log('Nouvelle place ajoutée:', this.newPlace);
    this.newPlace = { name: '', status: 'Libre', vehicleType: 'Voiture' }; // Exemple de réinitialisation
  }

  saveSelectedLocation() {
    if (this.selectedLocation) {
      this.newParking.latitude = this.selectedLocation.lat;
      this.newParking.longitude = this.selectedLocation.lng;

      this.getAddressFromCoordinates(this.selectedLocation.lat, this.selectedLocation.lng).then(address => {
        this.newParking.adresse = address; // Stocker l'adresse dans le champ 'adresse'
        alert(`Emplacement sélectionné : ${this.newParking.adresse}`);
        this.closeMapModal(); // Fermer le modal
      }).catch(error => {
        console.error('Erreur lors de la récupération de l\'adresse:', error);
        alert('Erreur lors de la récupération de l\'adresse.');
      });
    } else {
      alert('Veuillez sélectionner un emplacement sur la carte.');
    }
  }

  closeMapModal() {
    this.showMapModal = false; // Fermer le modal
  }

  onMapReady(map: Map): void {
    this.map = map;
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.selectedLocation = { lat: event.latlng.lat, lng: event.latlng.lng };
      
      if (this.map) {
        const newMarker = L.marker([event.latlng.lat, event.latlng.lng]);
        newMarker.addTo(this.map); // Ajoutez le marqueur à la carte
      }
    });
  }

  getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      this.http.get<any>(url).subscribe(
        (response) => {
          if (response && response.display_name) {
            resolve(response.display_name); // Retourne l'adresse
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
}