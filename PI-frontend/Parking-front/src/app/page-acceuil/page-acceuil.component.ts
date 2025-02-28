// src/app/components/home/home.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './page-acceuil.component.html',
  styleUrls: ['./page-acceuil.component.css']
})
export class HomeComponent {
  features = [
    {
      title: 'Disponibilité en temps réel',
      description: 'Visualisez les places disponibles en temps réel',
      icon: 'parking.png'
    },
    {
      title: 'Réservation en ligne',
      description: 'Réservez votre place de parking en quelques clics',
      icon: 'reservation-en-ligne.png'
    },
    {
      title: 'Statistiques des réservations',
      description: 'Consultez les statistiques de vos réservations',
      icon: 'statis.png'
    }
  ];
}