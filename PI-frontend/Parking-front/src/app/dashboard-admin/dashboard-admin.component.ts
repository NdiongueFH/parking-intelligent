import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';
import { latLng, tileLayer, marker, icon, Map } from 'leaflet';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { io, Socket } from 'socket.io-client';


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

  totalUsers: number = 0;
totalAdmins: number = 0;
totalParkings: number = 0;

  showFireAlert: boolean = false;
fireAlertMessage: string = '';
fireAlertAudio: HTMLAudioElement | null = null;

// Propriété pour stocker l'itinéraire actuel
currentRoute: L.Polyline | null = null;

// Propriété pour stocker l'ID du parking sélectionné
selectedParkingId: string | null = null;






// Nouvelles propriétés pour le modal des paramètres
showSettingsModal: boolean = false;
userData: UserData = {
  _id: '',
  nom: '',
  prenom: '',
  email: '',
  solde: 0
};

  private apiUrl = 'https://parking-intelligent.onrender.com/api/v1/parkings';
  private userApiUrl = 'https://parking-intelligent.onrender.com/api/v1/users';
  private socket: Socket; // Instance de Socket.io



  constructor(private router: Router, private http: HttpClient) {
    // Crée une instance Socket.io
    this.socket = io('https://parking-intelligent.onrender.com');
  }

  ngOnInit(): void {
    this.initMap(); // Initialiser la carte avec des coordonnées par défaut
    this.getUserLocation(); // Démarrer la récupération de la position
    this.loadUserData(); // Charger les données de l'utilisateur
    this.loadStatistics(); // Charger les statistiques



     // Précharger le son d'alarme pour une réponse plus rapide
  const preloadAlarm = new Audio();
  preloadAlarm.src = 'assets/sounds/fire-alarm.mp3';
  preloadAlarm.load();
  
  // Écouter les alertes de flamme
  this.socket.on('flameAlert', (message: string) => {
    this.showAlert(message);
  });
  
}

// Nouvelle méthode pour charger les statistiques
loadStatistics(): void {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  // Charger le total des utilisateurs
  this.http.get<{ totalUsers: number }>(`${this.userApiUrl}/total-users`, { headers }).subscribe(
      response => {
          this.totalUsers = response.totalUsers;
      },
      error => {
          console.error('Erreur lors de la récupération du total des utilisateurs', error);
      }
  );

  // Charger le total des administrateurs
  this.http.get<{ totalAdmins: number }>(`${this.userApiUrl}/total-admins`, { headers }).subscribe(
      response => {
          this.totalAdmins = response.totalAdmins;
      },
      error => {
          console.error('Erreur lors de la récupération du total des administrateurs', error);
      }
  );

  // Charger le total des parkings
  this.http.get<{ totalParkings: number }>(`${this.apiUrl}/total`, { headers }).subscribe(
      response => {
          this.totalParkings = response.totalParkings;
      },
      error => {
          console.error('Erreur lors de la récupération du total des parkings', error);
      }
  );
}

// Remplacez votre méthode showAlert par celle-ci
showAlert(message: string): void {
  this.fireAlertMessage = message;
  this.showFireAlert = true;
  
  // Créer et jouer un son d'alarme
  this.fireAlertAudio = new Audio();
  this.fireAlertAudio.src = 'https://www.soundjay.com/button/beep-07.wav'; // Lien direct vers un son d’alarme
  this.fireAlertAudio.loop = true;
  this.fireAlertAudio.play().catch(e => console.warn('Impossible de jouer le son d\'alarme:', e));
  
  // Vibrer si disponible sur l'appareil
  if (navigator.vibrate) {
    // Vibrer selon un motif: vibrer 500ms, pause 200ms, vibrer 500ms
    navigator.vibrate([500, 200, 500]);
  }
  
  // Ajouter une classe au body pour empêcher le défilement
  document.body.classList.add('modal-open');
}

// Méthode pour fermer l'alerte
closeFireAlert(): void {
  this.showFireAlert = false;
  
  // Arrêter le son
  if (this.fireAlertAudio) {
    this.fireAlertAudio.pause();
    this.fireAlertAudio.currentTime = 0;
    this.fireAlertAudio = null;
  }
  
  // Arrêter la vibration
  if (navigator.vibrate) {
    navigator.vibrate(0); // Arrêter la vibration
  }
  
  // Enlever la classe du body
  document.body.classList.remove('modal-open');
}

