import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';
import { latLng, tileLayer, marker, icon, Map } from 'leaflet';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';


interface Parking {
  _id: string; 
  nom_du_parking: string;
  latitude: number;
  longitude: number;
  distanceKm?: string;
}

interface UserData {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  solde: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LeafletModule, HttpClientModule,FormsModule,ReactiveFormsModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class AdminDashboardComponent implements OnInit {
  nearbyParkings: Parking[] = [];
  displayedParkings: Parking[] = [];
  mapOptions: any = null;
  markers: L.Layer[] = [];
  userPosition: L.LatLng | null = null;
  map: Map | null = null;
  isLoading: boolean = true;
  searchQuery: string = ''; 

  currentPage: number = 1; // Page actuelle
  itemsPerPage: number = 4; // Nombre d'éléments par page
  totalPages: number = 0; // Total de pages
  pageNumbers: number[] = []; // Numéros de pages

  mapError: boolean = false; // Nouvelle propriété pour gérer l'erreur de chargement de la carte
  geoError: boolean = false; // Nouvelle propriété pour gérer l'erreur de géolocalisation

// Nouvelles propriétés pour le modal des paramètres
showSettingsModal: boolean = false;
userData: UserData = {
  _id: '',
  nom: '',
  prenom: '',
  email: '',
  solde: 0
};

