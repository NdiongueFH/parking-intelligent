import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-parking',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
    // You can load data from a service here
  }
  
  reserveSpot(spotId: string): void {
    // Implementation for reservation logic
    console.log(`Reserving spot ${spotId}`);
    // This would typically call a service to make an API request
  }
}