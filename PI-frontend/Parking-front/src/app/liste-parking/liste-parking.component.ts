import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';
import { latLng, tileLayer, Map, MapOptions } from 'leaflet';

export interface Parking {
  _id: string;
  nom_du_parking: string;
  adresse: string;
  latitude: number;
  longitude: number;
  capaciteTotale: number;
  placesLibres?: number;
  placesReservees?: number;
}

export interface Place {
  _id?: string;
  parkingId: string;
  nomPlace: string;
  statut: string;
  typeVehicule: string;
 
}

interface UserData {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  solde: number;
}

@Component({
  selector: 'app-liste-parking',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule, LeafletModule],
  templateUrl: './liste-parking.component.html',
  styleUrls: ['./liste-parking.component.css']
})
export class ListeParkingComponent implements OnInit {
  parkings: Parking[] = [];
  paginatedParkings: Parking[] = [];
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 0;
  totalParkings = 0;
  pageNumbers: number[] = [];
  searchTerm: string = '';
  selectedVehicleType: string = 'voiture';
  markers: L.Layer[] = [];
  successMessage: string = '';
  showSuccessModal: boolean = false;
  showDeleteModal: boolean = false;
  selectedParking: Parking | null = null;
  showSuccessMessage: boolean = false;
  showMapModal: boolean = false;
  errorMessage: string = '';
  selectedLocation: { lat: number; lng: number } | null = null;
  map: Map | null = null;
  isEditing: boolean = false;
  modifiedTariffs = {
    heure: 100,
    jour: 1000,
    semaine: 6000,
    mois: 20000
  };

  newPlace: Place = {
    parkingId: '',
    nomPlace: '',
    statut: 'libre',
    typeVehicule: 'voiture'
  };

  showAddForm: boolean = false;
  newParking: Parking = {
    _id: '',
    nom_du_parking: '',
    adresse: '',
    latitude: 0,
    longitude: 0,
    capaciteTotale: 0
  };

  // Nouvelles propriétés pour le modal des paramètres
showSettingsModal: boolean = false;
userData: UserData = {
  _id: '',
  nom: '',
  prenom: '',
  email: '',
  solde: 0
};

private userApiUrl = 'http://localhost:3000/api/v1/users';


  newAmende = {
    duree: '00:00:00', // Format de durée sous forme de chaîne
    montant: 0,
    typeInfraction: '',
    typeVehicule: 'voiture',
    parkingId: '' // Initialiser parkingId comme une chaîne vide
};

resetNewAmende() {
    this.newAmende = {
        duree: '00:00:00', // Réinitialiser à la chaîne vide au format HH:mm:ss
        montant: 0,
        typeInfraction: '',
        typeVehicule: 'voiture',
        parkingId: '' // Réinitialiser parkingId à une chaîne vide
    };
}
  isEditingAmende = false;
selectedAmende: any; // Assurez-vous que cela est initialisé lorsque vous sélectionnez une amende


  selectedTab: string = 'details';
  messageType: string = '';

  private apiUrl = 'http://localhost:3000/api/v1/parkings';

