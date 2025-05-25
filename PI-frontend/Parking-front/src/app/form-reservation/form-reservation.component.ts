import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';



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
    errorMessage: string | null = null; // Pour stocker les messages d'erreur
    private socket: Socket;



    constructor(private fb: FormBuilder, private http: HttpClient) {
        this.socket = io('http://localhost:3000'); // l’URL de ton backend

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
    
            const token = localStorage.getItem('token');
            const headers = new HttpHeaders({
                'Authorization': `Bearer ${token}`
            });
    
            const formData = {
                userId: userId,
                parkingId: this.parkingId,
                placeId: this.placeId,
                typeVehicule: this.reservationForm.value.vehicleType,
                numeroImmatriculation: this.reservationForm.value.plateNumber,
                heureArrivee: new Date(this.reservationForm.value.arrivalDateTime).toISOString(),
                heureDepart: new Date(this.reservationForm.value.departureDateTime).toISOString(),
                paiement: 'en ligne'
            };
    
            this.http.post(`http://localhost:3000/api/v1/reservations`, formData, { headers })
                .subscribe({
                    next: (response: any) => {
                        this.errorMessage = null; // Réinitialiser le message d'erreur
                        this.reservationForm.patchValue({
                            price: `${response.data.montant} FCFA`
                        });

                        this.socket.emit('majEtatParking', {
                            placeId: this.placeId,
                            statut: 'reservee' // ou le statut exact utilisé côté backend
                        });
                        this.closeModal();
                        
                        this.reservationSuccess.emit('Réservation effectuée avec succès !');
                    },
                    error: (error) => {
                        this.errorMessage = error.error.message; // Afficher le message d'erreur
                        console.error("Erreur lors de la réservation:", error);
                    }
                });
        } else {
            this.errorMessage = "Formulaire invalide ou paiement non traité.";
            console.log(this.errorMessage);
        }
    }
    
    closeModal() {
        this.close.emit();
    }
}