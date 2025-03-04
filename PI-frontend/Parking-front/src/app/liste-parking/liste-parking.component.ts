import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

export interface Parking {
  nom_du_parking: string;
  adresse: string;
  latitude: number;
  longitude: number;
  capaciteTotale: number;
  placesLibres?: number;
  placesReservees?: number;
}
export interface Place {
  name: string;
  status: string;
  vehicleType: string;
}

@Component({
  selector: 'app-liste-parking',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule],
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
  selectedVehicleType: string = 'Voiture'; // Valeur par défaut


  isEditing: boolean = false; // État d'édition des tarifs
  modifiedTariffs = {
    heure: 100,
    jour: 1000,
    semaine: 6000,
    mois: 20000
  };

  newPlace: Place = {
    name: '',
    status: 'Libre',
    vehicleType: 'Voiture'
  };

  
  // Nouvelles propriétés
  showAddForm: boolean = false;
  newParking: Parking = {
    nom_du_parking: '',
    adresse: '',
    latitude: 0,
    longitude: 0,
    capaciteTotale: 0
  };

  selectedParking: Parking | null = null; // Pour stocker le parking sélectionné
  selectedTab: string = 'details'; // Tab par défaut

  

  
  private apiUrl = 'http://localhost:3000/api/v1/parkings';
  
  constructor(private http: HttpClient) {}
  
  ngOnInit(): void {
    this.loadParkings();
  }
  
  // Méthode pour afficher/cacher le formulaire
  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    // Réinitialiser le formulaire si on le ferme
    if (!this.showAddForm) {
      this.resetForm();
    }
  }
  
  // Méthode pour réinitialiser le formulaire
  resetForm() {
    this.newParking = {
      nom_du_parking: '',
      adresse: '',
      latitude: 0,
      longitude: 0,
      capaciteTotale: 0
    };
  }
  
  // Méthode pour sélectionner un emplacement sur la carte
  selectMapLocation() {
    // Simulez l'action pour l'instant
    alert('Fonctionnalité de sélection sur la carte à implémenter');
    
    // Ici, vous pourriez ouvrir une modale avec une carte
    // pour permettre à l'utilisateur de sélectionner un emplacement
    // et récupérer les coordonnées
    
    // Exemple simulé:
    this.newParking.latitude = 14.6937;
    this.newParking.longitude = -17.4441;
  }
  
  // Méthode pour enregistrer un nouveau parking
  saveParking() {
    if (!this.newParking.nom_du_parking || !this.newParking.adresse || !this.newParking.capaciteTotale) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.post<Parking>(this.apiUrl, this.newParking, { headers }).subscribe(
      (response) => {
        console.log('Parking ajouté avec succès:', response);
        this.loadParkings(); // Recharger la liste
        this.toggleAddForm(); // Fermer le formulaire
        alert('Parking ajouté avec succès!');
      },
      (error) => {
        console.error('Erreur lors de l\'ajout du parking:', error);
        alert('Erreur lors de l\'ajout du parking. Veuillez réessayer.');
      }
    );
  }
  
  // Méthodes existantes inchangées
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
    // Si le parking est déjà sélectionné, on le désélectionne
    if (this.selectedParking === parking) {
      this.selectedParking = null;
      this.selectedTab = 'details'; // Réinitialiser l'onglet
    } else {
      this.selectedParking = parking; // Sélectionner le parking
      this.selectedTab = 'details'; // Afficher les détails par défaut
    }
  }

  selectTab(tab: string) {
    this.selectedTab = tab; // Changer l'onglet sélectionné
  }

  modifyTariffs() {
    this.isEditing = !this.isEditing; // Inverse l'état d'édition
  }

  saveTariffs() {
    // Ici, vous pouvez intégrer l'API pour sauvegarder les nouveaux tarifs
    console.log('Nouveaux tarifs sauvegardés:', this.modifiedTariffs);
    // Réinitialiser l'état d'édition
    this.isEditing = false;
  }

  addPlace() {
    // Logique pour ajouter une nouvelle place
    console.log('Nouvelle place ajoutée:', this.newPlace);
    // Réinitialiser le formulaire si nécessaire
    this.newPlace = { name: '', status: 'Libre', vehicleType: 'Voiture' }; // Exemple de réinitialisation
}
}