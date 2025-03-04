import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http'; 
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ParkingReservationComponent } from '../form-reservation/form-reservation.component';

@Component({
  selector: 'app-parking-utilisateur',
  standalone: true,
  imports: [CommonModule, RouterModule, ParkingReservationComponent,HttpClientModule],
  templateUrl: './parking-utilisateur.component.html',
  styleUrls: ['./parking-utilisateur.component.css']
})
export class ParkingUtilisateurComponent implements OnInit {
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
  
  constructor(private router: Router, private http: HttpClient) {}
  
  ngOnInit(): void {
    // Vous pouvez charger des données ici
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
  
}