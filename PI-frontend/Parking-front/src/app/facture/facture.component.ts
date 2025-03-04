import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ReservationData {
  emissionDate: string;
  parkingName: string;
  reservationCode: string;
  status: string;
  receiptNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  licensePlate: string;
  parkingPlace: string;
  startTime: string;
  endTime: string;
  duration: string;
  hourlyRate: number;
  totalAmount: number;
  currency: string;
}

@Component({
  selector: 'app-facture',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './facture.component.html',
  styleUrls: ['./facture.component.css']
})
export class FactureComponent {
  reservationData: ReservationData = {
    emissionDate: '20 Fevrier 2025',
    parkingName: 'Parking de la Place du Souvenir',
    reservationCode: '24681',
    status: 'En attente',
    receiptNumber: 'N-0003',
    clientName: 'Mamadou Dia',
    clientEmail: 'mamadou@gmail.com',
    clientPhone: '775323872',
    licensePlate: 'AA-672-AZ',
    parkingPlace: 'Place A1',
    startTime: '10h15',
    endTime: '11h15',
    duration: '1 heure',
    hourlyRate: 100,
    totalAmount: 100,
    currency: 'FCFA'
  };
}