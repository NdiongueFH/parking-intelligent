// parking-reservation.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-parking-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-reservation.component.html',
  styleUrls: ['./form-reservation.component.css']
})
export class ParkingReservationComponent implements OnInit {
  reservationForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.calculatePrice();

    // Subscribe to form value changes to recalculate price
    this.reservationForm.get('arrivalTime')?.valueChanges.subscribe(() => {
      this.calculatePrice();
    });
    this.reservationForm.get('departureTime')?.valueChanges.subscribe(() => {
      this.calculatePrice();
    });
  }

  initForm(): void {
    this.reservationForm = this.fb.group({
      vehicleType: ['Vehicule', Validators.required],
      plateNumber: ['AA-674-AZ', [Validators.required, Validators.pattern(/^[A-Z]{2}-\d{3}-[A-Z]{2}$/)]],
      arrivalDate: ['12/01/2025', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]],
      arrivalTime: ['10h15', [Validators.required, Validators.pattern(/^\d{1,2}h\d{2}$/)]],
      departureTime: ['11h15', [Validators.required, Validators.pattern(/^\d{1,2}h\d{2}$/)]],
      price: ['100FCFA', Validators.required],
      paymentMethod: ['onsite', Validators.required]
    });
  }

  calculatePrice(): void {
    const arrivalTimeStr = this.reservationForm.get('arrivalTime')?.value;
    const departureTimeStr = this.reservationForm.get('departureTime')?.value;

    if (!arrivalTimeStr || !departureTimeStr) {
      return;
    }

    // Parse time values (assuming format is "10h15")
    const getMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split('h').map(part => parseInt(part, 10));
      return hours * 60 + minutes;
    };

    const arrivalMinutes = getMinutes(arrivalTimeStr);
    const departureMinutes = getMinutes(departureTimeStr);

    // Calculate duration in hours (rounded up to nearest hour)
    let durationHours = Math.ceil((departureMinutes - arrivalMinutes) / 60);
    if (durationHours <= 0) {
      durationHours = 1; // Minimum 1 hour
    }

    // Calculate price (500 FCFA per hour)
    const price = durationHours * 500;
    this.reservationForm.patchValue({
      price: `${price}FCFA`
    }, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.reservationForm.valid) {
      console.log('Form submitted:', this.reservationForm.value);
      // Here you would typically send the form data to a service
      alert('Réservation confirmée !');
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.reservationForm.controls).forEach(key => {
        this.reservationForm.get(key)?.markAsTouched();
      });
    }
  }
}