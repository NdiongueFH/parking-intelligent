import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-reservation',
  templateUrl: './form-reservation.component.html',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  styleUrls: ['./form-reservation.component.css']
})
export class ParkingReservationComponent {
  @Input() isVisible: boolean = false; // Pour contrôler la visibilité du modal
  @Output() close = new EventEmitter<void>(); // Émettre l'événement de fermeture
  reservationForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.reservationForm = this.fb.group({
      vehicleType: ['Vehicule', Validators.required],
      plateNumber: ['', Validators.required],
      arrivalDate: ['', Validators.required],
      arrivalTime: ['', Validators.required],
      departureTime: ['', Validators.required],
      price: [{ value: '500FCFA', disabled: true }],
      paymentMethod: ['onsite', Validators.required]
    });
  }

  onSubmit() {
    if (this.reservationForm.valid) {
      console.log("Reservation details:", this.reservationForm.value);
      // Implémentez ici la logique pour soumettre la réservation (appel à l'API)
    }
  }

  closeModal() {
    this.close.emit(); // Émettre l'événement de fermeture
  }
}