// Méthode pour confirmer la réception de l'alerte
acknowledgeFireAlert(): void {
  // Vous pouvez ajouter une logique ici pour envoyer une confirmation au serveur
  this.socket.emit('acknowledgeFlameAlert', {
    userId: this.userData._id,
    timestamp: new Date().toISOString()
  });
  
  // Fermer l'alerte
  this.closeFireAlert();
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
    this.router.navigate(['/mon-compte']);
    this.showSettingsModal = false;
  }
  
 

  


  logout(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post('https://parking-intelligent.onrender.com/api/v1/auth/logout', {}, { headers }).subscribe(
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
  
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        this.userPosition = latLng(userLat, userLng);
        this.updateUserMarker();
  
        if (!this.map) this.initMap();
        else this.map.setView(this.userPosition, this.map.getZoom(), { animate: true });
  
        this.loadNearbyParkings(); // <-- Appelle ici une fois la position connue
        this.isLoading = false;
        this.geoError = false;
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        this.geoError = true;
        this.isLoading = false;
      },
      options
    );
  }
  

  initMap(): void {
    if (!this.userPosition) return;
    this.mapOptions = {
      layers: [
        tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 18,
          attribution: '&copy; OpenStreetMap &copy; CartoDB contributors'
        })
      ],
      zoom: 13,
      center: latLng(14.6928, -17.4467) // Dakar
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
    const userIcon = icon({ iconUrl: 'emplacement.png', iconSize: [60, 60], iconAnchor: [30, 30], popupAnchor: [0, -32] });
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
    const userIcon = icon({ iconUrl: 'emplacement.png', iconSize: [60, 60], iconAnchor: [30, 30], popupAnchor: [0, -32] });
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

    // Mettre en évidence le parking sélectionné
    this.highlightParking(parking._id);

    if (!this.userPosition) {
        console.error("La position de l'utilisateur n'est pas disponible.");
        alert("Veuillez activer votre géolocalisation pour afficher l'itinéraire.");
        return;
    }

    if (!this.map) {
        console.error("La carte n'est pas initialisée.");
        return;
    }

    // Effacer l'itinéraire précédent s'il existe
    if (this.currentRoute) {
        this.map.removeLayer(this.currentRoute);
        this.currentRoute = null;
    }

    const start = `${this.userPosition.lng},${this.userPosition.lat}`;
    const end = `${parking.longitude},${parking.latitude}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;

    // Afficher un indicateur de chargement
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'route-loading-message';
    loadingMessage.textContent = 'Calcul de l\'itinéraire en cours...';
    document.body.appendChild(loadingMessage);

    this.http.get<any>(url).subscribe(
        response => {
            document.body.removeChild(loadingMessage);
            
            if (response.routes && response.routes.length > 0) {
                const route = response.routes[0];
                const coordinates = route.geometry.coordinates;
                
                // Transformer les coordonnées [lng, lat] en [lat, lng] pour Leaflet
                const latLngs = coordinates.map((coord: number[]) => latLng(coord[1], coord[0]));
                
                // Créer la polyline avec des options de style améliorées
                this.currentRoute = L.polyline(latLngs, {
                    color: '#3388ff',
                    weight: 5,
                    opacity: 0.7,
                    dashArray: '10, 10',
                    lineCap: 'round'
                }).addTo(this.map!);
                
                // Ajuster la vue de la carte pour montrer l'itinéraire complet
                this.map!.fitBounds(this.currentRoute.getBounds(), {
                    padding: [50, 50] // Ajouter un peu d'espace autour de l'itinéraire
                });
                
                // Afficher la distance et le temps estimé
                const distance = (route.distance / 1000).toFixed(1); // km
                const minutes = Math.ceil(route.duration / 60); // minutes
                
                // Créer un popup d'information pour l'itinéraire
                L.popup()
                    .setLatLng(latLngs[Math.floor(latLngs.length / 2)]) // Milieu de l'itinéraire
                    .setContent(`<b>Distance:</b> ${distance} km<br><b>Temps estimé:</b> ${minutes} min`)
                    .openOn(this.map!);
            } else {
                console.error('Aucune route trouvée.');
                alert('Aucun itinéraire disponible pour ce parking.');
            }
        },
        error => {
            document.body.removeChild(loadingMessage);
            console.error("Erreur lors de la récupération de l'itinéraire", error);
            alert('Erreur lors de la récupération de l\'itinéraire. Veuillez réessayer.');
        }
    );
}

// Méthode pour mettre en évidence un parking
highlightParking(parkingId: string): void {
  this.selectedParkingId = parkingId;
  
  // Mettre à jour les marqueurs pour refléter la sélection
  this.markers.forEach(marker => {
      if (marker instanceof L.Marker) {
          const popup = marker.getPopup();
          if (popup) {
              const content = popup.getContent();
              if (typeof content === 'string' && content.includes(parkingId)) {
                  // Changer l'icône du marqueur sélectionné
                  const selectedIcon = icon({ 
                      iconUrl: 'imagelogoParking-highlight.png', // Créez une version mise en évidence de votre icône
                      iconSize: [40, 40],
                      iconAnchor: [20, 20], 
                      popupAnchor: [0, -20] 
                  });
                  marker.setIcon(selectedIcon);
                  marker.openPopup();
              } else if (content !== 'Votre position actuelle') {
                  // Restaurer l'icône par défaut pour les autres parkings
                  const defaultIcon = icon({ 
                      iconUrl: 'imagelogoParking.png', 
                      iconSize: [32, 32], 
                      iconAnchor: [16, 16], 
                      popupAnchor: [0, -16] 
                  });
                  marker.setIcon(defaultIcon);
                  marker.closePopup();
              }
          }
      }
  });
}



searchParking(): void {
  if (this.searchTerm.trim() === '') {
      this.loadNearbyParkings(); // Recharge tous les parkings si le champ est vide
      return;
  }

  const token = localStorage.getItem('token');
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  this.http.get<any>(`${this.apiUrl}/nom/${this.searchTerm}`, { headers }).subscribe(
      (response) => {
          // Vérifiez si la réponse est un tableau ou un objet
          if (Array.isArray(response)) {
              this.nearbyParkings = response;
          } else {
              this.nearbyParkings = [response]; // Convertir en tableau si c'est un objet unique
          }

          this.updateParkingDistances();
          this.calculateTotalPages();
          this.limitDisplayedParkings();
          
          // Si un seul parking est trouvé, afficher automatiquement l'itinéraire
          if (this.nearbyParkings.length === 1) {
              setTimeout(() => {
                  this.addRouteToParking(this.nearbyParkings[0]);
              }, 500); // Petit délai pour s'assurer que la carte est prête
          }
      },
      (error) => {
          console.error('Erreur lors de la recherche de parkings', error);
      }
  );
}


// Ne pas oublier d'ajouter ngOnDestroy pour nettoyer
ngOnDestroy(): void {
  // Assurez-vous de fermer le modal et d'arrêter le son si le composant est détruit
  if (this.showFireAlert) {
    this.closeFireAlert();
  }
  
  // Se désabonner du socket
  this.socket.off('flameAlert');
}
}
