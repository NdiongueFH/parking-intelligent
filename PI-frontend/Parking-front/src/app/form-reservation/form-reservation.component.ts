import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';


export interface Parking {
    _id: string;
    nom_du_parking: string;
    adresse: string;
}

export interface Place {
    _id?: string;
    parkingId: string;
    nomPlace: string;
    statut: string;
    typeVehicule: string;
}

@Component({
    selector: 'app-form-reservation',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './form-reservation.component.html',
    styleUrls: ['./form-reservation.component.css']
})
export class ParkingReservationComponent implements OnInit {
    @Input() isVisible: boolean = false;
    @Input() selectedSpot!: Place;
    @Input() parkingId!: string; // Ajout de parkingId comme input
    @Input() placeId!: string; // Ajout de l'ID de la place
    @Input() parkingName!: string;
    @Input() parkingAddress!: string;
    @Output() close = new EventEmitter<void>();
    @Output() reservationSuccess = new EventEmitter<string>();


    reservationForm: FormGroup;
    isPaymentProcessed: boolean = false; // État du paiement
    isPaymentInitiated: boolean = false; // Nouvelle propriété pour indiquer si le paiement a été initié


    constructor(private fb: FormBuilder, private http: HttpClient) {
        this.reservationForm = this.fb.group({
            vehicleType: ['voiture', Validators.required],
            plateNumber: ['', Validators.required],
            nomPlace: [{ value: '', disabled: true }],
            placeId: [{ value: '', disabled: true }],
            arrivalDateTime: ['', Validators.required],
            departureDateTime: ['', Validators.required],
            price: [{ value: '', disabled: true }],
            paymentMethod: ['en ligne', Validators.required] // Utiliser 'en ligne'
        });
    }

    ngOnInit() {
        this.getTarif();
        if (this.selectedSpot) {
            this.reservationForm.patchValue({
                nomPlace: this.selectedSpot.nomPlace,
                placeId: this.selectedSpot._id
            });
        }
    }

    getTarif() {
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        this.http.get(`http://localhost:3000/api/v1/tarifs/${this.parkingId}`, { headers })
            .subscribe({
                next: (response: any) => {
                    const tarifs = response.data.tarifs;
                    if (tarifs.length > 0) {
                        const pricePerHour = tarifs[0].tarifDurations.heure;
                        this.reservationForm.patchValue({
                            price: pricePerHour // Mettre à jour le prix par heure
                        });
                    }
                },
                error: (error) => {
                    console.error("Erreur lors de la récupération des tarifs:", error);
                }
            });
    }

    processPayment() {
        this.isPaymentInitiated = true; // Mettre à jour la propriété
        this.isPaymentProcessed = true; // Marquer le paiement comme effectué
        console.log("Paiement en ligne pris en compte:", this.reservationForm.value);
    }

    onSubmit() {
        if (this.reservationForm.valid && this.isPaymentProcessed) {
            const userId = localStorage.getItem('userId');
            console.log("User ID récupéré:", userId);

            const token = localStorage.getItem('token');
            const headers = new HttpHeaders({
                'Authorization': `Bearer ${token}`
            });

            const formData = {
                userId: userId,
                parkingId: this.parkingId, // Utilisation de parkingId passé depuis le parent
            placeId: this.placeId, // Utilisation de l'ID de la place
                typeVehicule: this.reservationForm.value.vehicleType,
                numeroImmatriculation: this.reservationForm.value.plateNumber,
                heureArrivee: new Date(this.reservationForm.value.arrivalDateTime).toISOString(),
                heureDepart: new Date(this.reservationForm.value.departureDateTime).toISOString(),
                paiement: 'en ligne' // Inclure l'attribut de paiement
            };

            console.log("Données envoyées à l'API:", formData); // Log des données envoyées

            this.http.post(`http://localhost:3000/api/v1/reservations`, formData, { headers })
                .subscribe({
                    next: (response: any) => {
                        console.log("Réservation réussie:", response);
                        this.reservationForm.patchValue({
                            price: `${response.data.montant} FCFA` // Mettre à jour avec le montant total
                        });
                        this.closeModal();
                        this.reservationSuccess.emit('Réservation effectuée avec succès !'); // Émet le message

                    },
                    error: (error) => {
                        console.error("Erreur lors de la réservation:", error);
                        console.error("Status de l'erreur:", error.status);
                        console.error("Message de l'erreur:", error.message);
                    }
                });
        } else {
            console.log("Formulaire invalide ou paiement non traité.");
        }
    }

    closeModal() {
        this.close.emit();
    }
}