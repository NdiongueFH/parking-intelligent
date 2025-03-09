import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';
import { latLng, tileLayer, marker, icon, Map } from 'leaflet';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';

interface Parking {
  _id: string; 
  nom_du_parking: string;
  latitude: number;
  longitude: number;
  distanceKm?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LeafletModule, HttpClientModule],
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

  private apiUrl = 'http://localhost:3000/api/v1/parkings';

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.getUserLocation();
    this.loadNearbyParkings();
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
        this.limitDisplayedParkings();
        this.addMarkers(); // Ajoutez les marqueurs après avoir récupéré les parkings
      },
      (error) => {
        console.error('Erreur lors de la récupération des parkings', error);
      }
    );
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
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        alert('Veuillez activer la géolocalisation.');
        this.isLoading = false;
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

  limitDisplayedParkings(): void {
    this.displayedParkings = this.nearbyParkings.slice(0, 4); // Limite à 4 parkings pour l'affichage
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

reserveParking(parking: Parking): void {
    this.router.navigate(['/parking'], { queryParams: { parkingId: parking._id } });
}
  goToSettings(): void {
    this.router.navigate(['/modifier-utilisateur']);
  }

  searchParking(): void {
    const parkingFound = this.nearbyParkings.find(parking =>
        parking.nom_du_parking.toLowerCase().includes(this.searchQuery.toLowerCase())
    );

    if (parkingFound) {
        if (this.map) { // Vérification si this.map est initialisé
            this.map.setView(latLng(parkingFound.latitude, parkingFound.longitude), 15);
            this.addRouteToParking(parkingFound);
        } else {
            console.error("La carte n'est pas encore initialisée.");
        }
    } else {
        alert('Parking non trouvé');
    }
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

    this.http.get<any>(url).subscribe(response => {
        if (response.routes.length > 0) {
            const route = response.routes[0];
            const latLngs = route.geometry.coordinates.map((coord: number[]) => latLng(coord[1], coord[0]));

            const polyline = L.polyline(latLngs, { color: 'blue' }).addTo(this.map!); // Ajout du "!" pour indiquer à TypeScript que this.map n'est plus null
            this.map!.fitBounds(polyline.getBounds());
        } else {
            console.error('Aucune route trouvée.');
        }
    }, error => {
        console.error("Erreur lors de la récupération de l'itinéraire", error);
    });
}

}
