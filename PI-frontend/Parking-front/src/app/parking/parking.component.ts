import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ParkingReservationComponent } from '../form-reservation/form-reservation.component';

@Component({
  selector: 'app-parking',
  standalone: true,
  imports: [CommonModule, RouterModule, ParkingReservationComponent],
  templateUrl: './parking.component.html',
  styleUrls: ['./parking.component.css']
})
export class ParkingComponent implements OnInit {
  parkingName: string = 'Parking de la Place du souvenir';
  
  // Parking statistics
  parkingStats = {
    totalSpots: 8,
    occupiedSpots: 2,
    freeSpots: 4,
    reservedSpots: 2
  };
  showReservationModal: boolean = false;
  selectedSpot: string | null = null;

  reserveSpot(spotId: string): void {
    this.selectedSpot = spotId; // Enregistrer la place sélectionnée
    this.showReservationModal = true; // Afficher le modal
  }

  closeReservationModal() {
    this.showReservationModal = false; // Fermer le modal
  }
  
  // Parking map data
  parkingMap = [
    [
      { id: 'A1', status: 'free', label: 'Libre' },
      { id: 'A2', status: 'free', label: 'Libre' }
    ],
    [
      { id: 'B1', status: 'reserved', label: 'Reservee' },
      { id: 'B2', status: 'free', label: 'Libre' }
    ],
    [
      { id: 'C1', status: 'occupied', label: '', vehicle: 'car' },
      { id: 'C2', status: 'reserved', label: 'Reservee' }
    ],
    [
      { id: 'D1', status: 'free', label: 'Libre' },
      { id: 'D2', status: 'occupied', label: '', vehicle: 'motorcycle' }
    ]
  ];
  
  constructor() { }
  
  ngOnInit(): void {
    // Vous pouvez charger des données ici
  }
}