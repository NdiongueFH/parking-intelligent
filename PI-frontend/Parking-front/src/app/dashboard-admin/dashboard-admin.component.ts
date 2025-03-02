import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';
import { latLng, tileLayer, marker, icon, Map } from 'leaflet';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LeafletModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class AdminDashboardComponent implements OnInit {
  nearbyParkings = [
    { name: 'Parking de l\'Aéroport LSS', distanceKm: '1.5', lat: 14.739, lng: -17.490 },
    { name: 'Parking de l\'Hôtel Terrou-Bi', distanceKm: '2', lat: 14.715, lng: -17.477 },
    { name: 'Parking de la Place du Souvenir', distanceKm: '3', lat: 14.695, lng: -17.448 },
    { name: 'Parking de l\'Hôtel Pullman', distanceKm: '3.5', lat: 14.705, lng: -17.460 }
  ];

  mapOptions: any = null;
  markers: L.Layer[] = [];
  userPosition: L.LatLng | null = null;
  map: Map | null = null;
  isLoading: boolean = true;

  ngOnInit(): void {
    this.getUserLocation();
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
    this.addMarkers();
  }

  onMapReady(map: Map): void {
    this.map = map;
    console.log('Carte prête');
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
      parking.distanceKm = this.calculateDistance(this.userPosition!.lat, this.userPosition!.lng, parking.lat, parking.lng).toString();
    });
    this.nearbyParkings.sort((a, b) => parseFloat(a.distanceKm) - parseFloat(b.distanceKm));
  }

  addMarkers(): void {
    const userIcon = icon({ iconUrl: 'posi.jpeg', iconSize: [60, 60], iconAnchor: [30, 30], popupAnchor: [0, -32] });
    const parkingIcon = icon({ iconUrl: 'imagelogoParking.png', iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16] });
    if (this.userPosition) this.markers.push(marker([this.userPosition.lat, this.userPosition.lng], { icon: userIcon }).bindPopup('Votre position actuelle'));
    this.updateParkingDistances();
    this.nearbyParkings.forEach(parking => {
      this.markers.push(marker([parking.lat, parking.lng], { icon: parkingIcon }).bindPopup(`<b>${parking.name}</b><br>Distance: ${parking.distanceKm} km<br><button class='popup-reserve-btn'>Réserver</button>`));
    });
  }
}
