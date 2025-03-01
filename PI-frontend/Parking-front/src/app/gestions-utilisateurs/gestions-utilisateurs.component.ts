import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-gestions-utilisateurs',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule], // Importez HttpClientModule ici
  templateUrl: './gestions-utilisateurs.component.html',
  styleUrls: ['./gestions-utilisateurs.component.css']
})
export class GestionsUtilisateursComponent implements OnInit {
  utilisateurs: any[] = [];
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 0;
  totalUsers = 0; // Nombre total d'utilisateurs
  pageNumbers: number[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  // Fonction pour charger les utilisateurs avec pagination
  loadUsers() {
    // Paramètres pour la pagination
    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    // Faire la requête HTTP avec pagination
    this.http.get<any>(`http://localhost:3000/api/v1/users`, { params }).subscribe(
      (data) => {
        this.utilisateurs = data.data.users; // Assurez-vous de la structure des données retournées
        this.totalUsers = data.data.totalUsers; // Assurez-vous que la réponse API contient totalUsers
        this.totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
        this.generatePagination();
      },
      (error) => {
        console.error('Erreur lors de la récupération des utilisateurs', error);
      }
    );
  }

  // Fonction pour générer les numéros de pages
  generatePagination() {
    this.pageNumbers = [];
    for (let i = 1; i <= this.totalPages; i++) {
      this.pageNumbers.push(i);
    }
  }

  openAddUserModal() {
    console.log('Ouvrir le modal d\'ajout');
  }

  editUser(user: any) {
    console.log('Modifier l\'utilisateur', user);
  }

  deleteUser(userId: number) {
    console.log('Supprimer l\'utilisateur', userId);
  }

  // Fonction pour aller à la page précédente
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers(); // Recharge les utilisateurs pour la page précédente
    }
  }

  // Fonction pour aller à la page suivante
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers(); // Recharge les utilisateurs pour la page suivante
    }
  }

  // Fonction pour aller à une page spécifique
  goToPage(page: number) {
    this.currentPage = page;
    this.loadUsers(); // Recharge les utilisateurs pour la page choisie
  }
}
