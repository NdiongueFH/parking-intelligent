import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ParkingService, Parking } from '../services/parking.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-liste-parking',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule],
  templateUrl: './liste-parking.component.html',
  styleUrls: ['./liste-parking.component.css']
})
export class ListeParkingComponent implements OnInit {
  parkings: Parking[] = [];
  currentPage = 1;
  itemsPerPage = 4;
  searchTerm = '';

  constructor(private ParkingService: ParkingService) {}

  ngOnInit(): void {
    this.loadParkings();
  }

  loadParkings(): void {
    this.ParkingService.getAllParkings().subscribe({
      next: (data) => {
        this.parkings = data;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des parkings', error);
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredParkings.length / this.itemsPerPage);
  }

  get filteredParkings(): Parking[] {
    if (!this.searchTerm) {
      return this.parkings;
    }
    return this.parkings.filter(parking => 
      parking.nom_du_parking.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get paginatedParkings(): Parking[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredParkings.slice(startIndex, startIndex + this.itemsPerPage);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }
}