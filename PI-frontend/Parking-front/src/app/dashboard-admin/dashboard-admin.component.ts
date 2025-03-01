import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';
import { latLng, tileLayer, marker, Icon, icon } from 'leaflet';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LeafletModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class AdminDashboardComponent implements OnInit {
  nearbyParkings = [
    { name: 'Parking de l\'Aéroport LSS', distanceKm: '1,5', lat: 14.739, lng: -17.490 },
    { name: 'Parking de l\'Hôtel Terrou-Bi', distanceKm: '2', lat: 14.715, lng: -17.477 },
    { name: 'Parking de la Place du Souvenir', distanceKm: '3', lat: 14.695, lng: -17.448 },
    { name: 'Parking de l\'Hôtel Pullman', distanceKm: '3,5', lat: 14.705, lng: -17.460 }
  ];

  mapOptions: any;
  markers: L.Layer[] = [];
  userPosition: L.LatLng | null = null;

  ngOnInit(): void {
    this.initMap();
  }

  initMap(): void {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        this.userPosition = latLng(userLat, userLng);

        // Configuration de la carte
        this.mapOptions = {
          layers: [
            tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            })
          ],
          zoom: 13,
          center: this.userPosition
        };

        // Ajouter les marqueurs
        this.addMarkers();
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        // Coordonnées par défaut (Dakar)
        this.userPosition = latLng(14.7167, -17.4677);
        
        this.mapOptions = {
          layers: [
            tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            })
          ],
          zoom: 13,
          center: this.userPosition
        };

        this.addMarkers();
      }
    );
  }

  addMarkers(): void {
    // Icône personnalisée pour l'utilisateur
    const userIcon = icon({
      iconUrl: 'assets/user-location.png', // Remplacez par le chemin de votre icône
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    // Icône personnalisée pour les parkings
    const parkingIcon = icon({
      iconUrl: 'assets/parking-icon.png', // Remplacez par le chemin de votre icône
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    // Ajouter le marqueur de position de l'utilisateur
    if (this.userPosition) {
      const userMarker = marker(
        [this.userPosition.lat, this.userPosition.lng], 
        { icon: userIcon }
      ).bindPopup('Votre position actuelle');
      
      this.markers.push(userMarker);
    }

    // Ajouter les marqueurs de parking
    this.nearbyParkings.forEach(parking => {
      const parkingMarker = marker(
        [parking.lat, parking.lng], 
        { icon: parkingIcon }
      ).bindPopup(`<b>${parking.name}</b><br>Distance: ${parking.distanceKm} km<br><button class="popup-reserve-btn">Réserver</button>`);
      
      this.markers.push(parkingMarker);
    });
  }
}