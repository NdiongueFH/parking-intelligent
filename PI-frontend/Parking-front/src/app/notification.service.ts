import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root', // Le service est disponible dans toute l'application
})
export class NotificationService {
  constructor(private toastr: ToastrService) {}

  showNotification(message: string, title: string = 'Notification'): void {
    this.toastr.info(message, title, {
      positionClass: 'toast-bottom-right', // Position de la notification
      timeOut: 3000, // Durée d'affichage en ms
      extendedTimeOut: 1000, // Durée supplémentaire après hover
      closeButton: true, // Affiche le bouton de fermeture
      progressBar: true, // Affiche la barre de progression
    });
  }

  showSuccess(message: string, title: string = 'Succès'): void {
    this.toastr.success(message, title);
  }

  showError(message: string, title: string = 'Erreur'): void {
    this.toastr.error(message, title);
  }

  showWarning(message: string, title: string = 'Avertissement'): void {
    this.toastr.warning(message, title);
  }
}