  mapOptions: MapOptions = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
        attribution: '© OpenStreetMap contributors' 
      })
    ],
    zoom: 15,
    center: latLng(14.6937, -17.4441)
  };

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadParkings();
    this.loadUserData(); // Charger les données de l'utilisateur

  }

   // Nouvelle méthode pour charger les données de l'utilisateur
   loadUserData(): void {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId'); // Récupérer l'ID de l'utilisateur à partir du localStorage
  
    if (!token || !userId) {
        this.router.navigate(['/login']);
        return;
    }
  
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    this.http.get<{ status: string; data: { user: UserData } }>(`${this.userApiUrl}/${userId}`, { headers }).subscribe(
        (response) => {
            if (response.status === 'success') {
                this.userData = response.data.user; // Accédez à l'objet utilisateur
            } else {
                console.error('Erreur lors de la récupération des données utilisateur');
            }
        },
        (error) => {
            console.error('Erreur lors de la récupération des données utilisateur', error);
        }
    );
  }
  
    // Méthode pour afficher/masquer le modal des paramètres
    toggleSettingsModal(): void {
      this.showSettingsModal = !this.showSettingsModal;
      
      // Si on ferme le modal en cliquant ailleurs sur la page
      if (this.showSettingsModal) {
        setTimeout(() => {
          document.addEventListener('click', this.closeModalOnClickOutside);
        }, 0);
      } else {
        document.removeEventListener('click', this.closeModalOnClickOutside);
      }
    }
    
    // Fermer le modal en cliquant en dehors
    closeModalOnClickOutside = (event: MouseEvent) => {
      const modal = document.querySelector('.settings-modal');
      const settingsButton = document.querySelector('.settings-button');
      
      if (modal && settingsButton && 
          !modal.contains(event.target as Node) && 
          !settingsButton.contains(event.target as Node)) {
        this.showSettingsModal = false;
        document.removeEventListener('click', this.closeModalOnClickOutside);
      }
    };
    
    // Navigation vers la page de modification du profil
    goToEditProfile(): void {
      this.router.navigate(['/modifier-utilisateur']);
      this.showSettingsModal = false;
    }
    
   // Navigation vers la page de changement de mot de passe
   goToChangePassword(): void {
    this.router.navigate(['/change-password']);
    this.showSettingsModal = false;
  }

    

  logout(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post('http://localhost:3000/api/v1/auth/logout', {}, { headers }).subscribe(
      () => {
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
      },
      (error) => {
        console.error('Erreur lors de la déconnexion', error);
      }
    );
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  resetForm() {
    this.newParking = {
      _id: '',
      nom_du_parking: '',
      adresse: '',
      latitude: 0,
      longitude: 0,
      capaciteTotale: 0
    };
  }

  selectMapLocation() {
    this.showMapModal = true;
  }

  saveParking() {
    // Validation des champs requis
    if (!this.newParking.nom_du_parking || !this.newParking.adresse) {
        this.messageType = 'error';
        return;
    }

    // Si capaciteTotale n'est pas défini, le mettre à 0
    this.newParking.capaciteTotale = this.newParking.capaciteTotale || 0;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post<Parking>(this.apiUrl, this.newParking, { headers }).subscribe(
        (response) => {
            console.log('Parking ajouté avec succès:', response);
            this.loadParkings();
            this.toggleAddForm();
            this.successMessage = 'Parking créé avec succès !';
            this.showSuccessModal = true;

            setTimeout(() => {
                this.showSuccessModal = false;
                this.successMessage = '';
            }, 2000);
        },
        (error) => {
            console.error('Erreur lors de l\'ajout du parking:', error);
        }
    );
}

  closeSuccessModal() {
    this.showSuccessModal = false;
  }

  loadParkings(): void {
    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(this.apiUrl, { params, headers }).subscribe(
      (data) => {
        console.log('Données récupérées:', data);
        this.parkings = data;
        this.totalParkings = this.parkings.length;
        this.totalPages = Math.ceil(this.totalParkings / this.itemsPerPage);
        this.generatePagination();
        this.updatePaginatedItems();
      },
      (error) => {
        console.error('Erreur lors de la récupération des parkings', error);
      }
    );
  }

  generatePagination() {
    this.pageNumbers = [];
    for (let i = 1; i <= this.totalPages; i++) {
      this.pageNumbers.push(i);
    }
  }

  updatePaginatedItems() {
    const filteredParkings = this.parkings.filter(parking =>
      parking.nom_du_parking.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    this.totalParkings = filteredParkings.length;
    this.totalPages = Math.ceil(this.totalParkings / this.itemsPerPage);
    this.generatePagination();

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedParkings = filteredParkings.slice(start, end);
  }

  filterParkings() {
    this.currentPage = 1;
    this.updatePaginatedItems();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedItems();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedItems();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePaginatedItems();
  }

  toggleParkingDetails(parking: Parking) {
    // Vérifie si le parking est déjà sélectionné
    if (this.selectedParking === parking) {
        this.selectedParking = null; // Désélectionner le parking
    } else {
        this.selectedParking = parking; // Sélectionner le parking
    }
    this.selectedTab = 'details'; // Réinitialiser l'onglet sur 'details'
    console.log('Parking sélectionné:', this.selectedParking); // Log pour le débogage
}

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  modifyTariffs() {
    this.isEditing = !this.isEditing;
  }

  addPlace() {
    // Vérifiez si newPlace est correctement rempli
    if (!this.newPlace.nomPlace || !this.newPlace.statut || !this.newPlace.typeVehicule) {
        this.errorMessage = 'Tous les champs doivent être remplis.'; // Message d'erreur
        console.error(this.errorMessage);
        return;
    }

    // Assurez-vous que les valeurs sont en minuscules
    this.newPlace.statut = this.newPlace.statut.toLowerCase();
    this.newPlace.typeVehicule = this.newPlace.typeVehicule.toLowerCase();

    // Vérifiez si newParking est défini
    if (!this.newParking || !this.newParking._id) {
        this.errorMessage = 'Aucun parking sélectionné. Veuillez sélectionner un parking.'; // Message d'erreur
        console.error(this.errorMessage);
        return;
    }

    // Remplir le parkingId
    this.newPlace.parkingId = this.newParking._id;

    console.log('Données de la nouvelle place:', this.newPlace);

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post<Place>('http://localhost:3000/api/v1/place-parking', this.newPlace, { headers }).subscribe(
        (response) => {
            console.log('Place ajoutée avec succès:', response);
            this.loadParkings(); // Recharger les parkings
            this.resetNewPlace(); // Réinitialiser le formulaire
            this.showSuccessMessage = true;
            this.successMessage = 'Place ajoutée avec succès !';
            this.errorMessage = ''; // Réinitialiser le message d'erreur

            setTimeout(() => {
                this.showSuccessMessage = false;
                this.successMessage = '';
            }, 2000);
        },
        (error) => {
            console.error('Erreur lors de l\'ajout de la place:', error);
            this.errorMessage = error.error.message || 'Une erreur s\'est produite lors de l\'ajout de la place.'; // Message d'erreur
        }
    );
}


selectParking(parking: Parking) {
  this.newParking = parking; // Met à jour newParking avec le parking sélectionné
  this.selectedParking = parking; // Met également à jour selectedParking pour d'autres usages
  console.log('Parking sélectionné:', this.newParking); // Log pour vérifier la sélection
}

  resetNewPlace() {
    this.newPlace = {
      parkingId: '',
      nomPlace: '',
      statut: 'libre',
      typeVehicule: 'voiture'
    };
  }

  saveSelectedLocation() {
    if (this.selectedLocation) {
      this.newParking.latitude = this.selectedLocation.lat;
      this.newParking.longitude = this.selectedLocation.lng;

      this.getAddressFromCoordinates(this.selectedLocation.lat, this.selectedLocation.lng).then(address => {
        this.newParking.adresse = address;
        this.messageType = 'success';
        this.closeMapModal();
      }).catch(error => {
        console.error('Erreur lors de la récupération de l\'adresse:', error);
        this.messageType = 'error';
      });
    } else {
      this.messageType = 'error';
    }
  }

  closeMapModal() {
    this.showMapModal = false;
  }

  onMapReady(map: Map): void {
    this.map = map;
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.selectedLocation = { lat: event.latlng.lat, lng: event.latlng.lng };

      if (this.map) {
        const newMarker = L.marker([event.latlng.lat, event.latlng.lng]);
        newMarker.addTo(this.map);
      }
    });
  }

  getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      this.http.get<any>(url).subscribe(
        (response) => {
          if (response && response.display_name) {
            resolve(response.display_name);
          } else {
            reject('Adresse non trouvée');
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  deleteParking(parking: Parking) {
    const parkingId = parking._id;
    console.log('ID du parking à supprimer:', parkingId);
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    this.http.delete(`${this.apiUrl}/${parkingId}`, { headers }).subscribe(
      response => {
        console.log('Parking supprimé avec succès:', response);
        this.loadParkings();
      },
      error => {
        console.error('Erreur lors de la suppression du parking:', error);
      }
    );
  }

  openDeleteModal(parking: Parking) {
    this.selectedParking = parking;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedParking = null;
  }

  confirmDelete() {
    if (this.selectedParking) {
      this.deleteParking(this.selectedParking);
      this.successMessage = 'Parking supprimé avec succès!';
      this.showSuccessMessage = true;

      this.closeDeleteModal();

      setTimeout(() => {
        this.showSuccessMessage = false;
        this.successMessage = '';
      }, 3000);
    }
  }
  saveTariffs() {
    if (!this.selectedParking || !this.selectedParking._id) {
        console.error('Aucun parking sélectionné.');
        return;
    }

    const tarifData = {
        parkingId: this.selectedParking._id,
        typeVehicule: this.selectedVehicleType,
        tarifDurations: this.modifiedTariffs
    };

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post('http://localhost:3000/api/v1/tarifs', tarifData, { headers }).subscribe(
        (response) => {
            console.log('Tarifs enregistrés avec succès:', response);
            this.isEditing = false; // Fermer le mode édition
            this.showSuccessMessage = true;
            this.successMessage = 'Tarifs ajoutés avec succès !';
            this.errorMessage = ''; // Réinitialiser le message d'erreur

            setTimeout(() => {
                this.showSuccessMessage = false;
                this.successMessage = '';
            }, 2000);
        },
        (error) => {
            console.error('Erreur lors de l\'enregistrement des tarifs:', error);
            // Ajoutez ici la gestion du message d'erreur
            this.errorMessage = error.error.message || 'Une erreur s\'est produite lors de l\'enregistrement des tarifs.';
        }
    );
}

saveAmende() {
  // Vérifiez si selectedParking est défini
  if (!this.selectedParking) {
      console.error('Aucun parking sélectionné. Veuillez sélectionner un parking.');
      this.errorMessage = 'Veuillez sélectionner un parking avant d\'ajouter une amende.';
      return;
  }

  const amendeData = {
      duree: this.newAmende.duree,
      montant: this.newAmende.montant,
      typeInfraction: this.newAmende.typeInfraction,
      typeVehicule: this.newAmende.typeVehicule,
      parkingId: this.selectedParking._id // Accéder à _id en toute sécurité
  };

  const token = localStorage.getItem('token');
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  this.http.post('http://localhost:3000/api/v1/amendes', amendeData, { headers }).subscribe(
      (response) => {
          console.log('Amende créée avec succès:', response);
          this.showSuccessMessage = true;
          this.successMessage = 'Amende ajoutée avec succès !';
          this.resetNewAmende(); // Réinitialiser le formulaire
          this.errorMessage = ''; // Réinitialiser le message d'erreur

          setTimeout(() => {
              this.showSuccessMessage = false;
              this.successMessage = '';
          }, 2000);
      },
      (error) => {
          console.error('Erreur lors de l\'ajout de l\'amende:', error);
          // Ajoutez ici la gestion du message d'erreur
          this.errorMessage = error.error.message || 'Une erreur s\'est produite lors de l\'ajout de l\'amende.';
      }
  );
}



}