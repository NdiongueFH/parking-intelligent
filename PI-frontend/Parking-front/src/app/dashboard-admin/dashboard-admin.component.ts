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
    imports: [CommonModule, RouterModule, LeafletModule, HttpClientModule, FormsModule, ReactiveFormsModule],
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

  currentPage: number = 1; // Page actuelle
  itemsPerPage: number = 4; // Nombre d'éléments par page
  totalPages: number = 0; // Total de pages
  pageNumbers: number[] = []; // Numéros de pages

  mapError: boolean = false; // Nouvelle propriété pour gérer l'erreur de chargement de la carte
  geoError: boolean = false; // Nouvelle propriété pour gérer l'erreur de géolocalisation

  searchTerm: string = '';




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
  
        // Jouer un son de notification
        const notificationSound = new Audio();
        notificationSound.src = 'data:audio/wav;base64,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';
  
        // Jouer le son pendant 3 secondes
        notificationSound.play().catch(e => console.warn('Impossible de jouer le son de notification:', e));
        setTimeout(() => {
          notificationSound.pause(); // Arrêter le son
          notificationSound.currentTime = 0; // Réinitialiser le son
        }, 3000); // 3000 ms = 3 secondes
  
        // Créer et afficher une notification stylisée directement dans le DOM
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="position: fixed; top: 20px; right: 20px; max-width: 400px; 
                      background-color:rgb(250, 143, 139); border-left: 4px solid #ffc107; 
                      box-shadow: 0 4px 8px rgba(0,0,0,0.1); padding: 16px; 
                      z-index: 9999; border-radius: 4px; font-family: sans-serif;">
            <div style="font-weight: bold; margin-bottom: 8px; color: #212529;">
              Localisation requise
            </div>
            <div style="color: #495057; font-size: 14px;">
              Pour utiliser cette fonctionnalité, veuillez autoriser l'accès à votre position dans les paramètres de votre navigateur.
            </div>
          </div>
        `;
        document.body.appendChild(notification);
  
        // Supprimer la notification après 5 secondes
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 5000);
  
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


searchParking(): void {
  if (this.searchTerm.trim() === '') {
    this.loadNearbyParkings(); // Recharge tous les parkings si le champ est vide
    return;
  }

  const token = localStorage.getItem('token');
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  console.log('Terme de recherche:', this.searchTerm);

  this.http.get<any>(`${this.apiUrl}/nom/${this.searchTerm}`, { headers }).subscribe(
    (response) => {
      console.log('Résultats de la recherche:', response);

      // Vérifiez si la réponse est un tableau ou un objet
      if (Array.isArray(response)) {
        this.nearbyParkings = response;
      } else {
        this.nearbyParkings = [response]; // Convertir en tableau si c'est un objet unique
      }

      this.updateParkingDistances();
      this.calculateTotalPages();
      this.limitDisplayedParkings();
    },
    (error) => {
      console.error('Erreur lors de la recherche de parkings', error);
    }
  );
}

}
