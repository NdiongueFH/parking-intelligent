import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
    selector: 'app-notification-modal',
    imports: [FormsModule, CommonModule],
    templateUrl: './notification-modal.component.html',
    styleUrls: ['./notification-modal.component.css']
})
export class NotificationModalComponent {
  @Input() message: string = '';
  @Input() isVisible: boolean = false;
  @Input() messageType: string = '';



  closeModal() {
    this.isVisible = false; // Ferme le modal
  }
}