  private apiUrl = 'http://localhost:3000/api/v1/parkings';
  private userApiUrl = 'http://localhost:3000/api/v1/users';


  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.initMap(); // Initialiser la carte avec des coordonnées par défaut
    this.getUserLocation(); // Démarrer la récupération de la position
    this.loadNearbyParkings(); // Charger les parkings à proximité
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
    this.router.navigate(['/change-password']);
    this.showSettingsModal = false;
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

  
  loadNearbyParkings(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<Parking[]>(this.apiUrl, { headers }).subscribe(
      (data) => {
        this.nearbyParkings = data;
        this.updateParkingDistances();
        this.calculateTotalPages();
        this.limitDisplayedParkings();
        this.addMarkers();
      },
      (error) => {
        console.error('Erreur lors de la récupération des parkings', error);
        this.handleMapError(); // Gérer l'erreur ici

      }
    );
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.nearbyParkings.length / this.itemsPerPage);
    this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  limitDisplayedParkings(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.displayedParkings = this.nearbyParkings.slice(start, end); // Limite les parkings affichés
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.limitDisplayedParkings();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.limitDisplayedParkings();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.limitDisplayedParkings();
  }
  getUserLocation(): void {
    const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
    this.isLoading = true;

    navigator.geolocation.watchPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        this.userPosition = latLng(userLat, userLng);
        this.updateUserMarker();
        this.updateParkingDistances();
        if (!this.map) this.initMap();
        else this.map.setView(this.userPosition, this.map.getZoom(), { animate: true });
        this.isLoading = false;
        this.geoError = false; // Réinitialiser l'erreur si la géolocalisation réussit

      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        alert('Veuillez activer la géolocalisation.');
        this.isLoading = false;
        this.geoError = true; // Définir l'erreur de géolocalisation

      },
      options
    );
  }

  initMap(): void {
    if (!this.userPosition) return;
    this.mapOptions = {
      layers: [tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' })],
      zoom: 15,
      center: this.userPosition,
      zoomControl: true
    };
  }

  onMapReady(map: Map): void {
    this.map = map;
    console.log('Carte prête');
    this.addMarkers(); // Ajoutez les marqueurs lorsque la carte est prête
  }

  handleMapError() {
    this.mapError = true;
    this.isLoading = false;
  }

  updateUserMarker(): void {
    if (!this.userPosition) return;
    this.markers = this.markers.filter(m => !(m instanceof L.Marker && m.getPopup()?.getContent() === 'Votre position actuelle'));
    const userIcon = icon({ iconUrl: 'posi.png', iconSize: [60, 60], iconAnchor: [30, 30], popupAnchor: [0, -32] });
    this.markers.push(marker([this.userPosition.lat, this.userPosition.lng], { icon: userIcon }).bindPopup('Votre position actuelle'));
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  updateParkingDistances(): void {
    if (!this.userPosition) return;
    this.nearbyParkings.forEach(parking => {
      parking.distanceKm = this.calculateDistance(this.userPosition!.lat, this.userPosition!.lng, parking.latitude, parking.longitude).toString();
    });
    this.nearbyParkings.sort((a, b) => parseFloat(a.distanceKm!) - parseFloat(b.distanceKm!));
  }

  

 

  addMarkers(): void {
    const userIcon = icon({ iconUrl: 'posi.jpeg', iconSize: [60, 60], iconAnchor: [30, 30], popupAnchor: [0, -32] });
    const parkingIcon = icon({ iconUrl: 'imagelogoParking.png', iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16] });

    // Ajoutez le marqueur de l'utilisateur s'il n'est pas déjà présent
    if (this.userPosition && !this.markers.some(m => m.getPopup()?.getContent() === 'Votre position actuelle')) {
      this.markers.push(marker([this.userPosition.lat, this.userPosition.lng], { icon: userIcon }).bindPopup('Votre position actuelle'));
    }

    // Ajoutez les marqueurs pour chaque parking
    this.nearbyParkings.forEach(parking => {
      if (parking.latitude !== undefined && parking.longitude !== undefined) {
        const parkingMarker = marker([parking.latitude, parking.longitude], { icon: parkingIcon }).bindPopup(`
          <b>${parking.nom_du_parking}</b><br>
          Distance: ${parking.distanceKm} km<br>
        `);
        this.markers.push(parkingMarker);
      }
    });
  }

  reserveParkingById(parkingId: string): void {
    const parking = this.nearbyParkings.find(p => p._id === parkingId);
    if (parking) {
        this.reserveParking(parking);
    }
}

reserveParking(parking: Parking): void {
    this.router.navigate(['/parking'], { queryParams: { parkingId: parking._id } });
}
  goToSettings(): void {
    this.router.navigate(['/modifier-utilisateur']);
  }

  searchParking(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Vérifiez si le champ de recherche est vide
    if (!this.searchQuery.trim()) {
        this.displayedParkings = [...this.nearbyParkings]; // Réinitialiser avec tous les parkings
        this.updateParkingDistances(); // Mettre à jour les distances si nécessaire
        this.addMarkers(); // Ajouter les marqueurs pour tous les parkings
        return; // Sortir de la méthode si le champ est vide
    }

    // Appel à l'API pour rechercher un parking par nom
    this.http.get<Parking[]>(`http://localhost:3000/api/v1/parkings/nom/${this.searchQuery}`, { headers })
        .subscribe(
            (data) => {
                if (data.length > 0) {
                    this.displayedParkings = data; // Afficher les parkings trouvés
                    const parkingFound = data[0]; // Supposons que le premier soit celui que nous voulons
                    if (this.map) { // Vérifiez si this.map n'est pas null
                        this.map.setView(latLng(parkingFound.latitude, parkingFound.longitude), 15);
                        this.addRouteToParking(parkingFound); // Tracer l'itinéraire
                    } else {
                        console.error("La carte n'est pas initialisée.");
                    }
                } else {
                    alert('Aucun parking trouvé avec ce nom.');
                    this.displayedParkings = []; // Réinitialiser l'affichage
                }
            },
            (error) => {
                console.error("Erreur lors de la recherche du parking", error);
                alert('Erreur lors de la recherche du parking.');
            }
        );
}

addRouteToParking(parking: Parking): void {
  if (!this.userPosition) {
      console.error("La position de l'utilisateur n'est pas disponible.");
      return;
  }

  if (!this.map) {
      console.error("La carte n'est pas initialisée.");
      return; // Empêcher l'exécution si la carte n'est pas encore prête
  }

  const start = `${this.userPosition.lng},${this.userPosition.lat}`;
  const end = `${parking.longitude},${parking.latitude}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=false`;

  console.log(`URL de l'itinéraire: ${url}`); // Log de l'URL de l'API

  this.http.get<any>(url).subscribe(response => {
      if (response.routes && response.routes.length > 0) {
          const route = response.routes[0];
          const latLngs = route.geometry.coordinates.map((coord: number[]) => latLng(coord[1], coord[0]));

          const polyline = L.polyline(latLngs, { color: 'red' }).addTo(this.map!);
          this.map!.fitBounds(polyline.getBounds());
      } else {
          console.error('Aucune route trouvée.');
          alert('Aucune route trouvée.');
      }
  }, error => {
      console.error("Erreur lors de la récupération de l'itinéraire", error);
      alert('Erreur lors de la récupération de l\'itinéraire');
  });
}

}
