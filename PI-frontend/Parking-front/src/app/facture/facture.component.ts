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
    imports: [CommonModule],
    templateUrl: './facture.component.html',
    styleUrls: ['./facture.component.css']
})
export class FactureComponent {
  reservationData: ReservationData;

  constructor() {
    const data = localStorage.getItem('reservationData');
    if (data) {
      this.reservationData = JSON.parse(data);
    } else {
      this.reservationData = {
        emissionDate: '',
        parkingName: '',
        reservationCode: '',
        status: '',
        receiptNumber: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        licensePlate: '',
        parkingPlace: '',
        startTime: '',
        endTime: '',
        duration: '',
        hourlyRate: 0,
        totalAmount: 0,
        currency: 'FCFA'
      };
    }
  }
}